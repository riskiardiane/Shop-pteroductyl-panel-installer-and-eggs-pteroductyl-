<?php

namespace Pterodactyl\Http\Controllers\Admin\Billing;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Routing\Controller;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Models\Billing\Plan;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Models\Billing\SubscriptionServer;
use Pterodactyl\Models\User;

class SubscriptionController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
    ) {
    }

    public function index(Request $request): View
    {
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $subscriptions = Subscription::with(['user', 'plan'])
            ->when(in_array($status, ['provisioning', 'active', 'suspended', 'expired', 'cancelled', 'failed'], true), fn ($query) => $query->where('status', $status))
            ->when($q !== '', function ($query) use ($q) {
                $query->where('server_identifier', 'like', "%{$q}%")
                    ->orWhere('server_uuid', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%")->orWhere('username', 'like', "%{$q}%"))
                    ->orWhereHas('plan', fn ($p) => $p->where('name', 'like', "%{$q}%")->orWhere('slug', 'like', "%{$q}%"));
            })
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return view('admin.billing.subscriptions.index', compact('subscriptions', 'status', 'q'));
    }

    public function show(Subscription $subscription): View
    {
        $subscription->load(['user', 'plan', 'order']);

        $servers = SubscriptionServer::query()
            ->where('subscription_id', $subscription->id)
            ->latest('id')
            ->get();

        $slotsUsed = SubscriptionServer::slotsUsed($subscription);

        return view('admin.billing.subscriptions.show', compact('subscription', 'servers', 'slotsUsed'));
    }

    public function suspend(Subscription $subscription): RedirectResponse
    {
        $subscription->forceFill(['status' => Subscription::STATUS_SUSPENDED])->save();
        $this->alert->warning('Subscription ditangguhkan. Catatan: server Pterodactyl TIDAK ikut ditangguhkan otomatis — lakukan dari menu Servers bila diperlukan.')->flash();

        return redirect()->route('admin.billing.subscriptions.show', $subscription->id);
    }

    public function activate(Subscription $subscription): RedirectResponse
    {
        $subscription->forceFill(['status' => Subscription::STATUS_ACTIVE])->save();
        $this->alert->success('Subscription diaktifkan kembali.')->flash();

        return redirect()->route('admin.billing.subscriptions.show', $subscription->id);
    }

    public function cancel(Subscription $subscription): RedirectResponse
    {
        $subscription->forceFill(['status' => Subscription::STATUS_CANCELLED])->save();
        $this->alert->success('Subscription dibatalkan.')->flash();

        return redirect()->route('admin.billing.subscriptions.show', $subscription->id);
    }

    /**
     * Beri langganan manual (kompensasi/testing) tanpa pembayaran.
     */
    public function grantForm(): View
    {
        $users = User::orderBy('username')->limit(500)->get(['id', 'username', 'email']);
        $plans = Plan::where('is_active', true)->orderBy('sort_order')->orderBy('price_monthly')->get(['id', 'name', 'slug', 'server_limit']);

        return view('admin.billing.subscriptions.grant', compact('users', 'plans'));
    }

    public function grantStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'months' => ['required', 'integer', 'min:1', 'max:36'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $plan = Plan::findOrFail($data['plan_id']);
        $subscription = Subscription::create([
            'user_id' => (int) $data['user_id'],
            'plan_id' => (int) $data['plan_id'],
            'order_id' => null,
            'status' => Subscription::STATUS_ACTIVE,
            'starts_at' => now(),
            'expires_at' => now()->addMonths((int) $data['months']),
            'auto_renew' => false,
            'meta' => array_filter([
                'source' => 'admin_grant',
                'note' => $data['note'] ?? null,
                'granted_by' => $request->user()?->username,
            ]),
        ]);

        $this->alert->success("Langganan manual {$plan->name} diberikan (subscription #{$subscription->id}), berlaku {$data['months']} bulan.")->flash();

        return redirect()->route('admin.billing.subscriptions.show', $subscription->id);
    }
}

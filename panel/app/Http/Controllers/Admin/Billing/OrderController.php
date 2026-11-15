<?php

namespace Pterodactyl\Http\Controllers\Admin\Billing;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Jobs\ProvisionServerJob;
use Pterodactyl\Models\Billing\Order;
use Pterodactyl\Models\Billing\Invoice;
use Pterodactyl\Models\Billing\Subscription;

class OrderController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
    ) {
    }

    public function index(Request $request): View
    {
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $orders = Order::with(['user', 'plan'])
            ->when(in_array($status, ['pending', 'paid', 'failed', 'cancelled', 'expired'], true), fn ($query) => $query->where('status', $status))
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('uuid', 'like', "%{$q}%")
                        ->orWhere('provider_ref', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%")->orWhere('username', 'like', "%{$q}%"))
                        ->orWhereHas('plan', fn ($p) => $p->where('name', 'like', "%{$q}%")->orWhere('slug', 'like', "%{$q}%"));
                });
            })
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $invoices = Invoice::whereIn('order_id', $orders->pluck('id'))->get()->keyBy('order_id');

        return view('admin.billing.orders.index', compact('orders', 'invoices', 'status', 'q'));
    }

    public function show(Order $order): View
    {
        $order->load(['user', 'plan']);
        $invoice = Invoice::where('order_id', $order->id)->first();
        $subscription = Subscription::where('order_id', $order->id)->with('plan')->first();

        return view('admin.billing.orders.show', compact('order', 'invoice', 'subscription'));
    }

    /**
     * Tandai invoice/order lunas secara manual (mis. bukti transfer di luar QRIS).
     * Idempoten: bila sudah paid, tidak melakukan apa-apa.
     */
    public function markPaid(Order $order): RedirectResponse
    {
        $dispatch = false;

        DB::transaction(function () use ($order, &$dispatch) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === 'paid') {
                return;
            }

            $locked->forceFill(['status' => 'paid', 'paid_at' => now()])->save();
            Invoice::where('order_id', $locked->id)->update(['status' => Invoice::STATUS_PAID, 'paid_at' => now()]);
            $this->activateSubscription($locked);
            $dispatch = true;
        });

        if ($dispatch) {
            ProvisionServerJob::dispatch($order->id);
            $this->alert->success('Order ditandai lunas. Job provisioning server telah di-dispatch.')->flash();
        } else {
            $this->alert->warning('Order ini sudah berstatus paid — tidak ada yang diubah.')->flash();
        }

        return redirect()->route('admin.billing.orders.show', $order->id);
    }

    public function cancel(Order $order): RedirectResponse
    {
        if ($order->status === 'paid') {
            $this->alert->error('Order yang sudah lunas tidak bisa dibatalkan dari sini.')->flash();

            return redirect()->route('admin.billing.orders.show', $order->id);
        }

        $order->forceFill(['status' => 'cancelled'])->save();
        Invoice::where('order_id', $order->id)->where('status', Invoice::STATUS_UNPAID)->update(['status' => Invoice::STATUS_EXPIRED]);

        $this->alert->success('Order dibatalkan dan invoice yang belum dibayar ditandai expired.')->flash();

        return redirect()->route('admin.billing.orders.show', $order->id);
    }

    /**
     * Perpanjang langganan yang cocok, atau buat subscription baru (provisioning).
     */
    private function activateSubscription(Order $order): void
    {
        $months = max(1, $order->cycleMonths());

        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('user_id', $order->user_id)
            ->where('plan_id', $order->plan_id)
            ->whereIn('status', [
                Subscription::STATUS_PROVISIONING,
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_SUSPENDED,
                Subscription::STATUS_EXPIRED,
                Subscription::STATUS_FAILED,
            ])
            ->latest('id')
            ->lockForUpdate()
            ->first();

        if ($subscription !== null) {
            $base = $subscription->expires_at !== null && $subscription->expires_at->isFuture()
                ? $subscription->expires_at->copy()
                : now();

            $hasServer = $subscription->pterodactyl_server_id !== null;

            $subscription->forceFill([
                'status' => $hasServer ? Subscription::STATUS_ACTIVE : Subscription::STATUS_PROVISIONING,
                'expires_at' => $base->addMonths($months),
            ])->save();

            return;
        }

        Subscription::create([
            'user_id' => $order->user_id,
            'plan_id' => $order->plan_id,
            'order_id' => $order->id,
            'status' => Subscription::STATUS_PROVISIONING,
            'starts_at' => now(),
            'expires_at' => now()->addMonths($months),
        ]);
    }
}

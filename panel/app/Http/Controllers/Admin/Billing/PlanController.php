<?php

namespace Pterodactyl\Http\Controllers\Admin\Billing;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Routing\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Billing\Plan;

class PlanController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
    ) {
    }

    public function index(): View
    {
        $plans = Plan::withCount('orders')->orderBy('sort_order')->orderBy('id')->get();

        return view('admin.billing.plans.index', compact('plans'));
    }

    public function create(): View
    {
        return view('admin.billing.plans.form', [
            'plan' => new Plan([
                'cpu' => 100, 'memory' => 2048, 'disk' => 10240, 'swap' => 0, 'io' => 500,
                'server_limit' => 1, 'backup_limit' => 3, 'database_limit' => 1, 'allocation_limit' => 1,
                'yearly_discount' => 15, 'is_active' => true, 'sort_order' => (int) Plan::max('sort_order') + 1,
            ]),
            'nests' => Nest::with('eggs')->orderBy('id')->get(),
            'nodes' => Node::orderBy('id')->get(['id', 'name']),
            'mode' => 'create',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request, null);
        $plan = Plan::create($data);
        $this->alert->success('Paket "' . $plan->name . '" berhasil dibuat.')->flash();

        return redirect()->route('admin.billing.plans');
    }

    public function edit(Plan $plan): View
    {
        return view('admin.billing.plans.form', [
            'plan' => $plan,
            'nests' => Nest::with('eggs')->orderBy('id')->get(),
            'nodes' => Node::orderBy('id')->get(['id', 'name']),
            'mode' => 'edit',
        ]);
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $data = $this->validated($request, $plan);
        $plan->update($data);
        $this->alert->success('Paket "' . $plan->name . '" berhasil diperbarui.')->flash();

        return redirect()->route('admin.billing.plans');
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        if ($plan->orders()->exists()) {
            $this->alert->error('Paket tidak bisa dihapus karena sudah punya transaksi. Nonaktifkan saja (is_active = off).')->flash();

            return redirect()->route('admin.billing.plans');
        }

        $plan->delete();
        $this->alert->success('Paket "' . $plan->name . '" dihapus.')->flash();

        return redirect()->route('admin.billing.plans');
    }

    /**
     * Validasi + normalisasi input form paket.
     */
    protected function validated(Request $request, ?Plan $plan): array
    {
        $features = $this->normalizeFeatures($request->input('features'));
        $environment = $this->normalizeJson($request->input('environment'));

        $data = $request->validate([
            'slug' => ['required', 'string', 'max:191', 'alpha_dash', Rule::unique('plans', 'slug')->ignore($plan?->id)],
            'name' => ['required', 'string', 'max:191'],
            'tagline' => ['nullable', 'string', 'max:191'],
            'price_monthly' => ['required', 'integer', 'min:0'],
            'yearly_discount' => ['required', 'integer', 'min:0', 'max:90'],
            'cpu' => ['required', 'integer', 'min:1'],
            'memory' => ['required', 'integer', 'min:1'],
            'disk' => ['required', 'integer', 'min:1'],
            'swap' => ['required', 'integer', 'min:0'],
            'io' => ['required', 'integer', 'min:0'],
            'bandwidth_label' => ['nullable', 'string', 'max:191'],
            'nest_id' => ['nullable', 'integer', 'exists:nests,id'],
            'egg_id' => ['nullable', 'integer', 'exists:eggs,id'],
            'node_id' => ['nullable', 'integer', 'exists:nodes,id'],
            'allocation_id' => ['nullable', 'integer', 'exists:allocations,id'],
            'docker_image' => ['nullable', 'string', 'max:191'],
            'startup' => ['nullable', 'string'],
            'server_limit' => ['required', 'integer', 'min:0'],
            'backup_limit' => ['required', 'integer', 'min:0'],
            'database_limit' => ['required', 'integer', 'min:0'],
            'allocation_limit' => ['required', 'integer', 'min:0'],
            'ribbon' => ['nullable', 'string', 'max:191'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $data['environment'] = $environment;
        $data['features'] = $features;
        $data['is_featured'] = $request->boolean('is_featured');
        $data['is_active'] = $request->boolean('is_active');

        return $data;
    }

    /**
     * Features: satu baris = satu poin; atau JSON array string.
     */
    protected function normalizeFeatures(mixed $input): ?array
    {
        if (! is_string($input) || trim($input) === '') {
            return null;
        }

        $input = trim($input);

        if (str_starts_with($input, '[')) {
            $decoded = json_decode($input, true);

            return is_array($decoded) ? array_values(array_map('strval', $decoded)) : null;
        }

        return array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $input))));
    }

    protected function normalizeJson(mixed $input): ?array
    {
        if (! is_string($input) || trim($input) === '') {
            return null;
        }

        $decoded = json_decode($input, true);

        return is_array($decoded) ? $decoded : null;
    }
}

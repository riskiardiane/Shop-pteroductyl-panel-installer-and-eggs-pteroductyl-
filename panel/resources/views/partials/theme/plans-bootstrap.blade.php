{{--
    Bootstrap data untuk halaman jualan (landing, pricing, checkout, dashboard).

    Sumber utama: tabel `plans` / `invoices` / `subscriptions` (fase 2).
    Bila tabel belum ada (belum `php artisan migrate`), blok ini tidak
    mengeluarkan error dan frontend memakai fallback statis di
    `resources/scripts/config/plans.ts`.
--}}
@php
    $panelPlans = [];
    $panelInvoices = [];
    $panelActivePlan = null;

    $formatMb = function (int $value): string {
        if ($value >= 1024) {
            $gb = $value / 1024;
            $label = floor($gb) === $gb ? (string) (int) $gb : number_format($gb, 1, ',', '.');

            return $label . ' GB';
        }

        return $value . ' MB';
    };

    $formatCpu = function (int $percent): string {
        $cores = $percent / 100;
        $label = floor($cores) === $cores ? (string) (int) $cores : number_format($cores, 1, ',', '.');

        return $label . ' vCPU';
    };

    try {
        if (class_exists(\Pterodactyl\Models\Billing\Plan::class)
            && \Illuminate\Support\Facades\Schema::hasTable('plans')) {
            $panelPlans = \Pterodactyl\Models\Billing\Plan::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('price_monthly')
                ->get()
                ->map(static function (\Pterodactyl\Models\Billing\Plan $plan) use ($formatMb, $formatCpu) {
                    return [
                        'slug' => $plan->slug,
                        'name' => $plan->name,
                        'tagline' => $plan->tagline ?? '',
                        'priceMonthly' => (int) $plan->price_monthly,
                        'yearlyDiscount' => (int) $plan->yearly_discount,
                        'featured' => (bool) $plan->is_featured,
                        'ribbon' => $plan->ribbon,
                        'stock' => $plan->stock !== null ? (int) $plan->stock : null,
                        'specs' => [
                            'cpu' => $formatCpu((int) $plan->cpu),
                            'ram' => $formatMb((int) $plan->memory),
                            'disk' => $formatMb((int) $plan->disk) . ' NVMe',
                            'bandwidth' => $plan->bandwidth_label ?: '—',
                        ],
                        'features' => array_values((array) ($plan->features ?? [])),
                    ];
                })
                ->all();
        }

        if (auth()->check()
            && class_exists(\Pterodactyl\Models\Billing\Invoice::class)
            && \Illuminate\Support\Facades\Schema::hasTable('invoices')) {
            $panelInvoices = \Pterodactyl\Models\Billing\Invoice::query()
                ->where('user_id', auth()->id())
                ->with(['order.plan'])
                ->latest('id')
                ->limit(30)
                ->get()
                ->map(static function (\Pterodactyl\Models\Billing\Invoice $invoice) {
                    $status = in_array($invoice->status, ['paid', 'unpaid', 'expired', 'refunded'], true)
                        ? $invoice->status
                        : 'unpaid';

                    return [
                        'id' => $invoice->number,
                        'planName' => optional(optional($invoice->order)->plan)->name ?? 'Layanan',
                        'amount' => (int) $invoice->total,
                        'status' => $status,
                        'dueDate' => $invoice->due_at !== null
                            ? $invoice->due_at->translatedFormat('d M Y')
                            : '-',
                    ];
                })
                ->all();
        }

        if (auth()->check()
            && class_exists(\Pterodactyl\Models\Billing\Subscription::class)
            && \Illuminate\Support\Facades\Schema::hasTable('subscriptions')) {
            $activeSubscription = \Pterodactyl\Models\Billing\Subscription::query()
                ->where('user_id', auth()->id())
                ->whereIn('status', ['provisioning', 'active', 'suspended'])
                ->with('plan')
                ->latest('id')
                ->first();

            $panelActivePlan = optional(optional($activeSubscription)->plan)->slug;
        }
    } catch (\Throwable $exception) {
        // Tabel belum dimigrasikan atau skema berbeda — biarkan fallback JS.
        $panelPlans = [];
        $panelInvoices = [];
        $panelActivePlan = null;
    }
@endphp
<script>
    window.PanelPlans = @json($panelPlans);
    window.PanelInvoices = @json($panelInvoices);
    window.PanelActivePlan = @json($panelActivePlan);
</script>

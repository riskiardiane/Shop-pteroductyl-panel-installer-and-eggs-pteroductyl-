<?php

namespace Pterodactyl\Http\Controllers\Billing;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Models\Billing\SubscriptionServer;

/**
 * Ringkasan benefit langganan pengguna yang sedang login — dipakai dashboard.
 * Data dibaca live dari tabel plans/subscriptions/subscription_servers.
 */
class BenefitsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subscriptions = Subscription::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', [
                Subscription::STATUS_PROVISIONING,
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_SUSPENDED,
                Subscription::STATUS_EXPIRED,
                Subscription::STATUS_CANCELLED,
            ])
            ->with(['plan'])
            ->latest('id')
            ->limit(10)
            ->get();

        $items = $subscriptions->map(function (Subscription $subscription) {
            $plan = $subscription->plan;
            $expiresAt = $subscription->expires_at;
            $startsAt = $subscription->starts_at;
            $daysRemaining = $expiresAt?->isFuture() ? (int) now()->diffInDays($expiresAt) : 0;
            $periodDays = ($startsAt !== null && $expiresAt !== null) ? max(1, (int) $startsAt->diffInDays($expiresAt)) : null;
            $elapsedDays = ($startsAt !== null) ? min((int) $startsAt->diffInDays(now()), $periodDays ?? PHP_INT_MAX) : null;

            $servers = SubscriptionServer::query()
                ->where('subscription_id', $subscription->id)
                ->latest('id')
                ->get()
                ->map(fn (SubscriptionServer $server) => [
                    'id' => $server->id,
                    'server_id' => $server->server_id,
                    'identifier' => $server->server_identifier,
                    'uuid' => $server->server_uuid,
                    'name' => $server->name,
                    'status' => $server->status,
                    'created_at' => optional($server->created_at)->toIso8601String(),
                ])
                ->values()
                ->all();

            // Sertakan server legacy (dibuat sebelum tabel subscription_servers ada).
            if ($subscription->pterodactyl_server_id !== null
                && ! collect($servers)->contains('server_id', (int) $subscription->pterodactyl_server_id)) {
                $servers[] = [
                    'id' => null,
                    'server_id' => (int) $subscription->pterodactyl_server_id,
                    'identifier' => $subscription->server_identifier,
                    'uuid' => $subscription->server_uuid,
                    'name' => ($plan?->name ?? 'Server') . ' • legacy',
                    'status' => $subscription->status === Subscription::STATUS_SUSPENDED ? 'suspended' : 'active',
                    'created_at' => null,
                ];
            }

            $used = SubscriptionServer::slotsUsed($subscription);
            $total = (int) ($plan?->server_limit ?? 1);
            $canCreate = $subscription->status === Subscription::STATUS_ACTIVE
                && ! $subscription->isExpired()
                && $used < $total;

            return [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'is_expired' => $subscription->isExpired(),
                'starts_at' => optional($startsAt)->toIso8601String(),
                'expires_at' => optional($expiresAt)->toIso8601String(),
                'expires_at_label' => optional($expiresAt)->translatedFormat('d M Y H:i'),
                'days_remaining' => $daysRemaining,
                'expires_soon' => $expiresAt !== null && $expiresAt->isFuture() && $daysRemaining <= 7,
                'period_days' => $periodDays,
                'period_progress' => ($periodDays !== null && $elapsedDays !== null) ? min(100, (int) round($elapsedDays / $periodDays * 100)) : null,
                'auto_renew' => (bool) $subscription->auto_renew,
                'plan' => $plan ? [
                    'id' => $plan->id,
                    'slug' => $plan->slug,
                    'name' => $plan->name,
                    'tagline' => $plan->tagline,
                    'specs' => [
                        'cpu' => $this->formatCpu((int) $plan->cpu),
                        'ram' => $this->formatMb((int) $plan->memory),
                        'disk' => $this->formatMb((int) $plan->disk) . ' NVMe',
                        'bandwidth' => $plan->bandwidth_label ?: '—',
                    ],
                    'limits' => [
                        'server' => (int) $plan->server_limit,
                        'backup' => (int) $plan->backup_limit,
                        'database' => (int) $plan->database_limit,
                        'allocation' => (int) $plan->allocation_limit,
                        'memory_mb' => (int) $plan->memory,
                        'cpu_percent' => (int) $plan->cpu,
                        'disk_mb' => (int) $plan->disk,
                    ],
                    'features' => array_values((array) ($plan->features ?? [])),
                    'price_monthly' => (int) $plan->price_monthly,
                ] : null,
                'slots' => [
                    'total' => $total,
                    'used' => $used,
                    'remaining' => max(0, $total - $used),
                ],
                'servers' => $servers,
                'can_create' => $canCreate,
                'block_reason' => $canCreate ? null : $this->blockReason($subscription, $used, $total),
            ];
        })->values();

        return response()->json([
            'subscriptions' => $items,
            'has_subscription' => $items->isNotEmpty(),
            'can_create' => $items->contains(fn (array $item) => $item['can_create']),
            'server_slots' => [
                'total' => $items->sum(fn (array $item) => $item['slots']['total']),
                'used' => $items->sum(fn (array $item) => $item['slots']['used']),
                'remaining' => $items->sum(fn (array $item) => $item['slots']['remaining']),
            ],
        ]);
    }

    private function blockReason(Subscription $subscription, int $used, int $total): string
    {
        if ($subscription->status === Subscription::STATUS_SUSPENDED) {
            return 'Langganan disuspend (masa berlaku habis atau manual). Perpanjang untuk membuat server.';
        }

        if ($subscription->status === Subscription::STATUS_EXPIRED) {
            return 'Langganan sudah berakhir. Perpanjang paket untuk membuat server.';
        }

        if ($subscription->status === Subscription::STATUS_CANCELLED) {
            return 'Langganan dibatalkan.';
        }

        if ($subscription->isExpired()) {
            return 'Langganan sudah berakhir. Perpanjang paket untuk membuat server.';
        }

        return sprintf('Slot server penuh (%d/%d). Upgrade paket untuk menambah slot.', $used, $total);
    }

    private function formatMb(int $value): string
    {
        if ($value >= 1024) {
            $gb = $value / 1024;
            $label = floor($gb) === $gb ? (string) (int) $gb : number_format($gb, 1, ',', '.');

            return $label . ' GB';
        }

        return $value . ' MB';
    }

    private function formatCpu(int $percent): string
    {
        $cores = $percent / 100;
        $label = floor($cores) === $cores ? (string) (int) $cores : number_format($cores, 1, ',', '.');

        return $label . ' vCPU';
    }
}

<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Services\Billing\PterodactylApplicationApi;
use Pterodactyl\Services\Billing\ServerProvisioner;
use Throwable;

/**
 * Suspend server yang masa aktifnya habis dan tandai langganan expired
 * setelah masa tenggang. Jadwalkan tiap jam:
 *
 *   $schedule->command('billing:expire')->hourly();
 */
class ExpireSubscriptions extends Command
{
    protected $signature = 'billing:expire
        {--delete : Hapus server setelah masa tenggang}
        {--dry-run : Tampilkan aksi tanpa memanggil API}';

    protected $description = 'Suspend server expired dan tandai langganan yang sudah melewati masa tenggang.';

    public function handle(ServerProvisioner $provisioner): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $delete = (bool) $this->option('delete');
        $graceDays = max(0, (int) config('billing.grace_days', 7));

        $toSuspend = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        $this->info("Akan disuspend: {$toSuspend->count()} langganan.");

        foreach ($toSuspend as $subscription) {
            if ($dryRun) {
                $ids = \Pterodactyl\Models\Billing\SubscriptionServer::serverIds($subscription);
                $this->line("[dry-run] suspend #{$subscription->id} servers [" . implode(',', $ids) . ']');
                continue;
            }

            try {
                $count = $provisioner->suspendAll($subscription);
            } catch (Throwable $exception) {
                Log::error('billing.expire.suspend_failed', [
                    'subscription_id' => $subscription->id,
                    'message' => $exception->getMessage(),
                ]);
                $this->error("Gagal suspend #{$subscription->id}: {$exception->getMessage()}");
                continue;
            }

            $subscription->forceFill([
                'status' => Subscription::STATUS_SUSPENDED,
                'meta' => array_merge((array) $subscription->meta, [
                    'suspended_at' => now()->toIso8601String(),
                ]),
            ])->save();

            $this->line("Disuspend #{$subscription->id} ({$count} server).");
        }

        $graceCutoff = now()->subDays($graceDays);

        $toExpire = Subscription::query()
            ->where('status', Subscription::STATUS_SUSPENDED)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $graceCutoff)
            ->get();

        $this->info("Akan ditandai expired: {$toExpire->count()} langganan.");

        foreach ($toExpire as $subscription) {
            if ($delete && $subscription->pterodactyl_server_id !== null) {
                if ($dryRun) {
                    $this->line("[dry-run] hapus server {$subscription->pterodactyl_server_id}");
                } else {
                    try {
                        foreach (\Pterodactyl\Models\Billing\SubscriptionServer::serverIds($subscription) as $serverId) {
                            app(PterodactylApplicationApi::class)->deleteServer($serverId);
                        }
                    } catch (Throwable $exception) {
                        Log::error('billing.expire.delete_failed', [
                            'subscription_id' => $subscription->id,
                            'message' => $exception->getMessage(),
                        ]);
                        $this->error("Gagal hapus server #{$subscription->id}: {$exception->getMessage()}");
                        continue;
                    }
                }
            }

            if ($dryRun) {
                $this->line("[dry-run] expired #{$subscription->id}");
                continue;
            }

            $subscription->forceFill([
                'status' => Subscription::STATUS_EXPIRED,
                'pterodactyl_server_id' => $delete ? null : $subscription->pterodactyl_server_id,
                'meta' => array_merge((array) $subscription->meta, [
                    'expired_at' => now()->toIso8601String(),
                ]),
            ])->save();

            $this->line("Expired #{$subscription->id}.");
        }

        return self::SUCCESS;
    }
}


<?php

namespace Pterodactyl\Services\Billing;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Models\Billing\SubscriptionServer;
use Pterodactyl\Services\Billing\PterodactylApplicationApi;
use RuntimeException;
use Throwable;

/**
 * Logika provisioning server benefit — dipakai oleh webhook renewal (unsuspend),
 * admin "Tandai Lunas", dan endpoint self-service "Buat Server".
 */
class ServerProvisioner
{
    public function __construct(private readonly PterodactylApplicationApi $api)
    {
    }

    /**
     * Buat satu server untuk subscription (self-service). Melempar RuntimeException
     * dengan pesan yang bisa ditampilkan ke pengguna bila gagal.
     */
    public function provision(Subscription $subscription, string $name): SubscriptionServer
    {
        // Slot check + placeholder di dalam satu transaksi agar double-submit
        // tidak lolos; panggilan API (lambat) dilakukan SETELAH commit.
        [$sub, $placeholder] = DB::transaction(function () use ($subscription, $name) {
            /** @var Subscription $sub */
            $sub = Subscription::query()
                ->with(['plan', 'user'])
                ->whereKey($subscription->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($sub->status !== Subscription::STATUS_ACTIVE) {
                throw new RuntimeException('Langganan tidak aktif. Perpanjang atau aktifkan langganan sebelum membuat server.');
            }

            if ($sub->isExpired()) {
                throw new RuntimeException('Langganan sudah berakhir. Perpanjang paket untuk membuat server.');
            }

            $plan = $sub->plan;

            if ($plan === null || ! $plan->isProvisionable()) {
                throw new RuntimeException('Paket belum lengkap (nest/egg/node/docker image/startup). Hubungi admin.');
            }

            $used = SubscriptionServer::slotsUsed($sub);

            if ($used >= (int) $plan->server_limit) {
                throw new RuntimeException(
                    sprintf('Slot server paket %s sudah penuh (%d/%d). Upgrade paket untuk menambah slot.', $plan->name, $used, (int) $plan->server_limit)
                );
            }

            $placeholder = SubscriptionServer::create([
                'subscription_id' => $sub->id,
                'name' => $name,
                'status' => SubscriptionServer::STATUS_PROVISIONING,
            ]);

            return [$sub, $placeholder];
        });

        try {
            $plan = $sub->plan;
            $user = $sub->user;

            $panelUser = $this->api->findUserByEmail($user->email)
                ?? $this->api->createUser($user->email, $user->name_first, $user->name_last);

            $allocationId = $plan->allocation_id ?: $this->api->firstFreeAllocation((int) $plan->node_id);

            if ($allocationId === null) {
                throw new RuntimeException('Tidak ada alokasi kosong pada node. Hubungi admin.');
            }

            $server = $this->api->createServer([
                'name' => $name,
                'user' => (int) $panelUser['id'],
                'egg' => (int) $plan->egg_id,
                'docker_image' => $plan->docker_image,
                'startup' => $plan->startup,
                'environment' => empty($plan->environment) ? new \stdClass() : $plan->environment,
                'limits' => [
                    'memory' => (int) $plan->memory,
                    'swap' => (int) $plan->swap,
                    'disk' => (int) $plan->disk,
                    'io' => (int) $plan->io,
                    'cpu' => (int) $plan->cpu,
                ],
                'feature_limits' => [
                    'databases' => (int) $plan->database_limit,
                    'allocations' => (int) $plan->allocation_limit,
                    'backups' => (int) $plan->backup_limit,
                ],
                'allocation' => ['default' => (int) $allocationId],
                'start_on_completion' => true,
            ]);

            $placeholder->forceFill([
                'server_id' => (int) $server['id'],
                'server_uuid' => $server['uuid'] ?? null,
                'server_identifier' => $server['identifier'] ?? null,
                'status' => SubscriptionServer::STATUS_ACTIVE,
            ])->save();

            // Kolom legacy untuk kompatibilitas tooling lama.
            if ($sub->pterodactyl_server_id === null) {
                $sub->forceFill([
                    'pterodactyl_server_id' => (int) $server['id'],
                    'server_uuid' => $server['uuid'] ?? null,
                    'server_identifier' => $server['identifier'] ?? null,
                ])->save();
            }

            return $placeholder->refresh();
        } catch (Throwable $exception) {
            $placeholder->forceFill([
                'status' => SubscriptionServer::STATUS_FAILED,
                'meta' => array_merge((array) $placeholder->meta, [
                    'provision_error' => mb_substr($exception->getMessage(), 0, 1000),
                ]),
            ])->save();

            Log::error('billing.provision.self_service_failed', [
                'subscription_id' => $sub->id,
                'message' => $exception->getMessage(),
            ]);

            throw $exception instanceof RuntimeException
                ? $exception
                : new RuntimeException('Gagal membuat server: ' . mb_substr($exception->getMessage(), 0, 300));
        }
    }

    /**
     * Suspend semua server milik subscription (expired). Kembalikan jumlah server yang diproses.
     */
    public function suspendAll(Subscription $subscription): int
    {
        $count = 0;

        foreach (SubscriptionServer::serverIds($subscription) as $serverId) {
            try {
                $this->api->suspendServer($serverId);
                $count++;
            } catch (Throwable $exception) {
                Log::error('billing.suspend.server_failed', [
                    'subscription_id' => $subscription->id,
                    'server_id' => $serverId,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        SubscriptionServer::query()
            ->where('subscription_id', $subscription->id)
            ->where('status', SubscriptionServer::STATUS_ACTIVE)
            ->update(['status' => SubscriptionServer::STATUS_SUSPENDED]);

        return $count;
    }

    /**
     * Unsuspend semua server milik subscription (setelah pembayaran perpanjangan).
     */
    public function unsuspendAll(Subscription $subscription): int
    {
        $count = 0;

        foreach (SubscriptionServer::serverIds($subscription) as $serverId) {
            try {
                $this->api->unsuspendServer($serverId);
                $count++;
            } catch (Throwable $exception) {
                // 409 biasanya berarti sudah running — bukan error fatal.
                Log::info('billing.unsuspend.skipped', [
                    'subscription_id' => $subscription->id,
                    'server_id' => $serverId,
                    'status' => method_exists($exception, 'response') ? $exception->response?->status() : null,
                ]);
            }
        }

        SubscriptionServer::query()
            ->where('subscription_id', $subscription->id)
            ->where('status', SubscriptionServer::STATUS_SUSPENDED)
            ->update(['status' => SubscriptionServer::STATUS_ACTIVE]);

        return $count;
    }
}

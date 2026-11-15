<?php

namespace Pterodactyl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Billing\Order;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Services\Billing\ServerProvisioner;
use Throwable;

/**
 * Dipanggil setelah pembayaran webhook / admin mark-paid.
 *
 * Model benefit saat ini SELF-SERVICE: pembelian mengaktifkan langganan dan
 * pengguna membuat server sendiri dari dashboard (tombol "Buat Server").
 * Job ini TIDAK membuat server otomatis — hanya memastikan langganan aktif
 * dan server yang tersuspend karena kadaluarsa diaktifkan kembali.
 */
class ProvisionServerJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(public int $orderId)
    {
    }

    /**
     * @return int[]
     */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(ServerProvisioner $provisioner): void
    {
        $order = Order::with(['plan', 'user'])->find($this->orderId);

        if ($order === null || $order->status !== 'paid') {
            return;
        }

        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('user_id', $order->user_id)
            ->where('plan_id', $order->plan_id)
            ->latest('id')
            ->first();

        if ($subscription === null) {
            throw new \RuntimeException("Subscription untuk order {$order->id} tidak ditemukan.");
        }

        $provisioner->unsuspendAll($subscription);

        $subscription->forceFill(['status' => Subscription::STATUS_ACTIVE])->save();
    }

    public function failed(Throwable $exception): void
    {
        Log::error('billing.provision.job_failed', [
            'order_id' => $this->orderId,
            'message' => $exception->getMessage(),
        ]);
    }
}

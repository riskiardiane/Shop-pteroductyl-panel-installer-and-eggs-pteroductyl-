<?php

namespace Pterodactyl\Http\Controllers\Billing;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Routing\Controller;
use Pterodactyl\Jobs\ProvisionServerJob;
use Pterodactyl\Models\Billing\Invoice;
use Pterodactyl\Models\Billing\Order;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Models\Billing\WebhookEvent;
use Pterodactyl\Services\Billing\MustikaPaymentService;
use Throwable;

/**
 * Webhook pembayaran MustikaPay.
 *
 * URL: POST https://panel.exions.web.id/webhooks/mustika
 *
 * Keamanan:
 *   - HMAC-SHA256(hex) dari RAW BODY, secret = API key Mustika.
 *   - Header X-Signature, X-Signature-Algorithm, X-Timestamp.
 *   - Idempoten lewat tabel `webhook_events` (unique provider + event_id).
 *   - Nominal wajib sama dengan order.
 */
class MustikaWebhookController extends Controller
{
    public function __invoke(Request $request, MustikaPaymentService $mustika): JsonResponse
    {
        $raw = $request->getContent();

        if ($raw === '' || strlen($raw) > 1024 * 1024) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        if (! $mustika->verifyWebhook(
            $raw,
            $request->header('X-Signature'),
            $request->header('X-Signature-Algorithm'),
            $request->header('X-Timestamp')
        )) {
            Log::warning('billing.webhook.invalid_signature', [
                'ip' => $request->ip(),
                'signature' => Str::limit((string) $request->header('X-Signature'), 16, '…'),
            ]);

            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $payload = json_decode($raw, true);

        if (! is_array($payload)) {
            return response()->json(['message' => 'Invalid JSON'], 422);
        }

        $eventId = $mustika->eventIdFromPayload($payload, $raw);

        $event = null;

        try {
            $event = WebhookEvent::firstOrCreate(
                ['provider' => 'mustika', 'event_id' => $eventId],
                ['event_type' => $mustika->payloadStatus($payload), 'payload' => $payload]
            );
        } catch (QueryException $exception) {
            // Race: request lain membuat event yang sama lebih dulu.
            $event = WebhookEvent::where('provider', 'mustika')->where('event_id', $eventId)->first();
        }

        if ($event === null) {
            return response()->json(['message' => 'Unable to record event'], 500);
        }

        if (! $event->wasRecentlyCreated && $event->isProcessed()) {
            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        $reference = $mustika->referenceFromPayload($payload);

        if ($reference === null) {
            return response()->json(['message' => 'Missing reference'], 422);
        }

        $order = Order::where('provider_ref', $reference)->first();

        if ($order === null) {
            // Jangan tandai processed supaya provider mengirim ulang ketika
            // order sudah tersedia (mis. race dengan commit checkout).
            Log::warning('billing.webhook.order_not_found', ['reference' => $reference]);

            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($mustika->isPaid($payload) && $mustika->paidAmount($payload) !== (int) $order->amount) {
            Log::critical('billing.webhook.amount_mismatch', [
                'reference' => $reference,
                'expected' => (int) $order->amount,
                'received' => $mustika->paidAmount($payload),
            ]);

            return response()->json(['message' => 'Amount mismatch'], 422);
        }

        $shouldProvision = false;

        try {
            DB::transaction(function () use ($event, $order, $payload, $mustika, &$shouldProvision) {
                /** @var Order $lockedOrder */
                $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                /** @var WebhookEvent $lockedEvent */
                $lockedEvent = WebhookEvent::whereKey($event->id)->lockForUpdate()->firstOrFail();

                if ($lockedEvent->isProcessed()) {
                    return;
                }

                if ($mustika->isPaid($payload)) {
                    if ($lockedOrder->status !== 'paid') {
                        $lockedOrder->forceFill([
                            'status' => 'paid',
                            'paid_at' => now(),
                            'meta' => array_merge((array) $lockedOrder->meta, [
                                'webhook' => $payload,
                                'issuer' => $mustika->issuer($payload),
                            ]),
                        ])->save();

                        Invoice::where('order_id', $lockedOrder->id)->update([
                            'status' => Invoice::STATUS_PAID,
                            'paid_at' => now(),
                        ]);

                        $this->activateSubscription($lockedOrder);

                        // Selalu dispatch: job juga melakukan unsuspend untuk
                        // perpanjangan server yang sebelumnya ditangguhkan.
                        $shouldProvision = true;
                    }
                } elseif ($mustika->isFailed($payload) && $lockedOrder->status === 'pending') {
                    $status = $mustika->payloadStatus($payload) === 'expired' ? 'expired' : 'failed';

                    $lockedOrder->forceFill(['status' => $status])->save();
                    Invoice::where('order_id', $lockedOrder->id)->update([
                        'status' => Invoice::STATUS_EXPIRED,
                    ]);
                }

                $lockedEvent->forceFill(['processed_at' => now(), 'error' => null])->save();
            });
        } catch (Throwable $exception) {
            $event->forceFill(['error' => Str::limit($exception->getMessage(), 1000, '')])->save();
            report($exception);

            return response()->json(['message' => 'Processing failed'], 500);
        }

        if ($shouldProvision) {
            ProvisionServerJob::dispatch($order->id);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Perpanjang langganan yang cocok, atau buat baru.
     *
     * @return bool true bila server masih perlu dibuat (belum ada server_id)
     */
    private function activateSubscription(Order $order): bool
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

            return ! $hasServer;
        }

        Subscription::create([
            'user_id' => $order->user_id,
            'plan_id' => $order->plan_id,
            'order_id' => $order->id,
            'status' => Subscription::STATUS_PROVISIONING,
            'starts_at' => now(),
            'expires_at' => now()->addMonths($months),
        ]);

        return true;
    }
}

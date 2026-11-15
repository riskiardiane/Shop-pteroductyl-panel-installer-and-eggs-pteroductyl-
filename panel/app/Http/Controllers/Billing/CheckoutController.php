<?php

namespace Pterodactyl\Http\Controllers\Billing;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Billing\Invoice;
use Pterodactyl\Models\Billing\Order;
use Pterodactyl\Models\Billing\Plan;
use Pterodactyl\Services\Billing\MustikaPaymentService;
use Throwable;

class CheckoutController extends Controller
{
    /**
     * Buat order + invoice lalu minta QRIS ke MustikaPay.
     */
    public function store(Request $request, MustikaPaymentService $mustika): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', 'string', 'max:64'],
            'cycle' => ['required', Rule::in(['monthly', 'quarterly', 'yearly'])],
        ]);

        $plan = Plan::where('slug', $data['plan'])->where('is_active', true)->first();

        if ($plan === null) {
            return response()->json(['message' => 'Paket tidak ditemukan atau tidak aktif.'], 404);
        }

        if (! $plan->isAvailable()) {
            return response()->json(['message' => 'Stok paket ini sedang habis.'], 422);
        }

        if (! $plan->isProvisionable()) {
            return response()->json([
                'message' => 'Paket belum siap untuk provisioning. Hubungi admin.',
            ], 422);
        }

        $amount = $plan->priceFor($data['cycle']);
        $invoiceNumber = $this->generateInvoiceNumber();

        /** @var Order $order */
        $order = DB::transaction(function () use ($request, $plan, $data, $amount, $invoiceNumber) {
            $order = Order::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $request->user()->id,
                'plan_id' => $plan->id,
                'cycle' => $data['cycle'],
                'amount' => $amount,
                'status' => 'pending',
                'payment_provider' => 'mustika',
                'expires_at' => now()->addMinutes((int) config('billing.checkout.expiry_minutes', 30)),
            ]);

            Invoice::create([
                'number' => $invoiceNumber,
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
                'subtotal' => $amount,
                'discount' => 0,
                'total' => $amount,
                'status' => Invoice::STATUS_UNPAID,
                'due_at' => $order->expires_at,
            ]);

            return $order;
        });

        $order->load(['plan', 'user']);

        $invoice = $order->invoice()->firstOrFail();
        $successUrl = $this->successUrlFor($order, $invoice->number);

        try {
            $response = $mustika->createQris($order, $invoice, $successUrl);
        } catch (Throwable $exception) {
            $order->forceFill(['status' => 'failed'])->save();
            $order->invoice()->update(['status' => Invoice::STATUS_EXPIRED]);
            report($exception);

            return response()->json([
                'message' => 'Gagal membuat pembayaran QRIS. Silakan coba lagi.',
            ], 502);
        }

        $reference = $mustika->referenceFromCreateResponse($response);

        if ($reference === null) {
            $order->forceFill(['status' => 'failed', 'meta' => $response])->save();
            $order->invoice()->update(['status' => Invoice::STATUS_EXPIRED]);

            report(new \RuntimeException('Mustika create/qris tidak mengembalikan referensi: ' . json_encode($response)));

            return response()->json([
                'message' => 'Provider tidak mengembalikan referensi pembayaran.',
            ], 502);
        }

        $order->forceFill([
            'provider_ref' => $reference,
            'qr_url' => $mustika->qrUrlFromCreateResponse($response),
            'qr_string' => $mustika->qrStringFromCreateResponse($response),
            'meta' => $response,
        ])->save();

        return response()->json([
            'order_uuid' => $order->uuid,
            'invoice' => $invoiceNumber,
            'amount' => (int) $order->amount,
            'reference' => $reference,
            'qr_url' => $order->qr_url,
            'qr_string' => $order->qr_string,
            'status' => $order->status,
            'expires_at' => optional($order->expires_at)->toIso8601String(),
            'status_url' => route('billing.orders.show', ['uuid' => $order->uuid]),
            'success_url' => $successUrl,
        ], 201);
    }

    /**
     * Status order untuk polling halaman /success atau halaman QR.
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        $order = Order::query()
            ->where('uuid', $uuid)
            ->where('user_id', $request->user()->id)
            ->with(['invoice', 'plan'])
            ->firstOrFail();

        return response()->json([
            'order_uuid' => $order->uuid,
            'status' => $order->status,
            'paid_at' => optional($order->paid_at)->toIso8601String(),
            'amount' => (int) $order->amount,
            'invoice' => optional($order->invoice)->number,
            'plan' => optional($order->plan)->name,
            'expires_at' => optional($order->expires_at)->toIso8601String(),
            'qr_url' => $order->qr_url,
            'qr_string' => $order->qr_string,
        ]);
    }

    private function successUrlFor(Order $order, string $invoiceNumber): string
    {
        $base = (string) config('billing.checkout.success_url');
        $separator = str_contains($base, '?') ? '&' : '?';

        return $base . $separator . http_build_query([
            'order' => $order->uuid,
            'invoice' => $invoiceNumber,
            'amount' => (int) $order->amount,
        ]);
    }

    private function generateInvoiceNumber(): string
    {
        $prefix = (string) config('billing.invoice_prefix', 'INV');

        do {
            $number = sprintf(
                '%s-%s-%s',
                $prefix,
                now()->format('ymd'),
                strtoupper(Str::random(6))
            );
        } while (Invoice::where('number', $number)->exists());

        return $number;
    }
}

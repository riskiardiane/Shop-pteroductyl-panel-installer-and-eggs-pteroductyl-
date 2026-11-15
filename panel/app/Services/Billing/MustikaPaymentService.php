<?php

namespace Pterodactyl\Services\Billing;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Pterodactyl\Models\Billing\Invoice;
use Pterodactyl\Models\Billing\Order;
use RuntimeException;

/**
 * Klien MustikaPayment (QRIS) + verifikasi webhook.
 *
 * Semua komunikasi ke provider dilakukan dari server. API key tidak pernah
 * dikirim ke browser.
 */
class MustikaPaymentService
{
    private const STATUS_PAID = ['success', 'paid', 'settled', 'completed', 'capture'];
    private const STATUS_FAILED = ['failed', 'expired', 'cancelled', 'canceled', 'denied', 'refunded'];

    public function createQris(Order $order, Invoice $invoice, ?string $redirectUrl = null): array
    {
        $apiKey = (string) config('billing.mustika.api_key');

        if ($apiKey === '') {
            throw new RuntimeException('MUSTIKA_API_KEY belum diatur pada .env.');
        }

        $payload = [
            'amount' => (int) $order->amount,
            'product_name' => Str::limit($order->plan->name . ' — ' . $invoice->number, 120, ''),
            'customer_name' => Str::limit($order->user->username ?: $order->user->email, 80, ''),
            'expiry' => (int) config('billing.checkout.expiry_minutes', 30),
            'redirect_url' => $redirectUrl ?: (string) config('billing.checkout.success_url'),
        ];

        $response = Http::asForm()
            ->withHeaders(['X-Api-Key' => $apiKey])
            ->timeout(20)
            ->post(rtrim((string) config('billing.mustika.base_url'), '/') . '/api/v1/create/qris', $payload);

        if (! $response->successful()) {
            throw new RuntimeException(sprintf(
                'MustikaPayment create/qris gagal (HTTP %d): %s',
                $response->status(),
                Str::limit($response->body(), 500)
            ));
        }

        $json = $response->json();

        if (! is_array($json)) {
            throw new RuntimeException('Respons MustikaPayment bukan JSON yang valid.');
        }

        return $json;
    }

    /**
     * Ambil referensi pembayaran dari respons create/qris. Bentuk respons
     * provider bisa berbeda-beda, jadi pencarian dilakukan rekursif.
     */
    public function referenceFromCreateResponse(array $response): ?string
    {
        return $this->deepFind($response, [
            'reference',
            'ref_no',
            'order_id',
            'transaction_id',
            'id',
        ]);
    }

    public function qrUrlFromCreateResponse(array $response): ?string
    {
        return $this->deepFind($response, ['qr_url', 'payment_url', 'qr_link']);
    }

    public function qrStringFromCreateResponse(array $response): ?string
    {
        return $this->deepFind($response, ['qr_string', 'qr_code', 'qr_content', 'qr']);
    }

    /**
     * Cari nilai scalar pertama untuk key tertentu, maksimal 4 level.
     *
     * @param string[] $keys
     */
    private function deepFind(array $data, array $keys, int $depth = 0): ?string
    {
        if ($depth > 4) {
            return null;
        }

        foreach ($keys as $key) {
            $value = $data[$key] ?? null;

            if (is_scalar($value) && (string) $value !== '') {
                return (string) $value;
            }
        }

        foreach ($data as $value) {
            if (is_array($value)) {
                $found = $this->deepFind($value, $keys, $depth + 1);

                if ($found !== null) {
                    return $found;
                }
            }
        }

        return null;
    }

    /**
     * Verifikasi signature webhook.
     *
     * Provider mengirim HMAC-SHA256 (hex) dari RAW BODY dengan API key sebagai
     * secret, di header X-Signature. Jangan decode/encode ulang body sebelum
     * verifikasi.
     */
    public function verifyWebhook(string $rawBody, ?string $signature, ?string $algorithm = null, ?string $timestamp = null): bool
    {
        $apiKey = (string) config('billing.mustika.api_key');

        if ($apiKey === '' || $signature === null || $signature === '') {
            return false;
        }

        if ($algorithm !== null && $algorithm !== '') {
            $normalized = strtoupper(str_replace(['-', '_'], '', $algorithm));

            if ($normalized !== 'HMACSHA256') {
                return false;
            }
        }

        $expected = hash_hmac('sha256', $rawBody, $apiKey);

        if (! hash_equals($expected, strtolower(trim($signature)))) {
            return false;
        }

        return $this->timestampWithinTolerance($timestamp);
    }

    private function timestampWithinTolerance(?string $timestamp): bool
    {
        $tolerance = (int) config('billing.mustika.timestamp_tolerance', 0);

        if ($tolerance <= 0 || $timestamp === null || $timestamp === '') {
            return true;
        }

        $sentAt = strtotime($timestamp);

        // Header timestamp ada tapi tidak bisa dibaca -> tolak.
        if ($sentAt === false) {
            return false;
        }

        return abs(now()->getTimestamp() - $sentAt) <= $tolerance;
    }

    public function payloadStatus(array $payload): string
    {
        return strtolower((string) (Arr::get($payload, 'data.status') ?? Arr::get($payload, 'status') ?? ''));
    }

    public function isPaid(array $payload): bool
    {
        return in_array($this->payloadStatus($payload), self::STATUS_PAID, true);
    }

    public function isFailed(array $payload): bool
    {
        return in_array($this->payloadStatus($payload), self::STATUS_FAILED, true);
    }

    /**
     * Referensi yang dipakai untuk mencocokkan webhook dengan order.
     * Contoh payload: reference = "QR1776670534209".
     */
    public function referenceFromPayload(array $payload): ?string
    {
        foreach ([
            'reference',
            'order_id',
            'data.ref_no',
            'data.reference',
            'data.order_id',
        ] as $key) {
            $value = Arr::get($payload, $key);

            if (is_scalar($value) && (string) $value !== '') {
                return (string) $value;
            }
        }

        return null;
    }

    /**
     * ID unik event untuk idempotensi. Sertakan status supaya transisi
     * expired -> paid tetap bisa diproses.
     */
    public function eventIdFromPayload(array $payload, string $rawBody): string
    {
        $base = (string) (Arr::get($payload, 'data.provider_ref')
            ?? Arr::get($payload, 'data.ref_no')
            ?? Arr::get($payload, 'reference')
            ?? Arr::get($payload, 'id')
            ?? hash('sha256', $rawBody));

        return Str::limit($base, 150, '') . ':' . ($this->payloadStatus($payload) ?: 'unknown');
    }

    public function paidAmount(array $payload): int
    {
        return (int) (Arr::get($payload, 'data.amount') ?? Arr::get($payload, 'amount') ?? 0);
    }

    public function issuer(array $payload): ?string
    {
        $issuer = Arr::get($payload, 'data.issuer');

        return is_scalar($issuer) ? (string) $issuer : null;
    }
}

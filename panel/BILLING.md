# Billing & Auto-Provisioning (Fase 2) — QRIS MustikaPay

Implementasi nyata untuk alur:

```
pilih paket → checkout → QRIS → webhook → invoice lunas → server dibuat otomatis
```

Semua kode sudah ada di repo (lihat daftar file di bawah). Yang tersisa hanya
konfigurasi `.env`, migrate/seed, dan deploy ke VPS.

---

## 1. File yang ditambahkan

### Backend

| File | Fungsi |
| --- | --- |
| `config/billing.php` | Konfigurasi MustikaPay, Pterodactyl API, grace period |
| `database/migrations/2026_11_14_000000_create_billing_tables.php` | Tabel `plans`, `orders`, `invoices`, `subscriptions`, `webhook_events` |
| `app/Models/Billing/Plan.php` | Model + `priceFor()` / `cycle` |
| `app/Models/Billing/Order.php` | Order pembayaran |
| `app/Models/Billing/Invoice.php` | Invoice |
| `app/Models/Billing/Subscription.php` | Langganan ↔ server Pterodactyl |
| `app/Models/Billing/WebhookEvent.php` | Audit + idempotensi webhook |
| `app/Services/Billing/MustikaPaymentService.php` | Buat QRIS + verifikasi HMAC webhook |
| `app/Services/Billing/PterodactylApplicationApi.php` | Wrapper Application API |
| `app/Http/Controllers/Billing/CheckoutController.php` | `POST /api/billing/checkout`, `GET /api/billing/orders/{uuid}` |
| `app/Http/Controllers/Billing/MustikaWebhookController.php` | `POST /webhooks/mustika` |
| `app/Http/Controllers/Billing/InvoiceController.php` | `GET /api/billing/invoices` |
| `app/Jobs/ProvisionServerJob.php` | Buat/aktifkan server di queue |
| `app/Console/Commands/ExpireSubscriptions.php` | Command `billing:expire` |
| `app/Providers/BillingServiceProvider.php` | Memuat `routes/billing.php` |
| `routes/billing.php` | Definisi route billing |
| `database/seeders/BillingPlanSeeder.php` | Seed 3 paket awal |

### Frontend

| File | Fungsi |
| --- | --- |
| `resources/scripts/api/billing.ts` | Klien endpoint billing (axios + CSRF) |
| `resources/scripts/components/billing/CheckoutPage.tsx` | Halaman `/checkout` + QR + polling |
| `resources/scripts/components/billing/SuccessPage.tsx` | Halaman `/success` |
| `resources/views/partials/theme/plans-bootstrap.blade.php` | Inject `window.PanelPlans` / `PanelInvoices` dari DB |

---

## 2. Konfigurasi `.env`

```env
APP_URL=https://panel.exions.web.id

# MustikaPay
MUSTIKA_BASE_URL=https://mustikapayment.com
MUSTIKA_API_KEY=xxxxxxxxxxxxxxxx
MUSTIKA_TIMESTAMP_TOLERANCE=0

# Redirect setelah bayar (persis seperti yang diminta)
BILLING_SUCCESS_URL=https://panel.exions.web.id/success
BILLING_CANCEL_URL=https://panel.exions.web.id/pricing
BILLING_EXPIRY_MINUTES=30
BILLING_INVOICE_PREFIX=INV
BILLING_GRACE_DAYS=7

# Application API Pterodactyl (buat di /admin/api)
PTERODACTYL_APP_URL=https://panel.exions.web.id
PTERODACTYL_APP_API_KEY=xxxxxxxxxxxxxxxx
```

Permission API key yang dibutuhkan: `users.read`, `users.write`,
`servers.read`, `servers.write`, `nodes.read`.

Alternatif cepat: file contoh `billing.env.example` bisa di-append ke `.env`.

### Daftarkan provider

Tambahkan di `config/app.php` (array `providers`, bagian aplikasi):

```php
Pterodactyl\Providers\BillingServiceProvider::class,
```

> Alternatif tanpa provider: tambahkan
> `require base_path('routes/billing.php');` di akhir `routes/web.php`.

### Daftarkan webhook di dashboard MustikaPay

- URL: `https://panel.exions.web.id/webhooks/mustika`
- Method: `POST`
- Header signature: `X-Signature` + `X-Signature-Algorithm` + `X-Timestamp`

`BILLING_SUCCESS_URL` sudah dipakai sebagai `redirect_url` saat membuat QRIS,
ditambah query `?order={uuid}&invoice={number}` supaya halaman `/success` bisa
menampilkan status dan memverifikasi pembayaran. Setelah bayar user diarahkan ke
`https://panel.exions.web.id/success?order=…&invoice=…`.

---

## 3. Deploy

```bash
cd /var/www/pterodactyl

# 1. Migrasi + seed paket
php artisan migrate --force
php artisan db:seed --class=BillingPlanSeeder --force

# 2. Cache
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan queue:restart
php artisan optimize

# 3. Queue worker (wajib untuk provisioning)
#    Pastikan supervisor menjalankan:
#    php artisan queue:work --tries=3 --timeout=120
```

Tambahkan cron suspend di `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('billing:expire')->hourly();
    // opsional: hapus server setelah grace period
    // $schedule->command('billing:expire --delete')->dailyAt('03:00');
}
```

Jangan lupa `php artisan schedule:run` tiap menit di crontab:

```
* * * * * cd /var/www/pterodactyl && php artisan schedule:run >> /dev/null 2>&1
```

Build frontend setelah upload source theme:

```bash
yarn install
yarn run build:production
```

---

## 4. Cara mengatur target provisioning paket

Seeder mengisi `nest_id`, `egg_id`, `node_id`, `docker_image`, `startup`, dan
`environment` dari env (default `1`). **Wajib disesuaikan** dengan node kamu,
kalau tidak `ProvisionServerJob` akan menolak dengan pesan jelas.

Cek ID di panel:

- Nest/Egg: `/admin/nests`
- Node: `/admin/nodes`
- Allocation bebas: halaman node → tab Allocation

Contoh update via tinker:

```bash
php artisan tinker
```

```php
$plan = \Pterodactyl\Models\Billing\Plan::where('slug', 'growth')->first();
$plan->update([
    'nest_id' => 1,
    'egg_id' => 1,
    'node_id' => 1,
    'allocation_id' => null,        // null = pilih otomatis alokasi kosong
    'docker_image' => 'ghcr.io/parkervcp/yolks:java_17',
    'startup' => 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
    'environment' => [
        'SERVER_JARFILE' => 'server.jar',
        'VANILLA_VERSION' => 'latest',
    ],
]);
```

`environment` harus cocok dengan variabel egg. Kalau kosong sementara egg
memiliki variabel wajib, Application API akan menolak pembuatan server (422).

Harga & resource juga bisa diubah di tabel `plans`
(`price_monthly`, `cpu` dalam persen, `memory`/`disk` dalam MiB).

---

## 5. Endpoint

| Method | Path | Akses | Keterangan |
| --- | --- | --- | --- |
| `POST` | `/webhooks/mustika` | publik + HMAC | Callback MustikaPay |
| `POST` | `/api/billing/checkout` | login + CSRF | Buat order + QRIS |
| `GET` | `/api/billing/orders/{uuid}` | login | Polling status order |
| `GET` | `/api/billing/invoices` | login | Riwayat invoice |
| `GET` | `/checkout?plan=growth&cycle=monthly` | publik (UI) | Halaman checkout |
| `GET` | `/success?order=…&invoice=…` | publik (UI) | Halaman sukses |

Contoh respons `checkout`:

```json
{
  "order_uuid": "0f2c…",
  "invoice": "INV-261114-A1B2C3",
  "amount": 45000,
  "reference": "QR1776670534209",
  "qr_url": "https://…/qr.png",
  "qr_string": "00020101021226…",
  "status": "pending",
  "expires_at": "2026-11-14T21:45:00+07:00",
  "status_url": "https://panel.exions.web.id/api/billing/orders/0f2c…",
  "success_url": "https://panel.exions.web.id/success"
}
```

Respons provider mungkin membungkus QR (`data.qr_url`, `data.qr_string`, dll).
`MustikaPaymentService` mencari key secara rekursif, tetapi **cek sekali**
dengan transaksi nyata dan sesuaikan di method
`referenceFromCreateResponse()` / `qrUrlFromCreateResponse()` bila perlu.

---

## 6. Webhook: cara kerja & keamanan

### Verifikasi signature (persis seperti dokumentasi provider)

```php
$raw = file_get_contents('php://input');
$expected = hash_hmac('sha256', $raw, $apiKey);

if (! hash_equals($expected, strtolower(trim($_SERVER['HTTP_X_SIGNATURE'] ?? '')))) {
    http_response_code(401);
    exit('Invalid signature');
}
```

Implementasi Laravel menggunakan `$request->getContent()` (raw body, tanpa
decode/encode ulang), lalu `hash_equals`. Urutan header yang dicek:

1. `X-Signature-Algorithm` harus `HMAC-SHA256` (kalau dikirim).
2. `X-Signature` = hex HMAC-SHA256 dari **raw body** dengan `MUSTIKA_API_KEY`.
3. `X-Timestamp` dalam toleransi `MUSTIKA_TIMESTAMP_TOLERANCE` detik
   (default `0` = tidak dicek). Aktifkan (mis. `300`) bila provider selalu
   mengirim timestamp baru tiap percobaan; timestamp membantu mencegah replay.

### Idempotensi

`event_id = provider_ref|reference|… + ":" + status`, disimpan unik di
`webhook_events (provider, event_id)`. Event yang sudah `processed_at` tidak
diproses dua kali. Status disertakan supaya transisi `expired → paid` tetap
bisa diproses.

### Rekonsiliasi

- Cari `orders.provider_ref = payload.reference` (contoh `QR1776670534209`).
- Nominal `payload.data.amount` atau `payload.amount` **harus sama** dengan
  `orders.amount`; kalau beda → HTTP 422 + log critical.
- Order tidak ditemukan → HTTP 404 (provider akan retry; jangan tandai event
  selesai).
- Status sukses: `success`, `paid`, `settled`, `completed`, `capture`.
- Status gagal: `failed`, `expired`, `cancelled`, `canceled`, `denied`, `refunded`.

### Efek saat lunas

1. `orders.status = paid`, `paid_at = now()`.
2. `invoices.status = paid`, `paid_at = now()`.
3. `subscriptions` dibuat/diperpanjang
   (`expires_at = max(now, expires_at) + cycle`).
4. `ProvisionServerJob` di-dispatch **setelah commit** (queue).

Respons webhook selalu JSON `{"ok": true}` (atau error yang jelas) dan cepat;
proses berat ada di queue.

### Test manual

```bash
SECRET="API_KEY_KAMU"
BODY='{"status":"success","service":"QRIS","amount":22500,"reference":"QR123","data":{"amount":22500,"status":"SUCCESS","ref_no":"QR123"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
TS=$(date +"%Y-%m-%dT%H:%M:%S%z")

curl -i -X POST https://panel.exions.web.id/webhooks/mustika \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -H "X-Signature-Algorithm: HMAC-SHA256" \
  -H "X-Timestamp: $TS" \
  --data-raw "$BODY"
```

`QR123` harus sudah ada di `orders.provider_ref` (buat order uji lewat
checkout). Hasil yang diharapkan: `200 {"ok":true}`, invoice jadi `paid`, lalu
server dibuat oleh queue.

---

## 7. Provisioning

`ProvisionServerJob` memakai Application API:

1. Cari user panel berdasarkan email (`GET /api/application/users`).
2. Bila belum ada, buat user baru dengan password acak.
3. Pilih allocation: `plans.allocation_id` atau allocation kosong pertama di node.
4. `POST /api/application/servers` dengan limits dari plan.
5. Simpan `pterodactyl_server_id`, `server_uuid`, `server_identifier`,
   status `active`.

Perpanjangan: bila subscription sudah punya server, job hanya memanggil
`unsuspend` (kalau sebelumnya suspended) dan menandai `active`.

Retry: 3x dengan backoff 30s / 2m / 5m. Kegagalan permanen dicatat di
`subscriptions.meta.provision_error` dan log `billing.provision.failed`.

> Queue worker **wajib** jalan. Tanpa worker, invoice tetap lunas tetapi server
> tidak dibuat.

---

## 8. Expired, suspend, grace period

Command `billing:expire`:

```bash
php artisan billing:expire --dry-run   # lihat rencana
php artisan billing:expire             # suspend yang expired
php artisan billing:expire --delete    # hapus server setelah grace
```

- `active` + `expires_at <= now` → suspend server, status `suspended`.
- `suspended` + lewat `BILLING_GRACE_DAYS` → status `expired`
  (dan hapus server bila `--delete`).
- User membayar lagi → webhook memperpanjang `expires_at` dan job melakukan
  unsuspend.

Reminder email H-3 belum diimplementasikan (butuh konfigurasi mail + template).
Bisa ditambahkan sebagai command terpisah.

---

## 9. Checklist go-live

- [ ] `MUSTIKA_API_KEY` valid + webhook URL terdaftar di dashboard Mustika.
- [ ] `APP_URL` = `https://panel.exions.web.id` (HTTPS).
- [ ] `BILLING_SUCCESS_URL` = `https://panel.exions.web.id/success`.
- [ ] `PTERODACTYL_APP_API_KEY` dengan permission yang cukup.
- [ ] `php artisan migrate` sukses.
- [ ] Plan sudah diisi nest/egg/node/docker/startup/environment yang benar.
- [ ] Queue worker supervisor aktif.
- [ ] Cron `schedule:run` aktif.
- [ ] Test 1 transaksi nyata nominal kecil: QR muncul → bayar → webhook 200 →
      invoice paid → server muncul di dashboard.
- [ ] Test signature salah → 401.
- [ ] Test webhook duplikat → `{"ok":true,"duplicate":true}` tanpa efek ganda.
- [ ] Rate limit checkout (10/menit) sesuai kebutuhan.
- [ ] Backup DB harian.

---

## 10. Keamanan

- API key hanya di `.env`; jangan pernah dikirim ke browser.
- Semua nominal dihitung ulang di server dari tabel `plans`.
- Signature diverifikasi terhadap raw body, bukan hasil `json_decode`.
- Idempotensi + row lock mencegah double provisioning.
- Jangan memakai kredensial root VPS di aplikasi. Gunakan user deploy + SSH key.
- Rotasi `MUSTIKA_API_KEY` bila pernah terekspos.

---

## 11. Yang belum ada (opsional fase berikut)

- Admin CRUD plan/order/refund (sementara lewat tinker/database).
- Email invoice & reminder H-3.
- Renewal otomatis / auto-charge.
- Halaman detail invoice + unduh PDF.
- Laporan pendapatan.

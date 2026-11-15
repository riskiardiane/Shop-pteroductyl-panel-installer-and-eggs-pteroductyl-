# Aurora Theme — Panduan Implementasi

Tema panel + fondasi sistem jualan (plans, checkout, dashboard pelanggan) untuk
Pterodactyl 1.x + Blueprint.

> Status: **Fase 1 — design system & seluruh layout**.
> Fase 2 (billing & auto-provisioning dengan MustikaPayment QRIS) didokumentasikan
> di `BILLING.md`.

---

## 1. File yang ditambahkan / diubah

### Baru

| File | Fungsi |
| --- | --- |
| `resources/scripts/assets/css/theme.css` | Design token + seluruh komponen UI + override halaman legacy |
| `resources/scripts/config/plans.ts` | Tipe `Plan`, fallback data paket, helper harga (IDR, diskon, siklus) |
| `resources/scripts/components/theme/primitives.tsx` | `Card`, `CardHead/Body/Foot`, `Badge`, `StatCard`, `SectionHeading`, `EmptyState`, `Check`, `Divider` |
| `resources/scripts/components/theme/PlanCard.tsx` | Kartu paket dengan spesifikasi + CTA |
| `resources/scripts/components/theme/BillingToggle.tsx` | Switch siklus bulanan / 3 bulan / tahunan |
| `resources/scripts/components/landing/PricingPage.tsx` | Halaman `/pricing` lengkap + dialog ringkasan pesanan |
| `resources/views/partials/theme/admin.blade.php` | Tema AdminLTE (satu bahasa visual dengan client) |
| `resources/views/partials/theme/plans-bootstrap.blade.php` | Inject `window.PanelPlans`, `PanelInvoices`, `PanelActivePlan` |

### Ditulis ulang

| File | Perubahan |
| --- | --- |
| `components/App.tsx` | Import `theme.css`, lazy route `/pricing` |
| `components/landing/LandingPage.tsx` | Landing baru: hero, mock panel, fitur, harga, cara kerja, FAQ, CTA, footer |
| `components/NavigationBar.tsx` | Navbar glass + menu Dashboard/Paket/Akun/Admin |
| `components/dashboard/DashboardContainer.tsx` | Dashboard pelanggan bertab: Ringkasan / Layanan / Tagihan |
| `components/auth/LoginFormContainer.tsx` | Kartu split dengan panel brand (tanpa aset gambar eksternal) |
| `components/auth/LoginContainer.tsx` | Form memakai `pn-input` / `pn-btn`, copy Bahasa Indonesia |
| `routers/AuthenticationRouter.tsx` | Background memakai token |
| `views/layouts/admin.blade.php` | Tema admin, perbaikan markup `<li>`, font, include CSS tema |
| `views/admin/index.blade.php` | Overview admin: 4 stat card, info sistem, aksi cepat |
| `views/templates/wrapper.blade.php` | Include bootstrap plans |

---

## 2. Design token

Semua warna/radius/shadow ada di `:root` (`theme.css`). Jangan hardcode hex baru.

```css
--pn-bg            #060912   /* background aplikasi      */
--pn-surface       #0d1326   /* card                      */
--pn-surface-2     #111a32   /* input / panel sekunder    */
--pn-surface-3     #162142   /* hover / aktif             */
--pn-border        rgba(148,163,184,.12)
--pn-primary       #7c5cff   /* brand                    */
--pn-cyan          #22d3ee   /* aksen                    */
--pn-success       #34d399
--pn-warning       #fbbf24
--pn-danger        #fb7185
--pn-text          #e8ecf8
--pn-text-muted    #94a3b8
--pn-radius-lg     20px
```

### Class siap pakai

- Layout: `pn-shell`, `pn-section`, `pn-grid pn-grid--2|3|4`, `pn-grid-bg`, `pn-aurora`
- Tipografi: `pn-h1`, `pn-h2`, `pn-h3`, `pn-lede`, `pn-eyebrow`, `pn-gradient-text`, `pn-mono`, `font-header`
- Card: `pn-card` (+`--glass`, `--glow`, `--flat`), `pn-card__head/title/body/foot`, `pn-hoverable`
- Tombol: `pn-btn` + `--primary|--ghost|--outline|--danger` + `--sm|--lg|--block|--icon`
- Badge: `pn-badge` + `--primary|--success|--warning|--danger|--cyan`, `pn-dot` (+`--live`)
- Form: `pn-label`, `pn-input`, `pn-select`, `pn-textarea`, `pn-input--error`
- Tabel: `pn-table`
- Navigasi: `pn-navlink`, `pn-tabs`, `pn-tab`
- Lain: `pn-plan`, `pn-plan--featured`, `pn-plan__*`, `pn-stat`/`pn-stat__*`, `pn-empty`, `pn-alert`, `pn-kbd`, `pn-fade-up`

Contoh:

```tsx
import { Card, CardHead, CardBody, Badge } from '@/components/theme/primitives';

<Card glow>
    <CardHead title={'Layanan'} actions={<Badge tone={'success'} dot>Running</Badge>} />
    <CardBody>...</CardBody>
</Card>
```

---

## 3. Cara menerapkan

1. Copy seluruh file dari paket ini ke panel (`resources/scripts`, `resources/views`).
2. Pastikan `App.tsx` meng-import CSS setelah Tailwind:

   ```tsx
   import '@/assets/tailwind.css';
   import '@/assets/css/theme.css';
   ```

3. (Opsional, disarankan) selaraskan palet Tailwind agar halaman yang belum
   disentuh langsung ikut. Lihat `tailwind.theme.snippet.js`.
4. Build aset theme:

   ```bash
   cd /var/www/pterodactyl
   yarn install            # atau npm install
   yarn run build:production
   php artisan view:clear
   php artisan cache:clear
   ```

5. Cek halaman: `/`, `/pricing`, `/checkout`, `/success`, `/auth/login`, `/dashboard`, `/admin`.

### Rsync dari mesin lokal

```bash
rsync -avz --progress \
  var/www/pterodactyl/resources/scripts/ \
  root@SERVER:/var/www/pterodactyl/resources/scripts/

rsync -avz --progress \
  var/www/pterodactyl/resources/views/ \
  root@SERVER:/var/www/pterodactyl/resources/views/
```

---

## 4. Struktur navigasi baru

| URL | Akses | Isi |
| --- | --- | --- |
| `/` | publik | Landing + preview paket |
| `/pricing` | publik | Semua paket, perbandingan, dialog pesanan |
| `/auth/login` | publik | Login |
| `/checkout?plan=…&cycle=…` | publik (butuh login untuk bayar) | Checkout QRIS + polling status |
| `/success?order=…&invoice=…` | publik | Halaman setelah pembayaran |
| `/dashboard` | login | Tab Ringkasan / Layanan / Tagihan |
| `/dashboard?tab=billing` | login | Invoice & metode bayar |
| `/account` | login | Profil, API, SSH, activity |
| `/server/:id` | login + permission | Panel server (console, files, dll) |
| `/admin` | root admin | Overview admin bertema |

---

## 5. Catatan kompatibilitas

- Halaman server (console, files, backups, …) **tidak ditulis ulang satu per satu**.
  `theme.css` bagian **12. LEGACY OVERRIDES** memetakan kelas `neutral-*` milik
  Pterodactyl ke palet baru, termasuk `#SubNavigation`, tabel, dan xterm.
- Sumber data paket: `window.PanelPlans` (Blade, dari tabel `plans` bila sudah
  dimigrasikan) → fallback `config/plans.ts`. Detail billing: `BILLING.md`.
  Fase 2 cukup mengganti isi partial dengan query DB.
- `window.PanelInvoices` dan `window.PanelActivePlan` sengaja kosong sampai
  modul billing aktif; UI otomatis menampilkan empty state.
- Tidak ada dependency npm baru. Semua memakai React, FontAwesome, easy-peasy,
  dan class CSS yang sudah ada.

---

## 6. Roadmap fase berikutnya

1. **Billing** — tabel `plans`, `orders`, `invoices`, `subscriptions`; checkout QRIS
   MustikaPayment; webhook; invoice PDF. (lihat `BILLING.md`)
2. **Auto-provisioning** — Application API Pterodactyl: buat user + server setelah
   invoice `paid`, suspend saat expired, unsuspend saat dibayar.
3. **Admin billing** — CRUD plan, daftar order, refund, laporan pendapatan.
4. **Notifikasi** — email invoice, reminder H-3, WhatsApp opsional.
5. **Tiket support** — menggantikan placeholder `/tickets`.

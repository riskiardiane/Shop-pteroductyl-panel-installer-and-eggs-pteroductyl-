# RizzDevs — AURORA 2.0 Panel Installer (panel + wings + 274 eggs)

Installer resmi untuk **AURORA 2.0** — panel game & layanan milik **RizzDevs**
(fork dari Pterodactyl Panel 1.x, dikustomisasi penuh: billing Mustika Payment,
limit paket, auto-suspend, redesign total tema terang, Monaco editor ala VS Code).

Di dalam repo ini:

| Folder        | Isi                                                              |
| ------------- | ---------------------------------------------------------------- |
| `panel/`      | Source lengkap panel AURORA 2.0 (tanpa `node_modules`/`vendor`)  |
| `eggs/`       | 274 egg resmi RizzDevs (semua kategori), author = **RizzDevs**   |
| `install.sh`  | Entry point installer (panel / wings / keduanya)                 |
| `installers/` | Logika instalasi per komponen                                    |
| `configs/`    | Template nginx & wings.service (persis seperti deploy produksi)  |
| `scripts/`    | `import-eggs.php` — import 274 egg otomatis setelah migrasi      |
| `lib/`        | Library bersama (OS detection, UI, paket, database, firewall)     |

---

## 🚀 Instalasi cepat

```bash
bash <(curl -sSL https://raw.githubusercontent.com/riskiardiane/Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-/main/install.sh)
```

Atau clone dulu (disarankan, agar build panel memakai file lokal):

```bash
git clone --depth 1 https://github.com/riskiardiane/Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-.git
cd Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-
sudo bash install.sh
```

Menu yang tersedia:

```
[0] Install the AURORA 2.0 Panel (fresh machine)
[1] Install Wings on a game node
[2] Install Panel and Wings on the same machine
[3] Uninstall Panel or Wings
```

### Persyaratan

* Ubuntu **22.04 / 24.04 / 26.04** atau Debian **12+** (amd64)
* Root (via sudo)
* RAM minimal 1 GB (disarankan 2 GB+), 10 GB disk
* Untuk Let's Encrypt: domain yang sudah mengarah ke IP server + port 80/443 terbuka

### Apa yang diinstal

**Panel:** nginx, PHP 8.3-FPM (+ semua extension panel), MariaDB, Redis,
Composer, Node.js 22 + Yarn 1, build frontend produksi, database otomatis,
migrasi, akun admin, cron `schedule:run`, 274 egg (opsional), nginx vhost,
opsional Let's Encrypt, opsional ufw, dan halaman **Admin → Settings → Web**
untuk mengatur Nama Web, Title Web, X-icon (favicon) & logo (upload/URL),
Mustika Payment Key, grace period dan URL billing — semua diterapkan otomatis
di seluruh panel, landing page dan email.

**Wings:** Docker CE, docker network `pterodactyl_nw` (172.18.0.0/16, gateway
172.18.0.1), Wings **v1.13.5** di `/usr/local/bin/wings`, konfigurasi
`/etc/pterodactyl/config.yml`, service systemd `wings.service`, SFTP di port
2022, API di port 8080, opsional Let's Encrypt & ufw.

---

## 🥚 Eggs

Semua egg di folder `eggs/` di-import otomatis oleh installer (setelah
migrasi) menjadi nest **Bots, Databases, Generic, Monitoring, Software,
Storage, Voice Servers** dan **Games** — author semuanya `RizzDevs <animersvercel@gmail.com>`,
dan `meta.update_url` di-kosongkan sehingga panel tidak pernah menarik update upstream.

Import ulang manual di server yang sudah jalan:

```bash
cd /var/www/pterodactyl
su -s /bin/bash www-data -c "cd /var/www/pterodactyl && EGG_SOURCE=/path/ke/eggs php artisan tinker --execute=\"eval(file_get_contents('/path/ke/scripts/import-eggs.php'));\""
```

Import **idempoten**: egg yang sudah ada (nama + nest sama) dilewati.

---

## 🖥️ Konfigurasi node (Wings)

1. Panel → **Admin → Location** → buat lokasi (misal `Indonesia`).
2. Panel → **Admin → Nodes → Create New** → isi FQDN node, port `8080`, memory/disk.
3. Buka node → tab **Configuration** → catat `uuid`, `token_id`, `token`.
4. Jalankan installer Wings di mesin node → masukkan ketiganya saat ditanya.

`config.yml` yang dihasilkan identik dengan deployment produksi AURORA
(SFTP 2022, DNS 1.1.1.1/1.0.0.1, throttles 2000 lines/100ms, docker
`pterodactyl_nw`).

---

## 💳 Billing (Mustika Payment)

Billing dibaca dari `.env` (lihat `panel/.env.example`, blok `AURORA 2.0`):

```env
MUSTIKA_BASE_URL=https://mustikapayment.com
MUSTIKA_API_KEY=isi-api-key-anda
BILLING_GRACE_DAYS=7
PTERODACTYL_APP_URL=https://panel.exions.web.id
PTERODACTYL_APP_API_KEY=isi-application-api-key
```

Panduan lengkap: lihat `panel/BILLING.md`.

---

## 🔒 Keamanan

Yang disetel otomatis oleh installer:

* `APP_DEBUG=false` dan `APP_ENV=production` disetel otomatis.
* MariaDB hanya listen di `127.0.0.1` (bukan `0.0.0.0`) dan `local-infile=0`.
* Database panel dibuat dengan grant **hanya** pada database panel itu sendiri
  (tanpa `GRANT OPTION`) — tidak ada grant global.
* fail2ban dipasang otomatis dengan jail `sshd` (bantime 1 jam, maks. 5 percobaan).
* PHP-FPM: `expose_php=Off`, `display_errors=Off`, `cgi.fix_pathinfo=0`,
  `session.use_strict_mode=1`, `session.cookie_httponly=1`, `session.cookie_samesite=Lax`.
* nginx: `server_tokens off`, header `X-Frame-Options`, `X-Content-Type-Options`,
  `X-XSS-Protection 0`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`,
  dan rule `deny all` untuk `.env` / `.git` / `composer.json` / `package.json` /
  `storage/logs` / `vendor` / `node_modules` / file internal lainnya.
* `config.yml` Wings ditulis dengan permission `0600`.
* Opsi firewall ufw men-deny semua incoming lalu membuka hanya port yang perlu
  (22/SSH, 80/443 panel, atau 8080/2022 wings + range alokasi). Port **3306 tidak dibuka**.
* Cron berjalan sebagai root tapi hanya `schedule:run`; aplikasi berjalan sebagai `www-data`.

SSH bisa dimigrasikan ke listener kedua yang diperketat (`RIZZDEVS_SSH_PORT`, default `2222`,
`MaxAuthTries 4`, `X11Forwarding no`, dsb.) lewat prompt saat install atau
`CONFIGURE_SSH_HARDENING=true`. Port 22 sengaja **tetap** terbuka saat transisi;
setelah port baru terverifikasi, tutup port 22 secara manual
(`ufw delete allow 22` lalu hapus `ListenStream=0.0.0.0:22` dari socket override).

Yang **tidak** diubah otomatis (sengaja, supaya tidak mengunci diri sendiri):
`PermitRootLogin` dan `PasswordAuthentication`. Gunakan SSH key dan nonaktifkan
password login secara manual setelah memastikan key kamu terpasang.

---

## 🧩 Lisensi

* Installer (`install.sh`, `installers/`, `lib/`, `configs/`, `scripts/`): **GPL-3.0** — `LICENSE`
* Panel (`panel/`): **MIT** — lihat `panel/LICENSE.md` (© Pterodactyl Project, dipakai sesuai ketentuan lisensi)
* Eggs (`eggs/`): author `RizzDevs <animersvercel@gmail.com>`

---

© 2026 RizzDevs — animersvercel@gmail.com

<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Billing\CheckoutController;
use Pterodactyl\Http\Controllers\Billing\BenefitsController;
use Pterodactyl\Http\Controllers\Billing\CreateServerController;
use Pterodactyl\Http\Controllers\Billing\InvoiceController;
use Pterodactyl\Http\Controllers\Billing\MustikaWebhookController;

/*
|--------------------------------------------------------------------------
| Billing routes
|--------------------------------------------------------------------------
|
| Dimuat oleh Pterodactyl\Providers\BillingServiceProvider.
| Jalankan `php artisan route:clear` setelah mengubah file ini.
|
*/

/*
| Webhook TIDAK memakai middleware `web` (tanpa session & CSRF) karena
| dipanggil server-ke-server. Keamanan dijaga oleh HMAC signature.
|
| URL produksi: https://panel.exions.web.id/webhooks/mustika
*/
Route::post('/webhooks/mustika', MustikaWebhookController::class)
    ->name('billing.webhook.mustika');

Route::prefix('api/billing')
    ->middleware(['web', 'auth', 'throttle:10,1'])
    ->group(function () {
        Route::post('/checkout', [CheckoutController::class, 'store'])->name('billing.checkout');
        Route::get('/orders/{uuid}', [CheckoutController::class, 'show'])->name('billing.orders.show');
    });

Route::prefix('api/billing')
    ->middleware(['web', 'auth'])
    ->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index'])->name('billing.invoices');
        Route::get('/benefits', [BenefitsController::class, 'index'])->name('billing.benefits');
        Route::post('/create-server', [CreateServerController::class, 'store'])->name('billing.create_server');
    });


<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Pterodactyl\Http\Middleware\AdminAuthenticate;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;

/**
 * Daftarkan provider ini di `config/app.php`:
 *
 *   Pterodactyl\Providers\BillingServiceProvider::class,
 */
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $path = base_path('config/billing.php');

        if (file_exists($path)) {
            $this->mergeConfigFrom($path, 'billing');
        }
    }

    public function boot(): void
    {
        $routes = base_path('routes/billing.php');

        if (file_exists($routes)) {
            $this->loadRoutesFrom($routes);
        }

        // Admin: halaman Billing (CRUD plans/orders/invoices/subscriptions)
        $adminRoutes = base_path('routes/admin-billing.php');

        if (file_exists($adminRoutes)) {
            Route::middleware(['web', 'auth.session', RequireTwoFactorAuthentication::class, AdminAuthenticate::class])
                ->prefix('/admin')
                ->group($adminRoutes);
        }
    }
}

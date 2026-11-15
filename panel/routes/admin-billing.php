<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Admin\Billing\BillingController;
use Pterodactyl\Http\Controllers\Admin\Billing\PlanController;
use Pterodactyl\Http\Controllers\Admin\Billing\OrderController;
use Pterodactyl\Http\Controllers\Admin\Billing\InvoiceController;
use Pterodactyl\Http\Controllers\Admin\Billing\SubscriptionController;

/*
|--------------------------------------------------------------------------
| Admin — Billing
|--------------------------------------------------------------------------
| Dimuat oleh BillingServiceProvider dengan prefix /admin, middleware
| [web, auth.session, RequireTwoFactorAuthentication, AdminAuthenticate].
| Nama route memakai prefix `admin.billing.*`.
|--------------------------------------------------------------------------
*/

Route::get('/billing', [BillingController::class, 'index'])->name('admin.billing');

// Plans — CRUD penuh
Route::get('/billing/plans', [PlanController::class, 'index'])->name('admin.billing.plans');
Route::get('/billing/plans/new', [PlanController::class, 'create'])->name('admin.billing.plans.new');
Route::post('/billing/plans', [PlanController::class, 'store'])->name('admin.billing.plans.store');
Route::get('/billing/plans/{plan}/edit', [PlanController::class, 'edit'])->name('admin.billing.plans.edit');
Route::patch('/billing/plans/{plan}', [PlanController::class, 'update'])->name('admin.billing.plans.update');
Route::delete('/billing/plans/{plan}', [PlanController::class, 'destroy'])->name('admin.billing.plans.delete');

// Orders (Transaksi)
Route::get('/billing/orders', [OrderController::class, 'index'])->name('admin.billing.orders');
Route::get('/billing/orders/{order}', [OrderController::class, 'show'])->name('admin.billing.orders.show');
Route::post('/billing/orders/{order}/mark-paid', [OrderController::class, 'markPaid'])->name('admin.billing.orders.mark-paid');
Route::post('/billing/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('admin.billing.orders.cancel');

// Invoices
Route::get('/billing/invoices', [InvoiceController::class, 'index'])->name('admin.billing.invoices');
Route::get('/billing/invoices/{invoice}', [InvoiceController::class, 'show'])->name('admin.billing.invoices.show');

// Subscriptions
Route::get('/billing/subscriptions', [SubscriptionController::class, 'index'])->name('admin.billing.subscriptions');
Route::get('/billing/subscriptions/grant', [SubscriptionController::class, 'grantForm'])->name('admin.billing.subscriptions.grant');
Route::post('/billing/subscriptions/grant', [SubscriptionController::class, 'grantStore'])->name('admin.billing.subscriptions.grant.store');
Route::get('/billing/subscriptions/{subscription}', [SubscriptionController::class, 'show'])->name('admin.billing.subscriptions.show');
Route::post('/billing/subscriptions/{subscription}/suspend', [SubscriptionController::class, 'suspend'])->name('admin.billing.subscriptions.suspend');
Route::post('/billing/subscriptions/{subscription}/activate', [SubscriptionController::class, 'activate'])->name('admin.billing.subscriptions.activate');
Route::post('/billing/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->name('admin.billing.subscriptions.cancel');

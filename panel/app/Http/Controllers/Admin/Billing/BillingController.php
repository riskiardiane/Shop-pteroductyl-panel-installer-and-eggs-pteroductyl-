<?php

namespace Pterodactyl\Http\Controllers\Admin\Billing;

use Illuminate\View\View;
use Carbon\Carbon;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Billing\Order;
use Pterodactyl\Models\Billing\Invoice;
use Pterodactyl\Models\Billing\Plan;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Models\Billing\WebhookEvent;

class BillingController extends Controller
{
    public function index(): View
    {
        $paidRevenue = (int) Invoice::where('status', Invoice::STATUS_PAID)->sum('total');
        $paid30 = (int) Invoice::where('status', Invoice::STATUS_PAID)
            ->where('paid_at', '>=', now()->subDays(30))
            ->sum('total');

        $stats = [
            'revenue_total' => $paidRevenue,
            'revenue_30d' => $paid30,
            'orders_pending' => Order::where('status', 'pending')->count(),
            'orders_paid' => Order::where('status', 'paid')->count(),
            'subscriptions_active' => Subscription::where('status', Subscription::STATUS_ACTIVE)->count(),
            'subscriptions_provisioning' => Subscription::where('status', Subscription::STATUS_PROVISIONING)->count(),
            'subscriptions_expiring' => Subscription::where('status', Subscription::STATUS_ACTIVE)
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now()->addDays(7))
                ->count(),
            'plans_active' => Plan::where('is_active', true)->count(),
            'webhook_failed' => WebhookEvent::whereNotNull('error')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        $recentOrders = Order::with(['user', 'plan'])
            ->latest('id')
            ->limit(8)
            ->get();

        $unprocessedWebhooks = WebhookEvent::whereNull('processed_at')
            ->latest('id')
            ->limit(5)
            ->get();

        return view('admin.billing.index', compact('stats', 'recentOrders', 'unprocessedWebhooks'));
    }
}

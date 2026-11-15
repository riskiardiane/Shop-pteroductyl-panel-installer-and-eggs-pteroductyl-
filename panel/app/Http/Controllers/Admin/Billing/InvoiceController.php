<?php

namespace Pterodactyl\Http\Controllers\Admin\Billing;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Billing\Invoice;
use Pterodactyl\Models\Billing\Order;
use Pterodactyl\Models\Billing\Subscription;

class InvoiceController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $invoices = Invoice::with(['user', 'order.plan'])
            ->when(in_array($status, ['unpaid', 'paid', 'expired', 'refunded'], true), fn ($query) => $query->where('status', $status))
            ->when($q !== '', function ($query) use ($q) {
                $query->where('number', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%")->orWhere('username', 'like', "%{$q}%"));
            })
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return view('admin.billing.invoices.index', compact('invoices', 'status', 'q'));
    }

    public function show(Invoice $invoice): View
    {
        $invoice->load(['user', 'order.plan']);
        $order = $invoice->order;
        $subscription = $order ? Subscription::where('order_id', $order->id)->first() : null;

        return view('admin.billing.invoices.show', compact('invoice', 'order', 'subscription'));
    }
}

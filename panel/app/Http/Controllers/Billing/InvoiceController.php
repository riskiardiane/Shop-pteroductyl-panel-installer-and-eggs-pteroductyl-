<?php

namespace Pterodactyl\Http\Controllers\Billing;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Billing\Invoice;

class InvoiceController extends Controller
{
    /**
     * Riwayat tagihan user yang sedang login.
     * Bentuk respons disamakan dengan `PanelInvoice` di frontend.
     */
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::query()
            ->where('user_id', $request->user()->id)
            ->with(['order.plan'])
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->number,
                'planName' => optional(optional($invoice->order)->plan)->name ?? 'Layanan',
                'amount' => (int) $invoice->total,
                'status' => $invoice->status,
                'dueDate' => optional($invoice->due_at)->toFormattedDateString() ?? '-',
                'paidAt' => optional($invoice->paid_at)->toIso8601String(),
                'orderUuid' => optional($invoice->order)->uuid,
            ]);

        return response()->json(['data' => $invoices]);
    }
}

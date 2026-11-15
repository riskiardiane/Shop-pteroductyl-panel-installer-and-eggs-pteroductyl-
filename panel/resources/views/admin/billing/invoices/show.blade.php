@extends('layouts.admin')

@section('title')
    Invoice {{ $invoice->number }}
@endsection

@section('content-header')
    <h1>Invoice {{ $invoice->number }}<small>Diterbitkan {{ optional($invoice->created_at)->format('d M Y H:i') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing.invoices') }}">Invoices</a></li>
        <li class="active">{{ $invoice->number }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-8 col-md-offset-2">
        <div class="box">
            <div class="box-body" style="padding:28px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--adm-border);padding-bottom:18px;margin-bottom:18px">
                    <div>
                        <div style="font-family:Outfit,sans-serif;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:var(--adm-text)">INVOICE</div>
                        <code style="font-size:14px">{{ $invoice->number }}</code>
                    </div>
                    <div style="text-align:right">
                        @include('admin.billing._status', ['status' => $invoice->status])<br>
                        <small style="color:var(--adm-dim)">Jatuh tempo: {{ optional($invoice->due_at)->format('d M Y H:i') ?? '—' }}</small><br>
                        <small style="color:var(--adm-dim)">Dibayar: {{ optional($invoice->paid_at)->format('d M Y H:i') ?? '—' }}</small>
                    </div>
                </div>

                <table style="width:100%;margin-bottom:16px">
                    <tr>
                        <td style="vertical-align:top">
                            <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--adm-dim);font-weight:700">Ditagihkan kepada</div>
                            <strong>{{ $invoice->user?->username ?? '—' }}</strong><br>
                            {{ $invoice->user?->email }}
                        </td>
                        <td style="vertical-align:top;text-align:right">
                            <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--adm-dim);font-weight:700">Panel</div>
                            Exions Panel &middot; panel.exions.web.id
                        </td>
                    </tr>
                </table>

                <table class="table table-bordered" style="margin-bottom:16px">
                    <thead>
                        <tr>
                            <th>Deskripsi</th>
                            <th class="text-center">Siklus</th>
                            <th class="text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>{{ $order?->plan?->name ?? 'Subscription' }}</strong><br>
                                <small style="color:var(--adm-dim)">{{ $order?->plan?->slug }} — Order {{ $order ? \Illuminate\Support\Str::limit($order->uuid, 18) : '—' }}</small>
                            </td>
                            <td class="text-center">{{ $order ? ucfirst($order->cycle) : '—' }}</td>
                            <td class="text-right">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr><th colspan="2" class="text-right">Subtotal</th><th class="text-right">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</th></tr>
                        <tr><th colspan="2" class="text-right">Diskon</th><th class="text-right">- Rp {{ number_format($invoice->discount, 0, ',', '.') }}</th></tr>
                        <tr><th colspan="2" class="text-right" style="font-size:16px">Total</th><th class="text-right" style="font-size:16px"><strong>Rp {{ number_format($invoice->total, 0, ',', '.') }}</strong></th></tr>
                    </tfoot>
                </table>

                @if(!empty($invoice->meta))
                    <p style="font-weight:700;color:var(--adm-text);margin-bottom:6px">Meta</p>
                    <pre style="background:var(--adm-surface-2);border:1px solid var(--adm-border);border-radius:12px;padding:12px;font-size:11px;max-height:220px;overflow:auto">{{ json_encode($invoice->meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) }}</pre>
                @endif

                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
                    @if($order)
                        <a href="{{ route('admin.billing.orders.show', $order->id) }}" class="btn btn-default"><i class="fa fa-arrow-left"></i> &nbsp;Kembali ke Order</a>
                    @endif
                    <button onclick="window.print()" class="btn btn-default"><i class="fa fa-print"></i> &nbsp;Cetak</button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

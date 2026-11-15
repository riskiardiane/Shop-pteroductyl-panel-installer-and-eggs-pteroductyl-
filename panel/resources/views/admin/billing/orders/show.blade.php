@extends('layouts.admin')

@section('title')
    Order {{ \Illuminate\Support\Str::limit($order->uuid, 8, '') }}
@endsection

@section('content-header')
    <h1>Detail Order <small>{{ $order->uuid }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing.orders') }}">Orders</a></li>
        <li class="active">Detail</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-8">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Informasi Order</h3>
                <div class="box-tools">@include('admin.billing._status', ['status' => $order->status])</div>
            </div>
            <div class="box-body">
                <table class="table">
                    <tbody>
                        <tr><th style="width:220px">Dibuat</th><td>{{ optional($order->created_at)->format('d M Y H:i:s') }}</td></tr>
                        <tr><th>User</th><td>
                            @if($order->user)
                                <strong>{{ $order->user->username }}</strong> — {{ $order->user->email }}<br>
                                <small style="color:var(--adm-dim)">UUID: {{ $order->user->uuid }}</small>
                            @else
                                <em>user terhapus</em>
                            @endif
                        </td></tr>
                        <tr><th>Paket</th><td>{{ $order->plan?->name }} (<code>{{ $order->plan?->slug }}</code>) — siklus {{ ucfirst($order->cycle) }}</td></tr>
                        <tr><th>Total</th><td><strong style="font-size:18px">Rp {{ number_format($order->amount, 0, ',', '.') }}</strong></td></tr>
                        <tr><th>Provider Ref</th><td><code>{{ $order->provider_ref ?? '—' }}</code></td></tr>
                        <tr><th>Kedaluwarsa QR</th><td>{{ optional($order->expires_at)->format('d M Y H:i:s') ?? '—' }}</td></tr>
                        <tr><th>Dibayar pada</th><td>{{ optional($order->paid_at)->format('d M Y H:i:s') ?? '—' }}</td></tr>
                        @if($order->qr_string)
                            <tr><th>QR String</th><td><code style="word-break:break-all;font-size:11px">{{ $order->qr_string }}</code></td></tr>
                        @endif
                    </tbody>
                </table>

                @if(!empty($order->meta))
                    <p style="margin:10px 0 4px;font-weight:700;color:var(--adm-text)">Meta</p>
                    <pre style="background:var(--adm-surface-2);border:1px solid var(--adm-border);border-radius:12px;padding:12px;font-size:11px;max-height:260px;overflow:auto">{{ json_encode($order->meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) }}</pre>
                @endif
            </div>
        </div>

        @if($invoice)
            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Invoice</h3>
                    <div class="box-tools"><a href="{{ route('admin.billing.invoices.show', $invoice->id) }}" class="btn btn-sm btn-default">Buka Invoice</a></div>
                </div>
                <div class="box-body">
                    <strong><code>{{ $invoice->number }}</code></strong> — Rp {{ number_format($invoice->total, 0, ',', '.') }} &middot; @include('admin.billing._status', ['status' => $invoice->status])
                </div>
            </div>
        @endif

        @if($subscription)
            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Subscription</h3>
                    <div class="box-tools"><a href="{{ route('admin.billing.subscriptions.show', $subscription->id) }}" class="btn btn-sm btn-default">Buka Subscription</a></div>
                </div>
                <div class="box-body">
                    @include('admin.billing._status', ['status' => $subscription->status])<br>
                    <small style="color:var(--adm-dim)">Server: {{ $subscription->server_identifier ?? 'belum dibuat' }} &middot; Berakhir: {{ optional($subscription->expires_at)->format('d M Y H:i') ?? '—' }}</small>
                </div>
            </div>
        @endif
    </div>

    <div class="col-md-4">
        <div class="box" style="border-color:var(--adm-border-accent)">
            <div class="box-header with-border"><h3 class="box-title">Aksi</h3></div>
            <div class="box-body" style="display:grid;gap:10px">
                @if($order->status !== 'paid')
                    <form method="POST" action="{{ route('admin.billing.orders.mark-paid', $order->id) }}" onsubmit="return confirm('Tandai order ini LUNAS? Sistem akan membuat/memperpanjang subscription dan men-dispatch provisioning server.')">
                        @csrf
                        <button type="submit" class="btn btn-primary btn-block"><i class="fa fa-check-circle"></i> &nbsp;Tandai Lunas &amp; Provision</button>
                    </form>
                    <form method="POST" action="{{ route('admin.billing.orders.cancel', $order->id) }}" onsubmit="return confirm('Batalkan order ini? Invoice unpaid akan ditandai expired.')">
                        @csrf
                        <button type="submit" class="btn btn-danger btn-block"><i class="fa fa-times-circle"></i> &nbsp;Batalkan Order</button>
                    </form>
                @else
                    <div class="alert alert-success" style="margin-bottom:0"><i class="fa fa-check-circle"></i> Order ini sudah lunas.</div>
                @endif
                <p class="help-block" style="margin-bottom:0">Pembayaran manual: hanya gunakan jika pelanggan sudah membuktikan transfer di luar QRIS. Aksi ini memperbarui order, invoice, dan subscription secara konsisten, lalu men-dispatch <code>ProvisionServerJob</code>.</p>
            </div>
        </div>

        @if($order->user)
            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Pelanggan</h3></div>
                <div class="box-body">
                    <a href="{{ url('/admin/users/view/' . $order->user->id) }}" class="btn btn-default btn-block"><i class="fa fa-user"></i> &nbsp;{{ $order->user->username }} — Buka di Users</a>
                </div>
            </div>
        @endif
    </div>
</div>
@endsection

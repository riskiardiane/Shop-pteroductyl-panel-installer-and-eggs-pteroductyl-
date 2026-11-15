@extends('layouts.admin')

@section('title')
    Billing Overview
@endsection

@section('content-header')
    <h1>Billing &amp; Transaksi<small>Sekilas kondisi penjualan QRIS, provisioning otomatis, dan langganan.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Billing</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">

        <div class="adm-grid" style="margin-bottom:18px">
            <div class="adm-stat">
                <div class="adm-stat__icon" style="background:rgba(5,150,105,.09);border-color:rgba(5,150,105,.3);color:#047857"><i class="fa fa-money"></i></div>
                <div>
                    <div class="adm-stat__label">Total Pendapatan</div>
                    <div class="adm-stat__value">Rp {{ number_format($stats['revenue_total'], 0, ',', '.') }}</div>
                    <div class="adm-stat__hint">Semua invoice lunas</div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon"><i class="fa fa-line-chart"></i></div>
                <div>
                    <div class="adm-stat__label">30 Hari Terakhir</div>
                    <div class="adm-stat__value">Rp {{ number_format($stats['revenue_30d'], 0, ',', '.') }}</div>
                    <div class="adm-stat__hint">Pendapatan berjalan</div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon" style="background:rgba(5,150,105,.09);border-color:rgba(5,150,105,.3);color:#047857"><i class="fa fa-check-circle"></i></div>
                <div>
                    <div class="adm-stat__label">Order Lunas</div>
                    <div class="adm-stat__value">{{ number_format($stats['orders_paid']) }}</div>
                    <div class="adm-stat__hint">Pembayaran terkonfirmasi</div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon" style="background:rgba(217,119,6,.1);border-color:rgba(217,119,6,.3);color:#b45309"><i class="fa fa-clock-o"></i></div>
                <div>
                    <div class="adm-stat__label">Order Pending</div>
                    <div class="adm-stat__value">{{ number_format($stats['orders_pending']) }}</div>
                    <div class="adm-stat__hint">Menunggu pembayaran QRIS</div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon"><i class="fa fa-server"></i></div>
                <div>
                    <div class="adm-stat__label">Subscription Aktif</div>
                    <div class="adm-stat__value">{{ number_format($stats['subscriptions_active']) }}</div>
                    <div class="adm-stat__hint">{{ $stats['subscriptions_provisioning'] }} sedang provisioning</div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon" style="background:rgba(8,145,178,.1);border-color:rgba(8,145,178,.3);color:#0e7490"><i class="fa fa-hourglass-half"></i></div>
                <div>
                    <div class="adm-stat__label">Kedaluwarsa &le; 7 Hari</div>
                    <div class="adm-stat__value">{{ number_format($stats['subscriptions_expiring']) }}</div>
                    <div class="adm-stat__hint">Perlu peringatan / renewal</div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon" style="background:rgba(109,78,240,.1);border-color:rgba(109,78,240,.32);color:var(--adm-primary-600)"><i class="fa fa-tags"></i></div>
                <div>
                    <div class="adm-stat__label">Paket Aktif</div>
                    <div class="adm-stat__value">{{ number_format($stats['plans_active']) }}</div>
                    <div class="adm-stat__hint"><a href="{{ route('admin.billing.plans') }}">Kelola paket &rarr;</a></div>
                </div>
            </div>
            <div class="adm-stat">
                <div class="adm-stat__icon" style="background:rgba(225,29,72,.07);border-color:rgba(225,29,72,.3);color:#be123c"><i class="fa fa-exclamation-triangle"></i></div>
                <div>
                    <div class="adm-stat__label">Webhook Error (7d)</div>
                    <div class="adm-stat__value">{{ number_format($stats['webhook_failed']) }}</div>
                    <div class="adm-stat__hint">Event Mustika gagal diproses</div>
                </div>
            </div>
        </div>

        @if($unprocessedWebhooks->isNotEmpty())
            <div class="alert alert-warning" style="margin-bottom:18px">
                <i class="fa fa-bell"></i>&nbsp; <strong>{{ $unprocessedWebhooks->count() }} webhook belum diproses:</strong>
                @foreach($unprocessedWebhooks as $event)
                    <div style="margin-top:6px"><code>{{ $event->event_id }}</code> &mdash; {{ $event->event_type }} &middot; {{ optional($event->created_at)->format('d M Y H:i') }}{{ $event->error ? ' — ' . \Illuminate\Support\Str::limit($event->error, 120) : '' }}</div>
                @endforeach
            </div>
        @endif

        <div class="row">
            <div class="col-md-8">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Transaksi Terakhir</h3>
                        <div class="box-tools"><a href="{{ route('admin.billing.orders') }}" class="btn btn-sm btn-default">Lihat Semua</a></div>
                    </div>
                    <div class="box-body table-responsive no-padding">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>User</th>
                                    <th>Paket</th>
                                    <th class="text-right">Total</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($recentOrders as $order)
                                    <tr>
                                        <td>{{ optional($order->created_at)->format('d M Y H:i') }}</td>
                                        <td>{{ $order->user?->username ?? '—' }}</td>
                                        <td>{{ $order->plan?->name ?? '—' }}</td>
                                        <td class="text-right">Rp {{ number_format($order->amount, 0, ',', '.') }}</td>
                                        <td>@include('admin.billing._status', ['status' => $order->status])</td>
                                        <td class="text-right"><a href="{{ route('admin.billing.orders.show', $order->id) }}" class="btn btn-sm btn-default">Detail</a></td>
                                    </tr>
                                @empty
                                    <tr><td colspan="6" class="text-center" style="padding:24px;color:var(--adm-dim)">Belum ada transaksi. 🎉</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Aksi Cepat</h3>
                    </div>
                    <div class="box-body" style="display:grid;gap:10px">
                        <a href="{{ route('admin.billing.plans.new') }}" class="btn btn-primary btn-block"><i class="fa fa-plus"></i> &nbsp;Buat Paket Baru</a>
                        <a href="{{ route('admin.billing.orders', ['status' => 'pending']) }}" class="btn btn-default btn-block"><i class="fa fa-hourglass-half"></i> &nbsp;Order Pending (periksa pembayaran)</a>
                        <a href="{{ route('admin.billing.invoices') }}" class="btn btn-default btn-block"><i class="fa fa-file-text-o"></i> &nbsp;Semua Invoice</a>
                        <a href="{{ route('admin.billing.subscriptions', ['status' => 'active']) }}" class="btn btn-default btn-block"><i class="fa fa-server"></i> &nbsp;Subscription Aktif</a>
                        <a href="{{ route('admin.users') }}" class="btn btn-default btn-block"><i class="fa fa-users"></i> &nbsp;Manajemen Users</a>
                        <a href="{{ route('admin.servers') }}" class="btn btn-default btn-block"><i class="fa fa-gamepad"></i> &nbsp;Manajemen Servers</a>
                    </div>
                </div>
                <div class="callout callout-info" style="background:var(--adm-surface);border:1px solid var(--adm-border);color:var(--adm-muted)">
                    <h4 style="color:var(--adm-text);margin-top:0"><i class="fa fa-info-circle"></i> &nbsp;Pembayaran manual</h4>
                    <p style="margin-bottom:0">Jika pelanggan membayar di luar QRIS (transfer manual), buka detail order lalu klik <strong>Tandai Lunas</strong>. Sistem akan memperbarui invoice, memperpanjang subscription, dan mem-provision server otomatis.</p>
                </div>
            </div>
        </div>

    </div>
</div>
@endsection

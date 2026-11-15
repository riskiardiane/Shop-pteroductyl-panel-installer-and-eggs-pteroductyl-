@extends('layouts.admin')

@section('title')
    Billing — Transaksi
@endsection

@section('content-header')
    <h1>Transaksi (Orders)<small>Semua pesanan masuk dari /pricing &rarr; checkout QRIS.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing') }}">Billing</a></li>
        <li class="active">Orders</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Daftar Transaksi</h3>
                <form class="box-tools" method="GET" action="{{ route('admin.billing.orders') }}" style="display:flex;gap:8px;align-items:center">
                    <select name="status" class="form-control input-sm" style="width:150px">
                        <option value="">Semua status</option>
                        @foreach(['pending' => 'Pending', 'paid' => 'Lunas', 'failed' => 'Gagal', 'cancelled' => 'Batal', 'expired' => 'Expired'] as $key => $label)
                            <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                    <input type="text" name="q" class="form-control input-sm" value="{{ $q }}" placeholder="Cari UUID / ref / user / paket…" style="width:260px">
                    <button type="submit" class="btn btn-sm btn-primary"><i class="fa fa-search"></i></button>
                    @if($status || $q)
                        <a href="{{ route('admin.billing.orders') }}" class="btn btn-sm btn-default">Reset</a>
                    @endif
                </form>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Order</th>
                            <th>User</th>
                            <th>Paket</th>
                            <th>Siklus</th>
                            <th class="text-right">Total</th>
                            <th>Invoice</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($orders as $order)
                            @php $invoice = $invoices[$order->id] ?? null; @endphp
                            <tr>
                                <td>{{ optional($order->created_at)->format('d M Y H:i') }}</td>
                                <td><code>{{ \Illuminate\Support\Str::limit($order->uuid, 13, '') }}</code></td>
                                <td>
                                    <strong>{{ $order->user?->username ?? '—' }}</strong><br>
                                    <small style="color:var(--adm-dim)">{{ $order->user?->email }}</small>
                                </td>
                                <td>{{ $order->plan?->name ?? '—' }}</td>
                                <td>{{ ucfirst($order->cycle) }}</td>
                                <td class="text-right">Rp {{ number_format($order->amount, 0, ',', '.') }}</td>
                                <td>@if($invoice)<a href="{{ route('admin.billing.invoices.show', $invoice->id) }}"><code>{{ $invoice->number }}</code></a>@else — @endif</td>
                                <td>@include('admin.billing._status', ['status' => $order->status])</td>
                                <td class="text-right"><a href="{{ route('admin.billing.orders.show', $order->id) }}" class="btn btn-sm btn-default">Detail</a></td>
                            </tr>
                        @empty
                            <tr><td colspan="9" class="text-center" style="padding:24px;color:var(--adm-dim)">Tidak ada transaksi yang cocok.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            @if ($orders->hasPages())
                <div class="box-footer" style="display:flex;justify-content:space-between;align-items:center">
                    <small style="color:var(--adm-dim)">Menampilkan {{ $orders->firstItem() }}–{{ $orders->lastItem() }} dari {{ $orders->total() }}</small>
                    {{ $orders->links() }}
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

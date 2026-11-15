@extends('layouts.admin')

@section('title')
    Billing — Invoice
@endsection

@section('content-header')
    <h1>Invoice<small>Arsip invoice yang diterbitkan untuk setiap order.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing') }}">Billing</a></li>
        <li class="active">Invoices</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Daftar Invoice</h3>
                <form class="box-tools" method="GET" action="{{ route('admin.billing.invoices') }}" style="display:flex;gap:8px;align-items:center">
                    <select name="status" class="form-control input-sm" style="width:150px">
                        <option value="">Semua status</option>
                        @foreach(['unpaid' => 'Belum Bayar', 'paid' => 'Lunas', 'expired' => 'Expired', 'refunded' => 'Refund'] as $key => $label)
                            <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                    <input type="text" name="q" class="form-control input-sm" value="{{ $q }}" placeholder="Cari nomor / user…" style="width:220px">
                    <button type="submit" class="btn btn-sm btn-primary"><i class="fa fa-search"></i></button>
                    @if($status || $q)
                        <a href="{{ route('admin.billing.invoices') }}" class="btn btn-sm btn-default">Reset</a>
                    @endif
                </form>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nomor</th>
                            <th>Dibuat</th>
                            <th>User</th>
                            <th>Paket</th>
                            <th class="text-right">Subtotal</th>
                            <th class="text-right">Diskon</th>
                            <th class="text-right">Total</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($invoices as $invoice)
                            <tr>
                                <td><code>{{ $invoice->number }}</code></td>
                                <td>{{ optional($invoice->created_at)->format('d M Y H:i') }}</td>
                                <td>{{ $invoice->user?->username ?? '—' }}<br><small style="color:var(--adm-dim)">{{ $invoice->user?->email }}</small></td>
                                <td>{{ $invoice->order?->plan?->name ?? '—' }}</td>
                                <td class="text-right">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
                                <td class="text-right">Rp {{ number_format($invoice->discount, 0, ',', '.') }}</td>
                                <td class="text-right"><strong>Rp {{ number_format($invoice->total, 0, ',', '.') }}</strong></td>
                                <td>@include('admin.billing._status', ['status' => $invoice->status])</td>
                                <td class="text-right"><a href="{{ route('admin.billing.invoices.show', $invoice->id) }}" class="btn btn-sm btn-default">Lihat</a></td>
                            </tr>
                        @empty
                            <tr><td colspan="9" class="text-center" style="padding:24px;color:var(--adm-dim)">Tidak ada invoice yang cocok.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            @if ($invoices->hasPages())
                <div class="box-footer" style="display:flex;justify-content:space-between;align-items:center">
                    <small style="color:var(--adm-dim)">Menampilkan {{ $invoices->firstItem() }}–{{ $invoices->lastItem() }} dari {{ $invoices->total() }}</small>
                    {{ $invoices->links() }}
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

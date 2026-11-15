@extends('layouts.admin')

@section('title')
    Billing — Paket
@endsection

@section('content-header')
    <h1>Paket Layanan<small>CRUD paket yang dijual di /pricing. Perubahan langsung dipakai checkout QRIS.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing') }}">Billing</a></li>
        <li class="active">Plans</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Daftar Paket</h3>
                <div class="box-tools">
                    <a href="{{ route('admin.billing.plans.new') }}" class="btn btn-sm btn-primary"><i class="fa fa-plus"></i> &nbsp;Paket Baru</a>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Paket</th>
                            <th class="text-right">Harga/bln</th>
                            <th>Spesifikasi</th>
                            <th>Alloc</th>
                            <th class="text-center">Stok</th>
                            <th class="text-center">Status</th>
                            <th class="text-center">Transaksi</th>
                            <th class="text-center">Urutan</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($plans as $plan)
                            <tr>
                                <td><code>{{ $plan->id }}</code></td>
                                <td>
                                    <strong>{{ $plan->name }}</strong><br>
                                    <small style="color:var(--adm-dim)">{{ $plan->slug }}@if($plan->is_featured) &middot; <span class="adm-badge adm-badge--primary" style="padding:1px 8px">Featured</span>@endif</small>
                                </td>
                                <td class="text-right">
                                    Rp {{ number_format($plan->price_monthly, 0, ',', '.') }}<br>
                                    <small style="color:var(--adm-dim)">-{{ $plan->yearly_discount }}% / thn</small>
                                </td>
                                <td>{{ $plan->cpu }} CPU &middot; {{ number_format($plan->memory / 1024, 1) }} GB RAM &middot; {{ number_format($plan->disk / 1024, 1) }} GB</td>
                                <td><small>nest {{ $plan->nest_id ?? '—' }} / egg {{ $plan->egg_id ?? '—' }} / node {{ $plan->node_id ?? '—' }}</small></td>
                                <td class="text-center">{{ $plan->stock === null ? '∞' : $plan->stock }}</td>
                                <td class="text-center">@if($plan->is_active)<span class="adm-badge adm-badge--success"><span class="adm-dot"></span> Aktif</span>@else<span class="adm-badge adm-badge--danger"><span class="adm-dot"></span> Nonaktif</span>@endif</td>
                                <td class="text-center">{{ $plan->orders_count }}</td>
                                <td class="text-center">{{ $plan->sort_order }}</td>
                                <td class="text-right" style="white-space:nowrap">
                                    <a href="{{ route('admin.billing.plans.edit', $plan->id) }}" class="btn btn-sm btn-default"><i class="fa fa-pencil"></i></a>
                                    <form action="{{ route('admin.billing.plans.delete', $plan->id) }}" method="POST" style="display:inline" onsubmit="return confirm('Hapus paket {{ $plan->name }}? Paket yang sudah punya transaksi tidak bisa dihapus.')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-danger"><i class="fa fa-trash"></i></button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="10" class="text-center" style="padding:24px;color:var(--adm-dim)">Belum ada paket. <a href="{{ route('admin.billing.plans.new') }}">Buat yang pertama &rarr;</a></td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection

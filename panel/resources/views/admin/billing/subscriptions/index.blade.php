@extends('layouts.admin')

@section('title')
    Billing — Subscriptions
@endsection

@section('content-header')
    <h1>Subscriptions<small>Langganan pelanggan dan status servernya.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing') }}">Billing</a></li>
        <li class="active">Subscriptions</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Daftar Subscription</h3>
                <a href="{{ route('admin.billing.subscriptions.grant') }}" class="btn btn-sm btn-primary" style="margin-right:8px"><i class="fa fa-gift"></i> Beri Langganan</a><form class="box-tools" method="GET" action="{{ route('admin.billing.subscriptions') }}" style="display:flex;gap:8px;align-items:center">
                    <select name="status" class="form-control input-sm" style="width:160px">
                        <option value="">Semua status</option>
                        @foreach(['provisioning' => 'Provisioning', 'active' => 'Aktif', 'suspended' => 'Suspended', 'expired' => 'Expired', 'cancelled' => 'Batal', 'failed' => 'Gagal'] as $key => $label)
                            <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                    <input type="text" name="q" class="form-control input-sm" value="{{ $q }}" placeholder="Cari server / user / paket…" style="width:220px">
                    <button type="submit" class="btn btn-sm btn-primary"><i class="fa fa-search"></i></button>
                    @if($status || $q)
                        <a href="{{ route('admin.billing.subscriptions') }}" class="btn btn-sm btn-default">Reset</a>
                    @endif
                </form>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Paket</th>
                            <th>Server</th>
                            <th>Status</th>
                            <th>Mulai</th>
                            <th>Berakhir</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($subscriptions as $subscription)
                            <tr>
                                <td><code>{{ $subscription->id }}</code></td>
                                <td>{{ $subscription->user?->username ?? '—' }}<br><small style="color:var(--adm-dim)">{{ $subscription->user?->email }}</small></td>
                                <td>{{ $subscription->plan?->name ?? '—' }}</td>
                                <td>
                                    @if($subscription->pterodactyl_server_id)
                                        <a href="{{ url('/admin/servers/view/' . $subscription->pterodactyl_server_id) }}"><code>{{ $subscription->server_identifier ?? $subscription->pterodactyl_server_id }}</code></a>
                                    @else
                                        <small style="color:var(--adm-dim)">belum dibuat</small>
                                    @endif
                                </td>
                                <td>@include('admin.billing._status', ['status' => $subscription->status])</td>
                                <td>{{ optional($subscription->starts_at)->format('d M Y') ?? '—' }}</td>
                                <td>
                                    {{ optional($subscription->expires_at)->format('d M Y H:i') ?? '—' }}
                                    @if($subscription->expires_at && $subscription->expires_at->isPast() && $subscription->status === 'active')
                                        <br><small style="color:#b45309">lewat jatuh tempo</small>
                                    @endif
                                </td>
                                <td class="text-right"><a href="{{ route('admin.billing.subscriptions.show', $subscription->id) }}" class="btn btn-sm btn-default">Detail</a></td>
                            </tr>
                        @empty
                            <tr><td colspan="8" class="text-center" style="padding:24px;color:var(--adm-dim)">Belum ada subscription.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            @if ($subscriptions->hasPages())
                <div class="box-footer" style="display:flex;justify-content:space-between;align-items:center">
                    <small style="color:var(--adm-dim)">Menampilkan {{ $subscriptions->firstItem() }}–{{ $subscriptions->lastItem() }} dari {{ $subscriptions->total() }}</small>
                    {{ $subscriptions->links() }}
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

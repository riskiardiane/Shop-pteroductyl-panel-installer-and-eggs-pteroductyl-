@extends('layouts.admin')

@section('title')
    Subscription #{{ $subscription->id }}
@endsection

@section('content-header')
    <h1>Subscription #{{ $subscription->id }}<small>{{ $subscription->plan?->name }} &middot; {{ $subscription->user?->username }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing.subscriptions') }}">Subscriptions</a></li>
        <li class="active">#{{ $subscription->id }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-8">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Detail Subscription</h3>
                <div class="box-tools">@include('admin.billing._status', ['status' => $subscription->status])</div>
            </div>
            <div class="box-body">
                <table class="table">
                    <tbody>
                        <tr><th style="width:220px">User</th><td>
                            @if($subscription->user)
                                <strong>{{ $subscription->user->username }}</strong> — {{ $subscription->user->email }}<br>
                                <a href="{{ url('/admin/users/view/' . $subscription->user->id) }}" class="btn btn-xs btn-default" style="margin-top:6px">Buka user &rarr;</a>
                            @else
                                <em>user terhapus</em>
                            @endif
                        </td></tr>
                        <tr><th>Plan</th><td>{{ $subscription->plan?->name }} (<code>{{ $subscription->plan?->slug }}</code>)</td></tr>
                        <tr><th>Server Pterodactyl</th><td>
                            @if($subscription->pterodactyl_server_id)
                                <a href="{{ url('/admin/servers/view/' . $subscription->pterodactyl_server_id) }}" class="btn btn-sm btn-default"><i class="fa fa-server"></i> &nbsp;ID {{ $subscription->pterodactyl_server_id }} — Buka Servers</a><br>
                                <small style="color:var(--adm-dim)">Identifier: <code>{{ $subscription->server_identifier }}</code></small><br>
                                <small style="color:var(--adm-dim)">UUID: <code>{{ $subscription->server_uuid }}</code></small>
                            @else
                                <span style="color:var(--adm-dim)">Belum dibuat (menunggu provisioning)</span>
                            @endif
                        </td></tr>
                        <tr><th>Mulai</th><td>{{ optional($subscription->starts_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                        <tr><th>Berakhir</th><td>
                            {{ optional($subscription->expires_at)->format('d M Y H:i') ?? '—' }}
                            @if($subscription->expires_at)
                                <br><small style="color:var(--adm-dim)">{{ $subscription->expires_at->isPast() ? 'Sudah lewat (' . $subscription->expires_at->diffForHumans() . ')' : 'Sisa ' . $subscription->expires_at->diffForHumans(now(), ['parts' => 2]) }}</small>
                            @endif
                        </td></tr>
                        <tr><th>Auto Renew</th><td>{{ $subscription->auto_renew ? 'Ya' : 'Tidak' }}</td></tr>
                        <tr><th>Slot server</th><td>
                            <strong>{{ $slotsUsed }}/{{ $subscription->plan?->server_limit ?? 1 }}</strong> terpakai
                            @if(($subscription->plan?->server_limit ?? 1) - $slotsUsed > 0)
                                <span class="label label-success" style="margin-left:6px">{{ ($subscription->plan?->server_limit ?? 1) - $slotsUsed }} slot tersisa</span>
                            @else
                                <span class="label label-warning" style="margin-left:6px">Penuh</span>
                            @endif
                        </td></tr>
                        <tr><th>Order terkait</th><td>
                            @if($subscription->order_id)
                                <a href="{{ route('admin.billing.orders.show', $subscription->order_id) }}"><code>#{{ $subscription->order_id }}</code> — lihat order</a>
                            @else
                                —
                            @endif
                        </td></tr>
                    </tbody>
                </table>

                @if($servers->isNotEmpty())
                    <p style="font-weight:700;color:var(--adm-text);margin:10px 0 6px">Server dari Benefit</p>
                    <table class="table">
                        <thead><tr><th>Nama</th><th>Status</th><th>ID / Identifier</th><th>Dibuat</th></tr></thead>
                        <tbody>
                            @foreach($servers as $benefitServer)
                                <tr>
                                    <td>{{ $benefitServer->name }}</td>
                                    <td>@include('admin.billing._status', ['status' => $benefitServer->status])</td>
                                    <td>
                                        @if($benefitServer->server_id)
                                            <a href="{{ url('/admin/servers/view/' . $benefitServer->server_id) }}">#{{ $benefitServer->server_id }}</a>
                                            @if($benefitServer->server_identifier)<br><code>{{ $benefitServer->server_identifier }}</code>@endif
                                        @else
                                            <span style="color:var(--adm-dim)">—</span>
                                        @endif
                                    </td>
                                    <td>{{ optional($benefitServer->created_at)->format('d M Y H:i') ?? '—' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif

                @if(!empty($subscription->meta))
                    <p style="font-weight:700;color:var(--adm-text);margin:10px 0 6px">Meta</p>
                    <pre style="background:var(--adm-surface-2);border:1px solid var(--adm-border);border-radius:12px;padding:12px;font-size:11px;max-height:220px;overflow:auto">{{ json_encode($subscription->meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) }}</pre>
                @endif
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="box">
            <div class="box-header with-border"><h3 class="box-title">Aksi</h3></div>
            <div class="box-body" style="display:grid;gap:10px">
                @if($subscription->status !== 'active')
                    <form method="POST" action="{{ route('admin.billing.subscriptions.activate', $subscription->id) }}" onsubmit="return confirm('Aktifkan kembali subscription ini?')">
                        @csrf
                        <button type="submit" class="btn btn-success btn-block"><i class="fa fa-check"></i> &nbsp;Aktifkan</button>
                    </form>
                @endif
                @if(! in_array($subscription->status, ['suspended', 'cancelled', 'expired'], true))
                    <form method="POST" action="{{ route('admin.billing.subscriptions.suspend', $subscription->id) }}" onsubmit="return confirm('Suspend subscription ini?')">
                        @csrf
                        <button type="submit" class="btn btn-default btn-block"><i class="fa fa-pause"></i> &nbsp;Suspend</button>
                    </form>
                @endif
                @if($subscription->status !== 'cancelled')
                    <form method="POST" action="{{ route('admin.billing.subscriptions.cancel', $subscription->id) }}" onsubmit="return confirm('BATALKAN subscription ini? Server TIDAK dihapus otomatis.')">
                        @csrf
                        <button type="submit" class="btn btn-danger btn-block"><i class="fa fa-ban"></i> &nbsp;Batalkan</button>
                    </form>
                @endif
                <div class="callout callout-warning" style="margin-bottom:0;background:var(--adm-surface-2);border:1px solid var(--adm-border);color:var(--adm-muted);padding:10px 12px;font-size:12px">
                    <i class="fa fa-info-circle"></i> Suspend/expire/cancel di sini hanya mengubah <strong>status billing</strong>. Untuk menangguhkan server Pterodactyl (stop power + blokir akses), lakukan lewat menu <a href="{{ $subscription->pterodactyl_server_id ? url('/admin/servers/view/' . $subscription->pterodactyl_server_id) : route('admin.servers') }}">Servers</a>.
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

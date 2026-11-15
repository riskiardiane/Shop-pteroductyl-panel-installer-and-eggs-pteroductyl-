@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h1>Administrative Overview<small>Ringkasan cepat kondisi panel dan cluster.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}"><i class="fa fa-home"></i> Admin</a></li>
        <li class="active">Overview</li>
    </ol>
@endsection

@section('content')
@php
    $stats = [
        'servers' => \Pterodactyl\Models\Server::count(),
        'users' => \Pterodactyl\Models\User::count(),
        'nodes' => \Pterodactyl\Models\Node::count(),
        'eggs' => \Pterodactyl\Models\Egg::count(),
    ];
@endphp

<div class="adm-grid" style="margin-bottom:20px">
    <div class="adm-stat">
        <div class="adm-stat__icon"><i class="fa fa-server"></i></div>
        <div>
            <div class="adm-stat__label">Total Server</div>
            <div class="adm-stat__value">{{ number_format($stats['servers']) }}</div>
            <div class="adm-stat__hint">Instance terdaftar</div>
        </div>
    </div>
    <div class="adm-stat">
        <div class="adm-stat__icon" style="background:rgba(8,145,178,.1);border-color:rgba(8,145,178,.3);color:#0e7490"><i class="fa fa-users"></i></div>
        <div>
            <div class="adm-stat__label">Pengguna</div>
            <div class="adm-stat__value">{{ number_format($stats['users']) }}</div>
            <div class="adm-stat__hint">Akun terdaftar</div>
        </div>
    </div>
    <div class="adm-stat">
        <div class="adm-stat__icon" style="background:rgba(5,150,105,.09);border-color:rgba(5,150,105,.3);color:#047857"><i class="fa fa-sitemap"></i></div>
        <div>
            <div class="adm-stat__label">Node</div>
            <div class="adm-stat__value">{{ number_format($stats['nodes']) }}</div>
            <div class="adm-stat__hint">Wings terhubung</div>
        </div>
    </div>
    <div class="adm-stat">
        <div class="adm-stat__icon" style="background:rgba(217,119,6,.1);border-color:rgba(217,119,6,.3);color:#b45309"><i class="fa fa-th-large"></i></div>
        <div>
            <div class="adm-stat__label">Egg</div>
            <div class="adm-stat__value">{{ number_format($stats['eggs']) }}</div>
            <div class="adm-stat__hint">Template game tersedia</div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-lg-8 col-xs-12">
        <div class="adm-panel" style="margin-bottom:20px">
            <div class="adm-panel__head">
                <div class="adm-panel__title">Informasi Sistem</div>
                <span class="adm-badge adm-badge--success"><span class="adm-dot"></span> Online</span>
            </div>
            <div class="adm-panel__body">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
                    <div style="width:52px;height:52px;border-radius:14px;background:rgba(109,78,240,.12);border:1px solid rgba(109,78,240,.32);display:flex;align-items:center;justify-content:center;color:var(--adm-primary-600);font-size:20px;flex-shrink:0">
                        <i class="fa fa-cube"></i>
                    </div>
                    <div>
                        <div style="font-size:14px;color:var(--adm-text);font-weight:500">
                            Panel berjalan pada versi
                            <span style="background:rgba(109,78,240,.12);color:var(--adm-primary-600);padding:2px 10px;border-radius:6px;font-weight:700;font-size:12px;font-family:ui-monospace,monospace">{{ config('app.version') }}</span>
                        </div>
                        <div style="font-size:12px;color:#047857;margin-top:5px;display:flex;align-items:center;gap:6px">
                            <i class="fa fa-check-circle"></i> Panel dalam kondisi normal
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-6">
                        <div style="background:var(--adm-surface-2);border:1px solid var(--adm-border);border-radius:12px;padding:14px">
                            <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--adm-dim);font-weight:700">PHP</div>
                            <div style="font-family:Outfit,sans-serif;font-size:18px;font-weight:700;color:var(--adm-text);margin-top:2px">{{ PHP_VERSION }}</div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div style="background:var(--adm-surface-2);border:1px solid var(--adm-border);border-radius:12px;padding:14px">
                            <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--adm-dim);font-weight:700">Laravel</div>
                            <div style="font-family:Outfit,sans-serif;font-size:18px;font-weight:700;color:var(--adm-text);margin-top:2px">{{ app()->version() }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-4 col-xs-12">
        <div class="adm-panel" style="margin-bottom:20px">
            <div class="adm-panel__head">
                <div class="adm-panel__title">Aksi Cepat</div>
            </div>
            <div class="adm-panel__body">
                <a href="{{ route('admin.servers.new') }}" class="btn btn-primary btn-block" style="margin-bottom:10px">
                    <i class="fa fa-plus"></i> Buat Server Baru
                </a>
                <a href="{{ route('admin.users.new') }}" class="btn btn-default btn-block" style="margin-bottom:10px">
                    <i class="fa fa-user-plus"></i> Tambah Pengguna
                </a>
                <a href="{{ route('admin.nodes.new') }}" class="btn btn-default btn-block" style="margin-bottom:10px">
                    <i class="fa fa-sitemap"></i> Tambah Node
                </a>
                <a href="{{ route('admin.nests') }}" class="btn btn-default btn-block">
                    <i class="fa fa-th-large"></i> Kelola Nests
                </a>
            </div>
        </div>

        <div class="adm-panel">
            <div class="adm-panel__head">
                <div class="adm-panel__title">Bantuan</div>
            </div>
            <div class="adm-panel__body" style="display:grid;gap:8px">
                <a href="{{ $version->getDiscord() }}" target="_blank" class="btn btn-default btn-block">
                    <i class="fa fa-globe"></i> Discord
                </a>
                <a href="https://pterodactyl.io" target="_blank" class="btn btn-default btn-block">
                    <i class="fa fa-book"></i> Dokumentasi
                </a>
                <a href="{{ $version->getDonations() }}" target="_blank" class="btn btn-success btn-block">
                    <i class="fa fa-heart"></i> Dukung Proyek
                </a>
            </div>
        </div>
    </div>
</div>
@endsection

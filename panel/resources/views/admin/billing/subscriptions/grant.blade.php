@extends('layouts.admin')

@section('title')
    Beri Langganan Manual
@endsection

@section('content-header')
    <h1>Beri Langganan Manual<small>Tanpa pembayaran (kompensasi / testing)</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing.subscriptions') }}">Subscriptions</a></li>
        <li class="active">Beri</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-7">
        <div class="box">
            <div class="box-header with-border"><h3 class="box-title">Form Langganan Manual</h3></div>
            <div class="box-body">
                @if($errors->any())
                    <div class="alert alert-danger" style="border-radius:12px">
                        <ul style="margin:0;padding-left:18px">@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
                    </div>
                @endif
                <form method="POST" action="{{ route('admin.billing.subscriptions.grant.store') }}">
                    @csrf
                    <div class="form-group">
                        <label>User</label>
                        <select name="user_id" class="form-control" required>
                            <option value="">— pilih user —</option>
                            @foreach($users as $user)
                                <option value="{{ $user->id }}" @selected(old('user_id') == $user->id)>{{ $user->username }} — {{ $user->email }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Paket</label>
                        <select name="plan_id" class="form-control" required>
                            <option value="">— pilih paket —</option>
                            @foreach($plans as $plan)
                                <option value="{{ $plan->id }}" @selected(old('plan_id') == $plan->id)>{{ $plan->name }} ({{ $plan->slug }}) — slot {{ $plan->server_limit }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Durasi (bulan)</label>
                        <input type="number" name="months" class="form-control" min="1" max="36" value="{{ old('months', 1) }}" required>
                    </div>
                    <div class="form-group">
                        <label>Catatan (opsional)</label>
                        <input type="text" name="note" class="form-control" maxlength="500" value="{{ old('note') }}" placeholder="mis. kompensasi insiden 14 Nov, testing self-service">
                    </div>
                    <div class="callout callout-info" style="border-radius:12px;background:var(--adm-surface-2);border:1px solid var(--adm-border);color:var(--adm-muted);font-size:12px;padding:10px 12px">
                        <i class="fa fa-info-circle"></i> Langganan dibuat langsung <strong>aktif</strong> tanpa order/invoice. Slot server paket langsung tersedia untuk user dan ia bisa memakai tombol <em>Buat Server</em> di dashboard.
                    </div>
                    <button type="submit" class="btn btn-primary"><i class="fa fa-gift"></i> &nbsp;Berikan Langganan</button>
                    <a href="{{ route('admin.billing.subscriptions') }}" class="btn btn-default">Batal</a>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

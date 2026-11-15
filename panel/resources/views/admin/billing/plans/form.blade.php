@extends('layouts.admin')

@section('title')
    {{ $mode === 'create' ? 'Paket Baru' : 'Edit Paket' }}
@endsection

@section('content-header')
    <h1>{{ $mode === 'create' ? 'Paket Baru' : 'Edit Paket: ' . $plan->name }}<small>Harga dalam Rupiah penuh (mis. 15000). Memory/disk dalam MB.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.billing.plans') }}">Plans</a></li>
        <li class="active">{{ $mode === 'create' ? 'Baru' : 'Edit' }}</li>
    </ol>
@endsection

@section('content')
<form method="POST" action="{{ $mode === 'create' ? route('admin.billing.plans.store') : route('admin.billing.plans.update', $plan->id) }}">
    @csrf
    @if($mode !== 'create')
        @method('PATCH')
    @endif

    <div class="row">
        <div class="col-md-8">
            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Informasi Paket</h3></div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-md-4 form-group">
                            <label>Nama <span style="color:#e11d48">*</span></label>
                            <input type="text" name="name" class="form-control" value="{{ old('name', $plan->name) }}" required maxlength="191">
                        </div>
                        <div class="col-md-3 form-group">
                            <label>Slug <span style="color:#e11d48">*</span></label>
                            <input type="text" name="slug" class="form-control" value="{{ old('slug', $plan->slug) }}" required maxlength="191" placeholder="starter">
                        </div>
                        <div class="col-md-5 form-group">
                            <label>Ribbon (opsional)</label>
                            <input type="text" name="ribbon" class="form-control" value="{{ old('ribbon', $plan->ribbon) }}" maxlength="191" placeholder="Populer / Terlaris">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Tagline</label>
                        <input type="text" name="tagline" class="form-control" value="{{ old('tagline', $plan->tagline) }}" maxlength="191" placeholder="Untuk bot, panel pribadi, dan server kecil.">
                    </div>
                    <div class="row">
                        <div class="col-md-3 form-group">
                            <label>Harga / bulan (Rp) <span style="color:#e11d48">*</span></label>
                            <input type="number" name="price_monthly" class="form-control" value="{{ old('price_monthly', $plan->price_monthly) }}" required min="0" step="1000">
                        </div>
                        <div class="col-md-3 form-group">
                            <label>Diskon tahunan (%)</label>
                            <input type="number" name="yearly_discount" class="form-control" value="{{ old('yearly_discount', $plan->yearly_discount ?? 15) }}" min="0" max="90">
                        </div>
                        <div class="col-md-3 form-group">
                            <label>Stok (kosong = ∞)</label>
                            <input type="number" name="stock" class="form-control" value="{{ old('stock', $plan->stock) }}" min="0" placeholder="∞">
                        </div>
                        <div class="col-md-3 form-group">
                            <label>Urutan</label>
                            <input type="number" name="sort_order" class="form-control" value="{{ old('sort_order', $plan->sort_order ?? 0) }}" min="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Fitur (satu baris per poin, atau JSON array)</label>
                        <textarea name="features" class="form-control" rows="4" placeholder="DDoS protection&#10;Backup harian&#10;Support 24/7">{{ old('features', is_array($plan->features) ? implode("\n", $plan->features) : '') }}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Label Bandwidth</label>
                        <input type="text" name="bandwidth_label" class="form-control" value="{{ old('bandwidth_label', $plan->bandwidth_label) }}" maxlength="191" placeholder="Unlimited / 1 TB">
                    </div>
                </div>
            </div>

            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Spesifikasi &amp; Target Provisioning</h3></div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-md-3 form-group"><label>CPU (%) <span style="color:#e11d48">*</span></label><input type="number" name="cpu" class="form-control" value="{{ old('cpu', $plan->cpu) }}" required min="1"><p class="help-block">100 = 1 core</p></div>
                        <div class="col-md-3 form-group"><label>Memory (MB) <span style="color:#e11d48">*</span></label><input type="number" name="memory" class="form-control" value="{{ old('memory', $plan->memory) }}" required min="1"></div>
                        <div class="col-md-3 form-group"><label>Disk (MB) <span style="color:#e11d48">*</span></label><input type="number" name="disk" class="form-control" value="{{ old('disk', $plan->disk) }}" required min="1"></div>
                        <div class="col-md-3 form-group"><label>Swap (MB)</label><input type="number" name="swap" class="form-control" value="{{ old('swap', $plan->swap ?? 0) }}" min="0"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-3 form-group"><label>IO Weight</label><input type="number" name="io" class="form-control" value="{{ old('io', $plan->io ?? 500) }}" min="0"></div>
                        <div class="col-md-3 form-group"><label>Limit Server</label><input type="number" name="server_limit" class="form-control" value="{{ old('server_limit', $plan->server_limit ?? 1) }}" min="0"></div>
                        <div class="col-md-3 form-group"><label>Limit Backup</label><input type="number" name="backup_limit" class="form-control" value="{{ old('backup_limit', $plan->backup_limit ?? 3) }}" min="0"></div>
                        <div class="col-md-3 form-group"><label>Limit Database</label><input type="number" name="database_limit" class="form-control" value="{{ old('database_limit', $plan->database_limit ?? 1) }}" min="0"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-3 form-group"><label>Limit Allocation</label><input type="number" name="allocation_limit" class="form-control" value="{{ old('allocation_limit', $plan->allocation_limit ?? 1) }}" min="0"></div>
                        <div class="col-md-9 form-group">
                            <label>Nest / Egg / Node</label>
                            <div class="row">
                                <div class="col-md-4">
                                    <select name="nest_id" class="form-control">
                                        <option value="">— pilih nest —</option>
                                        @foreach($nests as $nest)
                                            <option value="{{ $nest->id }}" @selected((string) old('nest_id', $plan->nest_id) === (string) $nest->id)>{{ $nest->name }} (#{{ $nest->id }})</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <select name="egg_id" class="form-control">
                                        <option value="">— pilih egg —</option>
                                        @foreach($nests as $nest)
                                            <optgroup label="{{ $nest->name }}">
                                                @foreach($nest->eggs as $egg)
                                                    <option value="{{ $egg->id }}" @selected((string) old('egg_id', $plan->egg_id) === (string) $egg->id)>{{ $egg->name }} (#{{ $egg->id }})</option>
                                                @endforeach
                                            </optgroup>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <select name="node_id" class="form-control">
                                        <option value="">— pilih node —</option>
                                        @foreach($nodes as $node)
                                            <option value="{{ $node->id }}" @selected((string) old('node_id', $plan->node_id) === (string) $node->id)>{{ $node->name }} (#{{ $node->id }})</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Docker Image</label>
                        <input type="text" name="docker_image" class="form-control" value="{{ old('docker_image', $plan->docker_image) }}" maxlength="191" placeholder="ghcr.io/parkervcp/yolks:java_17">
                    </div>
                    <div class="form-group">
                        <label>Startup Command</label>
                        <input type="text" name="startup" class="form-control" value="{{ old('startup', $plan->startup) }}" placeholder="java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}">
                    </div>
                    <div class="form-group">
                        <label>Environment (JSON object)</label>
                        <textarea name="environment" class="form-control" rows="3" style="font-family:ui-monospace,monospace" placeholder='{"SERVER_JARFILE": "server.jar", "BUILD_NUMBER": "latest"}'>{{ old('environment', $plan->environment ? json_encode($plan->environment, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '') }}</textarea>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Visibilitas</h3></div>
                <div class="box-body">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="is_active" value="1" @checked(old('is_active', $plan->is_active ?? true))> &nbsp;<strong>Aktif</strong> — tampil di /pricing dan bisa dibeli
                        </label>
                    </div>
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="is_featured" value="1" @checked(old('is_featured', $plan->is_featured ?? false))> &nbsp;<strong>Featured</strong> — beri sorotan khusus di kartu paket
                        </label>
                    </div>
                    <p class="help-block" style="margin-top:12px">Slug, harga, dan spek dibaca langsung dari database saat /pricing di-render — perubahan langsung tayang.</p>
                </div>
            </div>

            <div class="box">
                <div class="box-header with-border"><h3 class="box-title">Bantuan</h3></div>
                <div class="box-body" style="font-size:13px">
                    <ul style="padding-left:18px;margin-bottom:0;color:var(--adm-muted);line-height:2">
                        <li>CPU <code>100</code> = 1 vCore, <code>200</code> = 2 vCore.</li>
                        <li>Memory &amp; disk diisi dalam <strong>MB</strong> (2048 = 2 GB).</li>
                        <li>Fitur: satu baris per poin. Karakter <code>[...]</code> = JSON.</li>
                        <li>Paket yang sudah punya transaksi <strong>tidak bisa dihapus</strong> — nonaktifkan saja.</li>
                    </ul>
                </div>
            </div>

            <div class="box" style="border-color:var(--adm-border-accent)">
                <div class="box-body" style="display:grid;gap:10px">
                    <button type="submit" class="btn btn-primary btn-lg btn-block"><i class="fa fa-save"></i> &nbsp;{{ $mode === 'create' ? 'Buat Paket' : 'Simpan Perubahan' }}</button>
                    <a href="{{ route('admin.billing.plans') }}" class="btn btn-default btn-block">Batal</a>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'web'])

@section('title')
    Settings Web
@endsection

@section('content-header')
    <h1>Settings Web<small>Sesuaikan nama, icon, dan integrasi pembayaran website kamu.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.settings') }}">Settings</a></li>
        <li class="active">Web</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')

    <form action="{{ route('admin.settings.web') }}" method="POST" enctype="multipart/form-data">
        {{-- ================= IDENTITAS WEB ================= --}}
        <div class="row">
            <div class="col-xs-12">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-globe"></i> Identitas Web</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Nama Web</label>
                                <input type="text" class="form-control" name="web:name" value="{{ old('web:name', config('web.name')) }}" placeholder="{{ config('app.name') }}" />
                                <p class="text-muted"><small>Nama yang tampil di navbar, sidebar admin, halaman login dan tab browser. Kosongkan untuk memakai default <code>{{ config('app.name') }}</code>.</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Title Web</label>
                                <input type="text" class="form-control" name="web:title" value="{{ old('web:title', config('web.title')) }}" placeholder="{{ config('web.name') ?: config('app.name') }}" />
                                <p class="text-muted"><small>Ditampilkan pada tab browser (<code>&lt;title&gt;</code>) dan meta description. Kosongkan untuk memakai Nama Web.</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Theme Color</label>
                                <input type="text" class="form-control" name="web:theme_color" value="{{ old('web:theme_color', config('web.theme_color')) }}" placeholder="#6250f5" pattern="^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$" />
                                <p class="text-muted"><small>Warna untuk browser chrome / PWA manifest, contoh <code>#6250f5</code>.</small></p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Meta Description</label>
                                <textarea class="form-control" name="web:description" rows="2" maxlength="500" placeholder="Panel game server #1 di Indonesia...">{{ old('web:description', config('web.description')) }}</textarea>
                                <p class="text-muted"><small>Deskripsi singkat yang dibaca mesin pencari dan saat link di-share.</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Kontak Email</label>
                                <input type="email" class="form-control" name="web:email" value="{{ old('web:email', config('web.email')) }}" placeholder="animersvercel@gmail.com" />
                                <p class="text-muted"><small>Email support yang bisa ditampilkan di halaman kontak / footer.</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">URL Discord / Support</label>
                                <input type="url" class="form-control" name="web:discord" value="{{ old('web:discord', config('web.discord')) }}" placeholder="https://discord.gg/xxxx" />
                                <p class="text-muted"><small>Link invite Discord atau halaman support. Dipakai di footer landing page.</small></p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-8">
                                <label class="control-label">Footer Text</label>
                                <input type="text" class="form-control" name="web:footer" value="{{ old('web:footer', config('web.footer')) }}" placeholder="&copy; {{ date('Y') }} RizzDevs — Seluruh hak dilindungi" />
                                <p class="text-muted"><small>Teks kecil di bagian bawah setiap halaman. Kosongkan untuk default <code>© {{ date('Y') }} RizzDevs</code>.</small></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- ================= X-ICON & LOGO ================= --}}
        <div class="row">
            <div class="col-xs-12">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-image"></i> X-icon Web &amp; Logo</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">X-icon Web (favicon)</label>
                                <div class="row">
                                    <div class="col-xs-3 text-center" style="padding-top:6px">
                                        @if(config('web.favicon'))
                                            <img src="{{ config('web.favicon') }}" alt="Favicon" style="width:48px;height:48px;object-fit:contain;border:1px solid rgba(18,24,58,.12);border-radius:12px;padding:6px;background:#fff" />
                                        @else
                                            <img src="/favicons/favicon-32x32.png" alt="Favicon (default)" style="width:48px;height:48px;object-fit:contain;border:1px dashed rgba(18,24,58,.25);border-radius:12px;padding:6px" />
                                        @endif
                                        <p class="text-muted" style="margin-top:6px;margin-bottom:0"><small>{{ config('web.favicon') ? 'Terpasang' : 'Default' }}</small></p>
                                    </div>
                                    <div class="col-xs-9">
                                        <input type="text" class="form-control" name="web:favicon" value="{{ old('web:favicon', is_string(config('web.favicon')) && !str_starts_with(config('web.favicon'), '/storage/') ? config('web.favicon') : '') }}" placeholder="https://.../favicon.ico atau /storage/settings/favicon.ico" />
                                        <input type="file" class="form-control" name="web_favicon_file" accept=".ico,.png,.jpg,.jpeg,.svg,.webp" style="margin-top:8px;padding-top:6px" />
                                        <label style="font-weight:normal;margin-top:8px">
                                            <input type="checkbox" name="web_favicon_clear" value="1" /> Hapus favicon custom (pakai default)
                                        </label>
                                        <p class="text-muted" style="margin-bottom:0"><small>.ico/.png/.jpg/.svg/.webp, maks 1 MB. Upload menimpa URL.</small></p>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Logo Web</label>
                                <div class="row">
                                    <div class="col-xs-3 text-center" style="padding-top:6px">
                                        @if(config('web.logo'))
                                            <img src="{{ config('web.logo') }}" alt="Logo" style="max-height:56px;max-width:100%;object-fit:contain;border:1px solid rgba(18,24,58,.12);border-radius:12px;padding:6px;background:#fff" />
                                        @else
                                            <div style="width:56px;height:56px;margin:0 auto;border:1px dashed rgba(18,24,58,.25);border-radius:12px;display:grid;place-items:center;color:#8a7bff;font-size:22px"><i class="fa fa-server"></i></div>
                                        @endif
                                        <p class="text-muted" style="margin-top:6px;margin-bottom:0"><small>{{ config('web.logo') ? 'Terpasang' : 'Default' }}</small></p>
                                    </div>
                                    <div class="col-xs-9">
                                        <input type="text" class="form-control" name="web:logo" value="{{ old('web:logo', is_string(config('web.logo')) && !str_starts_with(config('web.logo'), '/storage/') ? config('web.logo') : '') }}" placeholder="https://.../logo.png atau /storage/settings/logo.png" />
                                        <input type="file" class="form-control" name="web_logo_file" accept=".png,.jpg,.jpeg,.svg,.webp" style="margin-top:8px;padding-top:6px" />
                                        <label style="font-weight:normal;margin-top:8px">
                                            <input type="checkbox" name="web_logo_clear" value="1" /> Hapus logo (pakai ikon default)
                                        </label>
                                        <p class="text-muted" style="margin-bottom:0"><small>.png/.jpg/.svg/.webp, maks 2 MB. Logo tampil di navbar &amp; login.</small></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- ================= MUSTIKA PAYMENT & BILLING ================= --}}
        <div class="row">
            <div class="col-xs-12">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-credit-card"></i> Mustika Payment &amp; Billing</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Mustika Base URL</label>
                                <input type="url" class="form-control" name="billing:mustika:base_url" value="{{ old('billing:mustika:base_url', config('billing.mustika.base_url', 'https://mustikapayment.com')) }}" placeholder="https://mustikapayment.com" required />
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Mustika Timestamp Tolerance <span class="text-muted">(detik)</span></label>
                                <input type="number" class="form-control" name="billing:mustika:timestamp_tolerance" value="{{ old('billing:mustika:timestamp_tolerance', config('billing.mustika.timestamp_tolerance', 0)) }}" min="0" max="300" required />
                                <p class="text-muted"><small>Leeway untuk validasi webhook Mustika. Isi <code>0</code> untuk nonaktif.</small></p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-8">
                                <label class="control-label">Mustika Payment Key
                                    @if($mustikaKeyIsSet)
                                        <span class="label label-success" style="margin-left:6px"><i class="fa fa-lock"></i> Key tersimpan</span>
                                    @else
                                        <span class="label label-warning" style="margin-left:6px"><i class="fa fa-exclamation-triangle"></i> Belum diatur</span>
                                    @endif
                                </label>
                                <input type="password" class="form-control" name="billing:mustika:api_key" value="" autocomplete="new-password" placeholder="{{ $mustikaKeyIsSet ? 'Kosongkan jika tidak ingin mengubah key' : 'Tempel API key MustikaPay di sini' }}" />
                                <label style="font-weight:normal;margin-top:8px">
                                    <input type="checkbox" name="billing:mustika:clear_key" value="1" /> Hapus API key yang tersimpan
                                </label>
                                <p class="text-muted" style="margin-bottom:0"><small>Disimpan terenkripsi di database, tidak pernah dikirim ke browser. Ambil key di dashboard MustikaPay.</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Invoice Prefix</label>
                                <input type="text" class="form-control" name="billing:invoice_prefix" value="{{ old('billing:invoice_prefix', config('billing.invoice_prefix', 'INV')) }}" placeholder="INV" maxlength="16" required />
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">Checkout Expiry <span class="text-muted">(menit)</span></label>
                                <input type="number" class="form-control" name="billing:checkout:expiry_minutes" value="{{ old('billing:checkout:expiry_minutes', config('billing.checkout.expiry_minutes', 30)) }}" min="1" max="1440" required />
                                <p class="text-muted"><small>QRIS dianggap kedaluwarsa setelah sekian menit.</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Grace Period <span class="text-muted">(hari)</span></label>
                                <input type="number" class="form-control" name="billing:grace_days" value="{{ old('billing:grace_days', config('billing.grace_days', 7)) }}" min="0" max="90" required />
                                <p class="text-muted"><small>Berapa hari setelah expired server ditangguhkan (bukan dihapus).</small></p>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">&nbsp;</label>
                                <div class="alert alert-info" style="margin-bottom:0;padding:10px 12px"><small><i class="fa fa-info-circle"></i> Perubahan billing langsung efektif — checkout, webhook &amp; auto-suspend membacanya dari database pada setiap request.</small></div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Success URL</label>
                                <input type="url" class="form-control" name="billing:checkout:success_url" value="{{ old('billing:checkout:success_url', config('billing.checkout.success_url')) }}" placeholder="https://panel.example.com/success" />
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Cancel URL</label>
                                <input type="url" class="form-control" name="billing:checkout:cancel_url" value="{{ old('billing:checkout:cancel_url', config('billing.checkout.cancel_url')) }}" placeholder="https://panel.example.com/pricing" />
                            </div>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection

@php
    $map = [
        'pending' => ['warning', 'Pending'],
        'paid' => ['success', 'Lunas'],
        'failed' => ['danger', 'Gagal'],
        'cancelled' => ['danger', 'Batal'],
        'expired' => ['danger', 'Expired'],
        'unpaid' => ['warning', 'Belum Bayar'],
        'refunded' => ['primary', 'Refund'],
        'provisioning' => ['primary', 'Provisioning'],
        'active' => ['success', 'Aktif'],
        'suspended' => ['warning', 'Suspended'],
    ];
    [$tone, $label] = $map[$status] ?? ['primary', ucfirst((string) $status)];
@endphp
<span class="adm-badge adm-badge--{{ $tone }}"><span class="adm-dot"></span> {{ $label }}</span>

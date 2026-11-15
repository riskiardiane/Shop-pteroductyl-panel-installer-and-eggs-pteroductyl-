<?php

return [
    /*
    |--------------------------------------------------------------------------
    | MustikaPayment (QRIS)
    |--------------------------------------------------------------------------
    |
    | API key diperoleh dari dashboard MustikaPay. Nilai ini HANYA boleh ada
    | di server (.env), tidak pernah dikirim ke browser.
    |
    */
    'mustika' => [
        'base_url' => env('MUSTIKA_BASE_URL', 'https://mustikapayment.com'),
        'api_key' => env('MUSTIKA_API_KEY'),
        'timestamp_tolerance' => (int) env('MUSTIKA_TIMESTAMP_TOLERANCE', 0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Checkout
    |--------------------------------------------------------------------------
    */
    'checkout' => [
        'expiry_minutes' => (int) env('BILLING_EXPIRY_MINUTES', 30),
        'success_url' => env('BILLING_SUCCESS_URL', rtrim(env('APP_URL', 'http://localhost'), '/') . '/success'),
        'cancel_url' => env('BILLING_CANCEL_URL', rtrim(env('APP_URL', 'http://localhost'), '/') . '/pricing'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pterodactyl Application API (auto-provisioning)
    |--------------------------------------------------------------------------
    |
    | Buat API key di /admin/api dengan permission:
    |   users.read, users.write, servers.read, servers.write, nodes.read
    |
    */
    'pterodactyl' => [
        'url' => env('PTERODACTYL_APP_URL', env('APP_URL', 'http://localhost')),
        'token' => env('PTERODACTYL_APP_API_KEY'),
        'timeout' => (int) env('PTERODACTYL_APP_TIMEOUT', 30),
    ],

    'invoice_prefix' => env('BILLING_INVOICE_PREFIX', 'INV'),

    /*
    |--------------------------------------------------------------------------
    | Grace period
    |--------------------------------------------------------------------------
    |
    | Setelah expired, server ditangguhkan. Setelah `grace_days` hari, langganan
    | ditandai expired (dan server dapat dihapus dengan `billing:expire --delete`).
    |
    */
    'grace_days' => (int) env('BILLING_GRACE_DAYS', 7),
];

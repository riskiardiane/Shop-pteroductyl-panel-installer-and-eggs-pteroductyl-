<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Pterodactyl\Models\Billing\Plan;

/**
 * Seed 3 paket awal. Sesuaikan nest/egg/node/docker/startup/environment
 * dengan node kamu SEBELUM provisioning dipakai.
 *
 *   php artisan db:seed --class=BillingPlanSeeder
 */
class BillingPlanSeeder extends Seeder
{
    public function run(): void
    {
        $target = [
            'nest_id' => (int) env('BILLING_PLAN_NEST_ID', 1),
            'egg_id' => (int) env('BILLING_PLAN_EGG_ID', 1),
            'node_id' => (int) env('BILLING_PLAN_NODE_ID', 1),
            'docker_image' => env('BILLING_PLAN_DOCKER_IMAGE', 'ghcr.io/parkervcp/yolks:java_17'),
            'startup' => env('BILLING_PLAN_STARTUP', 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}'),
            'environment' => json_decode((string) env('BILLING_PLAN_ENVIRONMENT', '{}'), true) ?: [],
        ];

        Plan::updateOrCreate(['slug' => 'starter'], array_merge($target, [
            'name' => 'Starter',
            'tagline' => 'Untuk bot, panel pribadi, dan server kecil.',
            'price_monthly' => 15000,
            'yearly_discount' => 15,
            'cpu' => 100,
            'memory' => 2048,
            'disk' => 10240,
            'bandwidth_label' => '1 TB',
            'backup_limit' => 3,
            'database_limit' => 1,
            'allocation_limit' => 1,
            'features' => [
                '1 server / 1 panel', 'Unlimited sub-user', 'Backup harian 3 slot',
                'DDoS protection dasar', 'Support tiket 24 jam',
            ],
            'is_featured' => false,
            'stock' => 24,
            'is_active' => true,
            'sort_order' => 1,
        ]));

        Plan::updateOrCreate(['slug' => 'growth'], array_merge($target, [
            'name' => 'Growth',
            'tagline' => 'Paling pas untuk komunitas dan server publik.',
            'price_monthly' => 45000,
            'yearly_discount' => 20,
            'cpu' => 300,
            'memory' => 8192,
            'disk' => 40960,
            'bandwidth_label' => '4 TB',
            'backup_limit' => 10,
            'database_limit' => 3,
            'allocation_limit' => 2,
            'features' => [
                '3 server / 3 panel', 'Backup harian 10 slot', 'DDoS protection lanjutan',
                'Gratis 1 subdomain panel', 'Prioritas support', 'Auto-provisioning instan',
            ],
            'is_featured' => true,
            'ribbon' => 'Paling Laris',
            'stock' => 12,
            'is_active' => true,
            'sort_order' => 2,
        ]));

        Plan::updateOrCreate(['slug' => 'elite'], array_merge($target, [
            'name' => 'Elite',
            'tagline' => 'Performa tinggi untuk server ramai & kebutuhan produksi.',
            'price_monthly' => 120000,
            'yearly_discount' => 25,
            'cpu' => 600,
            'memory' => 16384,
            'disk' => 102400,
            'bandwidth_label' => '10 TB',
            'backup_limit' => 30,
            'database_limit' => 5,
            'allocation_limit' => 3,
            'features' => [
                '10 server / 10 panel', 'Backup harian 30 slot', 'DDoS protection premium',
                'Dedicated IP opsional', 'Prioritas support 1 jam', 'Migrasi data gratis',
                'Akses API Application',
            ],
            'is_featured' => false,
            'stock' => 6,
            'is_active' => true,
            'sort_order' => 3,
        ]));
    }
}

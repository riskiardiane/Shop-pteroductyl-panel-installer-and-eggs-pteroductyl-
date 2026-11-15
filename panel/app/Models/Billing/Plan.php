<?php

namespace Pterodactyl\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $slug
 * @property string $name
 * @property string|null $tagline
 * @property int $price_monthly
 * @property int $yearly_discount
 * @property int $cpu
 * @property int $memory
 * @property int $disk
 * @property int $swap
 * @property int $io
 * @property string|null $bandwidth_label
 * @property int|null $nest_id
 * @property int|null $egg_id
 * @property int|null $node_id
 * @property int|null $allocation_id
 * @property string|null $docker_image
 * @property string|null $startup
 * @property array|null $environment
 * @property int $server_limit
 * @property int $backup_limit
 * @property int $database_limit
 * @property int $allocation_limit
 * @property array|null $features
 * @property bool $is_featured
 * @property string|null $ribbon
 * @property int|null $stock
 * @property bool $is_active
 * @property int $sort_order
 */
class Plan extends Model
{
    protected $table = 'plans';

    protected $fillable = [
        'slug', 'name', 'tagline', 'price_monthly', 'yearly_discount',
        'cpu', 'memory', 'disk', 'swap', 'io', 'bandwidth_label',
        'nest_id', 'egg_id', 'node_id', 'allocation_id', 'docker_image', 'startup', 'environment',
        'server_limit', 'backup_limit', 'database_limit', 'allocation_limit',
        'features', 'is_featured', 'ribbon', 'stock', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'price_monthly' => 'integer',
        'yearly_discount' => 'integer',
        'cpu' => 'integer',
        'memory' => 'integer',
        'disk' => 'integer',
        'swap' => 'integer',
        'io' => 'integer',
        'server_limit' => 'integer',
        'backup_limit' => 'integer',
        'database_limit' => 'integer',
        'allocation_limit' => 'integer',
        'environment' => 'array',
        'features' => 'array',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'stock' => 'integer',
        'sort_order' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function monthsFor(string $cycle): int
    {
        return match ($cycle) {
            'quarterly' => 3,
            'yearly' => 12,
            default => 1,
        };
    }

    /**
     * Total harga untuk siklus tertentu (Rupiah, integer).
     * Konsisten dengan `resources/scripts/config/plans.ts`.
     */
    public function priceFor(string $cycle): int
    {
        return match ($cycle) {
            'quarterly' => (int) round($this->price_monthly * 3 * 0.95),
            'yearly' => (int) round($this->price_monthly * 12 * (1 - ($this->yearly_discount / 100))),
            default => $this->price_monthly,
        };
    }

    public function isAvailable(): bool
    {
        return $this->is_active && ($this->stock === null || $this->stock > 0);
    }

    public function isProvisionable(): bool
    {
        return $this->nest_id && $this->egg_id && $this->node_id && $this->docker_image && $this->startup;
    }
}

<?php

namespace Pterodactyl\Models\Billing;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Pterodactyl\Models\User;

/**
 * @property int $id
 * @property int $user_id
 * @property int $plan_id
 * @property int|null $order_id
 * @property int|null $pterodactyl_server_id
 * @property string|null $server_uuid
 * @property string|null $server_identifier
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $starts_at
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property bool $auto_renew
 * @property array|null $meta
 * @property Plan $plan
 */
class Subscription extends Model
{
    public const STATUS_PROVISIONING = 'provisioning';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_FAILED = 'failed';

    protected $table = 'subscriptions';

    protected $fillable = [
        'user_id', 'plan_id', 'order_id', 'pterodactyl_server_id', 'server_uuid', 'server_identifier',
        'status', 'starts_at', 'expires_at', 'auto_renew', 'meta',
    ];

    protected $casts = [
        'pterodactyl_server_id' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'auto_renew' => 'boolean',
        'meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeBillable(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_PROVISIONING,
            self::STATUS_ACTIVE,
            self::STATUS_SUSPENDED,
        ]);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}

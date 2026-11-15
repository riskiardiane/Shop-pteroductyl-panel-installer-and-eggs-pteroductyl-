<?php

namespace Pterodactyl\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Pterodactyl\Models\User;

/**
 * @property int $id
 * @property string $uuid
 * @property int $user_id
 * @property int $plan_id
 * @property string $cycle
 * @property int $amount
 * @property string $status
 * @property string $payment_provider
 * @property string|null $provider_ref
 * @property string|null $qr_url
 * @property string|null $qr_string
 * @property array|null $meta
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property Plan $plan
 * @property Invoice $invoice
 */
class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'uuid', 'user_id', 'plan_id', 'cycle', 'amount', 'status', 'payment_provider',
        'provider_ref', 'qr_url', 'qr_string', 'meta', 'expires_at', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'meta' => 'array',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function cycleMonths(): int
    {
        return match ($this->cycle) {
            'quarterly' => 3,
            'yearly' => 12,
            default => 1,
        };
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}

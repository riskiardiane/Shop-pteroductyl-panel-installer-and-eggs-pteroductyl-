<?php

namespace Pterodactyl\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Pterodactyl\Models\User;

/**
 * @property int $id
 * @property string $number
 * @property int $order_id
 * @property int $user_id
 * @property int $subtotal
 * @property int $discount
 * @property int $total
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $due_at
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property array|null $meta
 * @property Order $order
 */
class Invoice extends Model
{
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PAID = 'paid';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_REFUNDED = 'refunded';

    protected $table = 'invoices';

    protected $fillable = [
        'number', 'order_id', 'user_id', 'subtotal', 'discount', 'total',
        'status', 'due_at', 'paid_at', 'meta',
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'discount' => 'integer',
        'total' => 'integer',
        'due_at' => 'datetime',
        'paid_at' => 'datetime',
        'meta' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markPaid(): bool
    {
        if ($this->status === self::STATUS_PAID) {
            return false;
        }

        return $this->forceFill([
            'status' => self::STATUS_PAID,
            'paid_at' => $this->freshTimestamp(),
        ])->save();
    }
}

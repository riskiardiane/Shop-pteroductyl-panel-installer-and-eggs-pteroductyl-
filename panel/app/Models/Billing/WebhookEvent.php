<?php

namespace Pterodactyl\Models\Billing;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $provider
 * @property string $event_id
 * @property string|null $event_type
 * @property array $payload
 * @property string|null $error
 * @property \Illuminate\Support\Carbon|null $processed_at
 */
class WebhookEvent extends Model
{
    protected $table = 'webhook_events';

    protected $fillable = [
        'provider', 'event_id', 'event_type', 'payload', 'error', 'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];

    public function isProcessed(): bool
    {
        return $this->processed_at !== null;
    }
}

<?php

namespace Pterodactyl\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $subscription_id
 * @property int|null $server_id
 * @property string|null $server_uuid
 * @property string|null $server_identifier
 * @property string $name
 * @property string $status
 * @property array|null $meta
 */
class SubscriptionServer extends Model
{
    public const STATUS_PROVISIONING = 'provisioning';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_FAILED = 'failed';

    protected $table = 'subscription_servers';

    protected $fillable = [
        'subscription_id', 'server_id', 'server_uuid', 'server_identifier',
        'name', 'status', 'meta',
    ];

    protected $casts = [
        'server_id' => 'integer',
        'meta' => 'array',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Jumlah slot yang sedang dipakai satu subscription.
     * Termasuk baris checkout lama (server tersimpan di kolom legacy
     * `subscriptions.pterodactyl_server_id`) agar tidak double-count.
     */
    public static function slotsUsed(Subscription $subscription): int
    {
        $used = static::query()
            ->where('subscription_id', $subscription->id)
            ->whereIn('status', [static::STATUS_PROVISIONING, static::STATUS_ACTIVE, static::STATUS_SUSPENDED])
            // server_id = NULL -> placeholder provisioning (masih menghitung slot)
            // server_id != NULL -> hanya hitung bila server masih ada di tabel servers
            ->where(function ($query) {
                $query->whereNull('server_id')
                    ->orWhereExists(function ($exists) {
                        $exists->selectRaw('1')
                            ->from('servers')
                            ->whereColumn('servers.id', 'subscription_servers.server_id');
                    });
            })
            ->count();

        if ($subscription->pterodactyl_server_id !== null
            && ! static::query()->where('subscription_id', $subscription->id)
                ->where('server_id', $subscription->pterodactyl_server_id)
                ->exists()) {
            $used += 1;
        }

        return $used;
    }

    /**
     * Id server Pterodactyl milik subscription (baru + legacy).
     *
     * @return int[]
     */
    public static function serverIds(Subscription $subscription): array
    {
        $ids = static::query()
            ->where('subscription_id', $subscription->id)
            ->whereNotNull('server_id')
            ->whereExists(function ($exists) {
                $exists->selectRaw('1')
                    ->from('servers')
                    ->whereColumn('servers.id', 'subscription_servers.server_id');
            })
            ->pluck('server_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($subscription->pterodactyl_server_id !== null && ! in_array((int) $subscription->pterodactyl_server_id, $ids, true)) {
            $ids[] = (int) $subscription->pterodactyl_server_id;
        }

        return $ids;
    }
}

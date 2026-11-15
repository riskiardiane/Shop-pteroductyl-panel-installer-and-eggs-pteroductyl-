<?php

namespace Pterodactyl\Http\Controllers\Billing;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Pterodactyl\Models\Billing\Subscription;
use Pterodactyl\Models\Billing\SubscriptionServer;
use Pterodactyl\Services\Billing\ServerProvisioner;
use Throwable;

/**
 * Self-service: pelanggan membuat server dari benefit langganannya.
 */
class CreateServerController extends Controller
{
    public function store(Request $request, ServerProvisioner $provisioner): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:64', 'regex:/^[A-Za-z0-9][A-Za-z0-9 ._-]{1,63}$/'],
            'subscription_id' => ['nullable', 'integer'],
        ], [
            'name.regex' => 'Nama server hanya boleh huruf, angka, spasi, titik, strip, dan underscore.',
            'name.min' => 'Nama server minimal 3 karakter.',
        ]);

        $query = Subscription::query()
            ->where('user_id', $request->user()->id)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->with('plan')
            ->latest('id');

        if (! empty($data['subscription_id'])) {
            $query->whereKey($data['subscription_id']);
        }

        /** @var Subscription|null $subscription */
        $subscription = null;

        foreach ($query->get() as $candidate) {
            $plan = $candidate->plan;
            $used = SubscriptionServer::slotsUsed($candidate);

            if ($plan !== null && ! $candidate->isExpired() && $used < (int) $plan->server_limit) {
                $subscription = $candidate;
                break;
            }
        }

        if ($subscription === null) {
            return response()->json([
                'message' => 'Tidak ada langganan aktif dengan slot server tersisa. Periksa halaman langganan atau upgrade paket.',
            ], 422);
        }

        try {
            $server = $provisioner->provision($subscription, trim($data['name']));
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'ok' => true,
            'message' => 'Server berhasil dibuat dan sedang diinstal.',
            'server' => [
                'id' => $server->server_id,
                'name' => $server->name,
                'identifier' => $server->server_identifier,
                'uuid' => $server->server_uuid,
                'status' => $server->status,
            ],
        ], 201);
    }
}

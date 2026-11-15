<?php

namespace Pterodactyl\Services\Billing;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Wrapper tipis untuk Pterodactyl Application API.
 * Dipakai oleh ProvisionServerJob dan command billing:expire.
 */
class PterodactylApplicationApi
{
    private string $baseUrl;
    private string $token;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('billing.pterodactyl.url'), '/');
        $this->token = (string) config('billing.pterodactyl.token');
        $this->timeout = (int) config('billing.pterodactyl.timeout', 30);
    }

    private function client(): PendingRequest
    {
        if ($this->token === '') {
            throw new RuntimeException('PTERODACTYL_APP_API_KEY belum diatur pada .env.');
        }

        return Http::withToken($this->token)
            ->acceptJson()
            ->asJson()
            ->timeout($this->timeout);
    }

    private function endpoint(string $path): string
    {
        return $this->baseUrl . '/api/application' . $path;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findUserByEmail(string $email): ?array
    {
        $response = $this->client()->get($this->endpoint('/users'), [
            'filter' => ['email' => $email],
            'per_page' => 1,
        ])->throw()->json();

        $first = Arr::get($response, 'data.0.attributes');

        return is_array($first) ? $first : null;
    }

    /**
     * @return array<string, mixed> attributes user
     */
    public function createUser(string $email, string $nameFirst, string $nameLast, ?string $username = null): array
    {
        $base = $username ?: preg_replace('/[^a-z0-9]/', '', strtolower(strstr($email, '@', true) ?: 'user')) ?: 'user';
        $base = Str::limit($base, 24, '');

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $candidate = $attempt === 0 ? $base : $base . random_int(100, 999);

            try {
                $response = $this->client()->post($this->endpoint('/users'), [
                    'email' => $email,
                    'username' => $candidate,
                    'name_first' => Str::limit($nameFirst, 60, ''),
                    'name_last' => Str::limit($nameLast, 60, ''),
                    'password' => Str::password(20),
                ])->throw()->json();

                return $this->attributes($response);
            } catch (\Illuminate\Http\Client\RequestException $exception) {
                // Username/email bentrok -> coba ulang dengan suffix, kecuali
                // email sudah ada (berarti user harus ditemukan, bukan dibuat).
                if ($exception->response?->status() === 422 && $attempt < 2) {
                    continue;
                }

                throw $exception;
            }
        }

        throw new RuntimeException('Gagal membuat user panel: username tidak unik.');
    }

    public function firstFreeAllocation(int $nodeId): ?int
    {
        for ($page = 1; $page <= 5; $page++) {
            $response = $this->client()->get($this->endpoint("/nodes/{$nodeId}/allocations"), [
                'page' => $page,
                'per_page' => 100,
            ])->throw()->json();

            foreach ((array) Arr::get($response, 'data', []) as $allocation) {
                $attributes = Arr::get($allocation, 'attributes', []);

                if (($attributes['assigned'] ?? true) === false) {
                    return (int) $attributes['id'];
                }
            }

            $lastPage = (int) Arr::get($response, 'meta.pagination.total_pages', $page);

            if ($page >= $lastPage) {
                break;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed> attributes server
     */
    public function createServer(array $payload): array
    {
        $response = $this->client()
            ->post($this->endpoint('/servers'), $payload)
            ->throw()
            ->json();

        return $this->attributes($response);
    }

    public function suspendServer(int $serverId): void
    {
        $this->client()->post($this->endpoint("/servers/{$serverId}/suspend"))->throw();
    }

    public function unsuspendServer(int $serverId): void
    {
        $this->client()->post($this->endpoint("/servers/{$serverId}/unsuspend"))->throw();
    }

    public function deleteServer(int $serverId): void
    {
        $this->client()->delete($this->endpoint("/servers/{$serverId}"))->throw();
    }

    /**
     * @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private function attributes(array $response): array
    {
        $attributes = Arr::get($response, 'attributes') ?? Arr::get($response, 'data.attributes') ?? $response;

        if (! is_array($attributes) || ! isset($attributes['id'])) {
            throw new RuntimeException('Respons Application API tidak berisi data yang diharapkan.');
        }

        return $attributes;
    }
}

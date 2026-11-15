<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Server yang dibuat pelanggan dari benefit langganan (self-service).
 * Satu subscription bisa punya banyak server selama slot `plans.server_limit` mencukupi.
 *
 * Kolom `server_id` adalah id server di tabel `servers` (legacy: sebagian client code
 * memakai `subscriptions.pterodactyl_server_id` untuk server pertama).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->unsignedInteger('server_id')->nullable();
            $table->string('server_uuid', 64)->nullable();
            $table->string('server_identifier', 64)->nullable();
            $table->string('name', 191);
            $table->string('status', 32)->default('provisioning'); // provisioning|active|suspended|failed
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['subscription_id', 'status']);
            $table->unique(['subscription_id', 'server_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_servers');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('tagline')->nullable();
            $table->unsignedInteger('price_monthly')->default(0);
            $table->unsignedTinyInteger('yearly_discount')->default(0);

            // Resource (cpu dalam persen, memory/disk dalam MiB)
            $table->unsignedInteger('cpu')->default(100);
            $table->unsignedInteger('memory')->default(1024);
            $table->unsignedInteger('disk')->default(5120);
            $table->unsignedInteger('swap')->default(0);
            $table->unsignedInteger('io')->default(500);
            $table->string('bandwidth_label')->nullable();

            // Target provisioning
            $table->unsignedInteger('nest_id')->nullable();
            $table->unsignedInteger('egg_id')->nullable();
            $table->unsignedInteger('node_id')->nullable();
            $table->unsignedInteger('allocation_id')->nullable();
            $table->string('docker_image')->nullable();
            $table->text('startup')->nullable();
            $table->json('environment')->nullable();

            // Batas fitur
            $table->unsignedInteger('server_limit')->default(1);
            $table->unsignedInteger('backup_limit')->default(3);
            $table->unsignedInteger('database_limit')->default(1);
            $table->unsignedInteger('allocation_limit')->default(1);

            // Presentasi
            $table->json('features')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('ribbon')->nullable();
            $table->unsignedInteger('stock')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            // Tanpa FK ke `users`: Pterodactyl historis memakai INT UNSIGNED,
            // sedangkan `foreignId()` menghasilkan BIGINT UNSIGNED.
            $table->unsignedBigInteger('user_id')->index();
            $table->foreignId('plan_id')->constrained('plans');
            $table->enum('cycle', ['monthly', 'quarterly', 'yearly'])->default('monthly');
            $table->unsignedInteger('amount');
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'expired'])->default('pending');
            $table->string('payment_provider')->default('mustika');
            $table->string('provider_ref', 191)->nullable()->unique();
            $table->text('qr_url')->nullable();
            $table->text('qr_string')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('total');
            $table->enum('status', ['unpaid', 'paid', 'expired', 'refunded'])->default('unpaid');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->foreignId('plan_id')->constrained('plans');
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->unsignedInteger('pterodactyl_server_id')->nullable()->index();
            $table->string('server_uuid', 64)->nullable()->index();
            $table->string('server_identifier', 64)->nullable();
            $table->enum('status', ['provisioning', 'active', 'suspended', 'expired', 'cancelled', 'failed'])
                ->default('provisioning');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->boolean('auto_renew')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32)->default('mustika');
            $table->string('event_id', 191);
            $table->string('event_type', 64)->nullable();
            $table->json('payload');
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('plans');
    }
};

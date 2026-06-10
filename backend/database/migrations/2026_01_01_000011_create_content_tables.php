<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('created_by')->constrained('users');
            $table->string('type'); // training, reading, process
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('link_url')->nullable();
            $table->string('file_url')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['created_by']);
            $table->index(['type']);
        });

        Schema::create('content_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('item_id')->constrained('content_items')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users');
            $table->string('status')->default('not_seen'); // not_seen, seen, in_progress, completed
            $table->timestamp('seen_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['item_id', 'user_id']);
            $table->index(['item_id']);
            $table->index(['user_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_assignments');
        Schema::dropIfExists('content_items');
    }
};

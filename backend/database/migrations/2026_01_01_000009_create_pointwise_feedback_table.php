<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pointwise_feedback', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('to_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // kudos, adjustment, observation
            $table->text('content');
            $table->string('visibility')->default('with_manager'); // private, with_manager
            $table->timestamp('created_at')->useCurrent();

            $table->index(['from_user_id']);
            $table->index(['to_user_id']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pointwise_feedback');
    }
};

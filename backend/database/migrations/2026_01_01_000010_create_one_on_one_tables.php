<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('one_on_ones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('manager_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('report_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('scheduled_at');
            $table->string('recurrence_rule')->nullable(); // weekly, biweekly, monthly
            $table->string('status')->default('scheduled'); // scheduled, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['manager_id']);
            $table->index(['report_id']);
            $table->index(['scheduled_at']);
        });

        Schema::create('one_on_one_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('one_on_one_id')->constrained('one_on_ones')->cascadeOnDelete();
            $table->foreignUuid('author_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->boolean('addressed')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['one_on_one_id']);
        });

        Schema::create('one_on_one_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('one_on_one_id')->constrained('one_on_ones')->cascadeOnDelete();
            $table->foreignUuid('author_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->string('type')->default('observation'); // decision, action, observation
            $table->timestamp('created_at')->useCurrent();

            $table->index(['one_on_one_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('one_on_one_notes');
        Schema::dropIfExists('one_on_one_topics');
        Schema::dropIfExists('one_on_ones');
    }
};

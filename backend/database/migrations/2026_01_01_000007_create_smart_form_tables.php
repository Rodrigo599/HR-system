<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smart_forms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->json('config')->default('{}');
            $table->string('status')->default('draft'); // draft, active, archived
            $table->string('category')->default('custom'); // evaluation, onboarding, survey, feedback, custom
            $table->foreignUuid('sector_id')->nullable()->constrained('sectors')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('smart_form_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('form_id')->constrained('smart_forms')->cascadeOnDelete();
            $table->string('form_slug');
            $table->foreignUuid('user_id')->constrained('users');
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('responses')->default('{}');
            $table->string('status')->default('pending'); // pending, in_progress, completed
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['form_id']);
            $table->index(['user_id']);
            $table->index(['assigned_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smart_form_responses');
        Schema::dropIfExists('smart_forms');
    }
};

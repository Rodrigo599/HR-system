<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('created_by')->constrained('users');
            $table->foreignUuid('assigned_to')->constrained('users');
            $table->string('status')->default('pending_self'); // pending_self, pending_manager, completed, closed
            $table->string('type'); // cultural, performance, kpi
            $table->string('flow_type')->default('sequential'); // sequential, blind
            $table->tinyInteger('month');
            $table->smallInteger('year');
            $table->uuid('smart_form_id')->nullable();
            $table->timestamps();

            $table->index(['assigned_to']);
            $table->index(['created_by']);
            $table->index(['month', 'year']);
        });

        Schema::create('evaluation_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('evaluation_id')->constrained('evaluations')->cascadeOnDelete();
            $table->decimal('self_score', 5, 2)->nullable();
            $table->decimal('manager_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->timestamps();

            $table->index(['evaluation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_responses');
        Schema::dropIfExists('evaluations');
    }
};

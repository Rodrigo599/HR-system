<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('target_value', 10, 2);
            $table->string('unit')->nullable(); // percentual, numero, moeda, etc.
            $table->timestamps();
        });

        Schema::create('kpi_sectors', function (Blueprint $table) {
            $table->foreignUuid('kpi_id')->constrained('kpis')->cascadeOnDelete();
            $table->foreignUuid('sector_id')->constrained('sectors')->cascadeOnDelete();
            $table->primary(['kpi_id', 'sector_id']);
        });

        Schema::create('kpi_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('kpi_id')->constrained('kpis')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users');
            $table->decimal('score', 10, 2);
            $table->tinyInteger('month');
            $table->smallInteger('year');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['kpi_id']);
            $table->index(['user_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_results');
        Schema::dropIfExists('kpi_sectors');
        Schema::dropIfExists('kpis');
    }
};

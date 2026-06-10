<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('full_name');
            $table->string('avatar_url')->nullable();
            $table->foreignUuid('sector_id')->nullable()->constrained('sectors')->nullOnDelete();
            $table->foreignUuid('manager_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('preferred_language', 2)->default('pt');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('dependents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('name');
            $table->date('birth_date');
            $table->string('relationship');
            $table->boolean('consent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dependents');
        Schema::dropIfExists('profiles');
    }
};

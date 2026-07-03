<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Data de nascimento do próprio colaborador — usada nos alertas de
            // aniversário (PRD 3.9). Foi perdida na migração do Supabase; readicionada
            // como nullable e repopulada a partir do export legado.
            $table->date('birth_date')->nullable()->after('preferred_language');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('birth_date');
        });
    }
};

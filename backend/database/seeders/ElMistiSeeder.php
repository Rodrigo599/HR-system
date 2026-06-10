<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ElMistiSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Setores ----
        $sectors = [
            ['name' => 'Recepção',      'description' => 'Front desk e atendimento ao hóspede'],
            ['name' => 'Housekeeping',  'description' => 'Limpeza e manutenção de quartos'],
            ['name' => 'A&B',           'description' => 'Alimentos e Bebidas - restaurante, bar e cozinha'],
            ['name' => 'Admin',         'description' => 'Finanças, RH e operações'],
        ];

        $sectorIds = [];
        foreach ($sectors as $sector) {
            $id = (string) Str::uuid();
            DB::table('sectors')->insertOrIgnore([
                'id'          => $id,
                'name'        => $sector['name'],
                'description' => $sector['description'],
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            // Recupera o ID real (pode já existir)
            $sectorIds[$sector['name']] = DB::table('sectors')
                ->where('name', $sector['name'])
                ->value('id');
        }

        // ---- Tópicos de avaliação ----
        $topics = [
            ['name' => 'Trabalho em equipe',       'description' => 'Colaboração com colegas',                       'type' => 'cultural',     'sector' => null],
            ['name' => 'Comunicação',               'description' => 'Clareza e efetividade ao se comunicar',         'type' => 'cultural',     'sector' => null],
            ['name' => 'Proatividade',              'description' => 'Iniciativa e antecipação de problemas',         'type' => 'cultural',     'sector' => null],
            ['name' => 'Pontualidade',              'description' => 'Cumprimento de horários e prazos',              'type' => 'performance',  'sector' => null],
            ['name' => 'Atendimento ao hóspede',   'description' => 'Qualidade do serviço ao cliente',               'type' => 'performance',  'sector' => null],
            ['name' => 'Cumprimento de processos', 'description' => 'Aderência a procedimentos operacionais',        'type' => 'performance',  'sector' => null],
        ];

        foreach ($topics as $topic) {
            DB::table('evaluation_topics')->insertOrIgnore([
                'id'          => (string) Str::uuid(),
                'name'        => $topic['name'],
                'description' => $topic['description'],
                'type'        => $topic['type'],
                'sector_id'   => $topic['sector'] ? ($sectorIds[$topic['sector']] ?? null) : null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // ---- KPIs ----
        $kpis = [
            ['name' => 'NPS Hóspedes',      'description' => 'Net Promoter Score do hóspede',            'target_value' => 80,  'unit' => 'pts', 'sector' => null],
            ['name' => 'Ocupação',           'description' => 'Taxa de ocupação mensal',                  'target_value' => 75,  'unit' => '%',   'sector' => null],
            ['name' => 'Ticket Médio',       'description' => 'Valor médio por reserva',                  'target_value' => 150, 'unit' => 'USD', 'sector' => null],
            ['name' => 'Tempo Check-in',     'description' => 'Tempo médio de check-in',                  'target_value' => 5,   'unit' => 'min', 'sector' => null],
            ['name' => 'Reviews Positivos',  'description' => 'Porcentagem de reviews 4-5 estrelas',      'target_value' => 90,  'unit' => '%',   'sector' => null],
        ];

        foreach ($kpis as $kpi) {
            DB::table('kpis')->insertOrIgnore([
                'id'           => (string) Str::uuid(),
                'name'         => $kpi['name'],
                'description'  => $kpi['description'],
                'target_value' => $kpi['target_value'],
                'unit'         => $kpi['unit'],
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
    }
}

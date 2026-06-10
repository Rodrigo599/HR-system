<?php

namespace Tests\Feature\KPI;

use Src\KPI\Models\Kpi;
use Src\KPI\Models\KpiResult;
use Tests\TestCase;

class KpiControllerTest extends TestCase
{
    public function test_index_retorna_kpis_do_usuario(): void
    {
        $sector = $this->makeSector();
        $kpi = Kpi::factory()->create();
        $kpi->sectors()->attach($sector->id);

        $user = $this->makeUser('colaborador', $sector);

        $this->actingAs($user)
            ->getJson('/api/kpis')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_index_admin_retorna_todos_kpis(): void
    {
        Kpi::factory()->create(['name' => 'KPI A']);
        Kpi::factory()->create(['name' => 'KPI B']);

        $this->asUser('admin')
            ->getJson('/api/kpis')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_store_cria_kpi_como_admin(): void
    {
        $sector = $this->makeSector();

        $this->asUser('admin')
            ->postJson('/api/kpis', [
                'name' => 'NPS',
                'target_value' => 80,
                'unit' => 'percentual',
                'sector_ids' => [$sector->id],
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'NPS');

        $this->assertDatabaseHas('kpis', ['name' => 'NPS']);
    }

    public function test_store_proibido_para_nao_admin(): void
    {
        $this->asUser('gestor')
            ->postJson('/api/kpis', ['name' => 'NPS', 'target_value' => 80])
            ->assertForbidden();
    }

    public function test_update_altera_kpi_como_admin(): void
    {
        $kpi = Kpi::factory()->create();

        $this->asUser('admin')
            ->putJson("/api/kpis/{$kpi->id}", [
                'name' => 'NPS Atualizado',
                'target_value' => 95,
                'sector_ids' => [],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'NPS Atualizado');
    }

    public function test_destroy_remove_kpi_como_admin(): void
    {
        $kpi = Kpi::factory()->create();

        $this->asUser('admin')
            ->deleteJson("/api/kpis/{$kpi->id}")
            ->assertOk();

        $this->assertDatabaseMissing('kpis', ['id' => $kpi->id]);
    }

    public function test_index_results_retorna_resultados_do_usuario(): void
    {
        $user = $this->makeUser('colaborador');
        $kpi = Kpi::factory()->create();

        KpiResult::factory()->create([
            'kpi_id' => $kpi->id,
            'user_id' => $user->id,
            'month' => 6,
            'year' => 2026,
        ]);

        $this->actingAs($user)
            ->getJson('/api/kpi-results?month=6&year=2026')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_upsert_result_cria_resultado(): void
    {
        $user = $this->makeUser('colaborador');
        $kpi = Kpi::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/kpi-results', [
                'kpi_id' => $kpi->id,
                'score' => 92,
                'month' => 6,
                'year' => 2026,
            ])
            ->assertCreated()
            ->assertJsonPath('data.score', '92.00');
    }

    public function test_upsert_result_atualiza_resultado_existente(): void
    {
        $user = $this->makeUser('colaborador');
        $kpi = Kpi::factory()->create();

        KpiResult::factory()->create([
            'kpi_id' => $kpi->id,
            'user_id' => $user->id,
            'score' => 80,
            'month' => 6,
            'year' => 2026,
        ]);

        $this->actingAs($user)
            ->postJson('/api/kpi-results', [
                'kpi_id' => $kpi->id,
                'score' => 95,
                'month' => 6,
                'year' => 2026,
            ])
            ->assertCreated()
            ->assertJsonPath('data.score', '95.00');

        $this->assertDatabaseCount('kpi_results', 1);
    }
}

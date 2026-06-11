<?php

namespace Tests\Feature\Evaluation;

use Src\Evaluation\Models\Evaluation;
use Tests\TestCase;

class EvaluationControllerTest extends TestCase
{
    private array $evaluationShape = [
        'id', 'status', 'type', 'flow_type', 'month', 'year',
        'smart_form_id', 'created_at',
    ];

    public function test_index_retorna_avaliacoes_do_colaborador(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        Evaluation::factory()->create([
            'created_by' => $gestor->id,
            'assigned_to' => $colab->id,
        ]);

        $this->actingAs($colab)
            ->getJson('/api/evaluations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data' => [$this->evaluationShape]]);
    }

    public function test_index_filtra_por_ano(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        Evaluation::factory()->create(['created_by' => $gestor->id, 'assigned_to' => $colab->id, 'year' => 2025]);
        Evaluation::factory()->create(['created_by' => $gestor->id, 'assigned_to' => $colab->id, 'year' => 2026]);

        $this->actingAs($colab)
            ->getJson('/api/evaluations?year=2026')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_store_cria_avaliacao_como_gestor(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        $this->actingAs($gestor)
            ->postJson('/api/evaluations', [
                'assigned_to' => $colab->id,
                'type' => 'performance',
                'flow_type' => 'sequential',
                'month' => 6,
                'year' => 2026,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending_self')
            ->assertJsonPath('data.month', 6)
            ->assertJsonPath('data.year', 2026)
            ->assertJsonStructure(['data' => [
                ...$this->evaluationShape,
                'assignee' => ['id', 'name'],
                'creator'  => ['id', 'name'],
            ]]);
    }

    public function test_store_proibido_para_colaborador(): void
    {
        $colab = $this->makeUser('colaborador');
        $outro = $this->makeUser('colaborador');

        $this->actingAs($colab)
            ->postJson('/api/evaluations', [
                'assigned_to' => $outro->id,
                'type' => 'performance',
                'flow_type' => 'sequential',
                'month' => 6,
                'year' => 2026,
            ])
            ->assertForbidden();
    }

    public function test_show_retorna_avaliacao_com_responses(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        $evaluation = Evaluation::factory()->create([
            'created_by' => $gestor->id,
            'assigned_to' => $colab->id,
        ]);

        $this->actingAs($colab)
            ->getJson("/api/evaluations/{$evaluation->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $evaluation->id)
            ->assertJsonStructure(['data' => [
                ...$this->evaluationShape,
                'assignee'  => ['id', 'name'],
                'creator'   => ['id', 'name'],
                'responses',
            ]]);
    }

    public function test_show_proibido_para_terceiros(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $terceiro = $this->makeUser('colaborador');

        $evaluation = Evaluation::factory()->create([
            'created_by' => $gestor->id,
            'assigned_to' => $colab->id,
        ]);

        $this->actingAs($terceiro)
            ->getJson("/api/evaluations/{$evaluation->id}")
            ->assertForbidden();
    }

    public function test_submit_self_avanca_status_para_pending_manager(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        $evaluation = Evaluation::factory()->create([
            'created_by' => $gestor->id,
            'assigned_to' => $colab->id,
            'status' => 'pending_self',
        ]);

        $this->actingAs($colab)
            ->putJson("/api/evaluations/{$evaluation->id}/submit-self", [
                'scores' => [['score' => 8]],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_manager')
            ->assertJsonStructure(['data' => $this->evaluationShape]);
    }

    public function test_submit_manager_completa_avaliacao(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        $evaluation = Evaluation::factory()->pendingManager()->create([
            'created_by' => $gestor->id,
            'assigned_to' => $colab->id,
        ]);

        $this->actingAs($gestor)
            ->putJson("/api/evaluations/{$evaluation->id}/submit-manager", [
                'scores' => [['score' => 9]],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonStructure(['data' => $this->evaluationShape]);
    }
}

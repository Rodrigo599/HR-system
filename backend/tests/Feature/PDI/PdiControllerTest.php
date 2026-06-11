<?php

namespace Tests\Feature\PDI;

use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;
use Tests\TestCase;

class PdiControllerTest extends TestCase
{
    private array $pdiShape = ['id', 'user_id', 'title', 'description', 'end_date', 'created_at', 'tasks'];

    private array $taskShape = [
        'id', 'pdi_id', 'title', 'description', 'link',
        'completed', 'due_date', 'status', 'review_notes', 'reviewed_at',
    ];

    // ─── index ────────────────────────────────────────────────────────────────

    public function test_index_retorna_pdis_do_colaborador(): void
    {
        $user = $this->makeUser('colaborador');
        Pdi::factory()->count(2)->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/api/pdis')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data' => [$this->pdiShape]]);
    }

    public function test_index_nao_retorna_pdis_de_outros_usuarios(): void
    {
        $userA = $this->makeUser('colaborador');
        $userB = $this->makeUser('colaborador');
        Pdi::factory()->create(['user_id' => $userB->id]);

        $this->actingAs($userA)
            ->getJson('/api/pdis')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    /** Bug corrigido: admin/gestor não via seus próprios PDIs (forTeam não incluía o próprio user). */
    public function test_index_admin_ve_seus_proprios_pdis(): void
    {
        $admin = $this->makeUser('admin');
        Pdi::factory()->count(3)->create(['user_id' => $admin->id]);

        $this->actingAs($admin)
            ->getJson('/api/pdis')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_index_gestor_ve_seus_proprios_pdis(): void
    {
        $gestor = $this->makeUser('gestor');
        Pdi::factory()->count(2)->create(['user_id' => $gestor->id]);

        $this->actingAs($gestor)
            ->getJson('/api/pdis')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    // ─── store ────────────────────────────────────────────────────────────────

    public function test_store_cria_pdi_e_retorna_tasks_vazia(): void
    {
        $user = $this->makeUser('colaborador');

        $this->actingAs($user)
            ->postJson('/api/pdis', [
                'title' => 'Meu PDI',
                'description' => 'Descrição',
                'end_date' => '2026-12-31',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Meu PDI')
            ->assertJsonPath('data.end_date', '2026-12-31')
            ->assertJsonPath('data.tasks', [])
            ->assertJsonStructure(['data' => $this->pdiShape]);

        $this->assertDatabaseHas('pdis', [
            'user_id' => $user->id,
            'title' => 'Meu PDI',
        ]);
    }

    public function test_store_sem_title_retorna_422(): void
    {
        $user = $this->makeUser('colaborador');

        $this->actingAs($user)
            ->postJson('/api/pdis', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_sem_end_date_cria_pdi_com_end_date_null(): void
    {
        $user = $this->makeUser('colaborador');

        $this->actingAs($user)
            ->postJson('/api/pdis', ['title' => 'PDI Sem Prazo'])
            ->assertCreated()
            ->assertJsonPath('data.end_date', null);
    }

    // ─── storeTask ────────────────────────────────────────────────────────────

    public function test_store_task_cria_tarefa_com_status_pending(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/pdis/{$pdi->id}/tasks", [
                'title' => 'Ler livro DDD',
                'due_date' => '2026-09-01',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.completed', false)
            ->assertJsonPath('data.due_date', '2026-09-01')
            ->assertJsonStructure(['data' => $this->taskShape]);
    }

    public function test_store_task_sem_title_retorna_422(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/pdis/{$pdi->id}/tasks", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_task_em_pdi_de_outro_usuario_retorna_403(): void
    {
        $owner = $this->makeUser('colaborador');
        $other = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)
            ->postJson("/api/pdis/{$pdi->id}/tasks", ['title' => 'Intruso'])
            ->assertForbidden();
    }

    // ─── submitTask ───────────────────────────────────────────────────────────

    public function test_submit_task_muda_status_para_submitted(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'pending']);

        $this->actingAs($user)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonStructure(['data' => $this->taskShape]);
    }

    public function test_submit_task_ja_submitted_retorna_422(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'submitted']);

        $this->actingAs($user)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/submit")
            ->assertUnprocessable();
    }

    public function test_submit_task_de_outro_usuario_retorna_403(): void
    {
        $owner = $this->makeUser('colaborador');
        $other = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $owner->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'pending']);

        $this->actingAs($other)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/submit")
            ->assertForbidden();
    }

    // ─── reviewTask ───────────────────────────────────────────────────────────

    public function test_review_aprova_tarefa_e_marca_completed(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'submitted']);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", [
                'status' => 'approved',
                'review_notes' => 'Muito bom!',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.completed', true)
            ->assertJsonPath('data.review_notes', 'Muito bom!')
            ->assertJsonStructure(['data' => $this->taskShape]);
    }

    public function test_review_rejeita_tarefa(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'submitted']);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", [
                'status' => 'rejected',
                'review_notes' => 'Precisa melhorar.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.completed', false)
            ->assertJsonStructure(['data' => $this->taskShape]);
    }

    public function test_review_sem_status_retorna_422(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'submitted']);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_review_com_status_invalido_retorna_422(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'submitted']);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", ['status' => 'invalido'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_review_em_tarefa_nao_submitted_retorna_422(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'approved']);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", ['status' => 'approved'])
            ->assertUnprocessable();
    }

    public function test_colaborador_nao_pode_revisar_tarefa(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'submitted']);

        $this->actingAs($colab)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", ['status' => 'approved'])
            ->assertForbidden();
    }
}

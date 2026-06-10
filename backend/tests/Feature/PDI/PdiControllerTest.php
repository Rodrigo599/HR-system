<?php

namespace Tests\Feature\PDI;

use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;
use Tests\TestCase;

class PdiControllerTest extends TestCase
{
    public function test_index_retorna_pdis_do_colaborador(): void
    {
        $user = $this->makeUser('colaborador');
        Pdi::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/api/pdis')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_index_gestor_retorna_pdis_do_time(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        Pdi::factory()->create(['user_id' => $colab->id]);

        $this->actingAs($gestor)
            ->getJson('/api/pdis')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_store_cria_pdi_para_o_usuario(): void
    {
        $user = $this->makeUser('colaborador');

        $this->actingAs($user)
            ->postJson('/api/pdis', [
                'title' => 'Meu PDI',
                'description' => 'Descrição do plano',
                'start_date' => '2026-01-01',
                'end_date' => '2026-12-31',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Meu PDI');

        $this->assertDatabaseHas('pdis', ['user_id' => $user->id, 'title' => 'Meu PDI']);
    }

    public function test_tasks_retorna_tarefas_do_pdi(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);
        PdiTask::factory()->count(2)->create(['pdi_id' => $pdi->id]);

        $this->actingAs($user)
            ->getJson("/api/pdis/{$pdi->id}/tasks")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_store_task_cria_tarefa_no_pdi(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/pdis/{$pdi->id}/tasks", [
                'title' => 'Ler livro de DDD',
                'due_date' => '2026-07-01',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_submit_task_muda_status_para_submitted(): void
    {
        $user = $this->makeUser('colaborador');
        $pdi = Pdi::factory()->create(['user_id' => $user->id]);
        $task = PdiTask::factory()->create(['pdi_id' => $pdi->id, 'status' => 'pending']);

        $this->actingAs($user)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted');
    }

    public function test_review_task_aprova_tarefa_pelo_gestor(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);

        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->submitted()->create(['pdi_id' => $pdi->id]);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", [
                'decision' => 'approved',
                'comment' => 'Muito bom!',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_review_task_rejeita_tarefa_pelo_gestor(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);

        $pdi = Pdi::factory()->create(['user_id' => $colab->id]);
        $task = PdiTask::factory()->submitted()->create(['pdi_id' => $pdi->id]);

        $this->actingAs($gestor)
            ->putJson("/api/pdis/{$pdi->id}/tasks/{$task->id}/review", [
                'decision' => 'rejected',
                'comment' => 'Precisa melhorar.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');
    }
}

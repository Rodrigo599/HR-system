<?php

namespace Tests\Feature\OneOnOne;

use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Models\OneOnOneTopic;
use Tests\TestCase;

class OneOnOneControllerTest extends TestCase
{
    public function test_index_retorna_reunioes_do_participante(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $this->actingAs($colab)
            ->getJson('/api/one-on-ones')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_index_nao_retorna_reunioes_de_terceiros(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $terceiro = $this->makeUser('colaborador');
        OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $this->actingAs($terceiro)
            ->getJson('/api/one-on-ones')
            ->assertOk()
            ->assertJsonCount(0);
    }

    public function test_store_cria_reuniao_como_gestor(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        $this->actingAs($gestor)
            ->postJson('/api/one-on-ones', [
                'report_id' => $colab->id,
                'scheduled_at' => now()->addDays(7)->toDateTimeString(),
            ])
            ->assertOk()
            ->assertJsonPath('manager_id', $gestor->id);
    }

    public function test_store_proibido_para_colaborador(): void
    {
        $colab1 = $this->makeUser('colaborador');
        $colab2 = $this->makeUser('colaborador');

        $this->actingAs($colab1)
            ->postJson('/api/one-on-ones', [
                'report_id' => $colab2->id,
                'scheduled_at' => now()->addDays(7)->toDateTimeString(),
            ])
            ->assertForbidden();
    }

    public function test_show_retorna_reuniao_com_relacionamentos(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $meeting = OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $this->actingAs($gestor)
            ->getJson("/api/one-on-ones/{$meeting->id}")
            ->assertOk()
            ->assertJsonStructure(['id', 'manager', 'report', 'topics', 'notes_list']);
    }

    public function test_update_altera_status_da_reuniao(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $meeting = OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $this->actingAs($gestor)
            ->putJson("/api/one-on-ones/{$meeting->id}", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('status', 'completed');
    }

    public function test_store_topic_adiciona_pauta(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $meeting = OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $this->actingAs($colab)
            ->postJson("/api/one-on-ones/{$meeting->id}/topics", [
                'content' => 'Discutir metas do trimestre',
            ])
            ->assertCreated()
            ->assertJsonPath('addressed', false);
    }

    public function test_update_topic_marca_pauta_como_tratada(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $meeting = OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $topic = OneOnOneTopic::factory()->create([
            'one_on_one_id' => $meeting->id,
            'author_user_id' => $colab->id,
            'content' => 'Meta do trimestre',
        ]);

        $this->actingAs($gestor)
            ->putJson("/api/one-on-ones/{$meeting->id}/topics/{$topic->id}", [
                'addressed' => true,
            ])
            ->assertOk()
            ->assertJsonPath('addressed', true);
    }

    public function test_store_note_adiciona_nota(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $meeting = OneOnOne::factory()->create(['manager_id' => $gestor->id, 'report_id' => $colab->id]);

        $this->actingAs($gestor)
            ->postJson("/api/one-on-ones/{$meeting->id}/notes", [
                'content' => 'Decisão: aumentar frequência das entregas',
                'type' => 'decision',
            ])
            ->assertCreated()
            ->assertJsonPath('type', 'decision');
    }
}

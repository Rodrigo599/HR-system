<?php

namespace Tests\Feature\Content;

use Src\Content\Models\ContentAssignment;
use Src\Content\Models\ContentItem;
use Tests\TestCase;

class ContentControllerTest extends TestCase
{
    public function test_index_colaborador_retorna_suas_atribuicoes(): void
    {
        $colab = $this->makeUser('colaborador');
        $item = ContentItem::factory()->create();
        ContentAssignment::factory()->create(['item_id' => $item->id, 'user_id' => $colab->id]);

        $this->actingAs($colab)
            ->getJson('/api/content')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_index_gestor_retorna_todos_itens_do_time(): void
    {
        $gestor = $this->makeUser('gestor');
        ContentItem::factory()->count(2)->create(['created_by' => $gestor->id]);

        $this->actingAs($gestor)
            ->getJson('/api/content')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_store_cria_conteudo_como_gestor(): void
    {
        $gestor = $this->makeUser('gestor');

        $this->actingAs($gestor)
            ->postJson('/api/content', [
                'type' => 'training',
                'title' => 'Curso de DDD',
                'description' => 'Aprenda Domain-Driven Design.',
                'link_url' => 'https://example.com/ddd',
                'due_date' => now()->addDays(30)->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Curso de DDD');
    }

    public function test_store_proibido_para_colaborador(): void
    {
        $this->asUser('colaborador')
            ->postJson('/api/content', [
                'type' => 'training',
                'title' => 'Curso',
                'due_date' => now()->addDays(30)->toDateString(),
            ])
            ->assertForbidden();
    }

    public function test_assign_atribui_conteudo_a_usuarios(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');
        $item = ContentItem::factory()->create(['created_by' => $gestor->id]);

        $this->actingAs($gestor)
            ->postJson("/api/content/{$item->id}/assign", [
                'user_ids' => [$colab->id],
            ])
            ->assertOk();

        $this->assertDatabaseHas('content_assignments', [
            'item_id' => $item->id,
            'user_id' => $colab->id,
        ]);
    }

    public function test_update_progress_atualiza_status_da_atribuicao(): void
    {
        $colab = $this->makeUser('colaborador');
        $item = ContentItem::factory()->create();
        $assignment = ContentAssignment::factory()->create([
            'item_id' => $item->id,
            'user_id' => $colab->id,
        ]);

        $this->actingAs($colab)
            ->putJson("/api/content/assignments/{$assignment->id}/progress", [
                'status' => 'in_progress',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');
    }

    public function test_progress_retorna_andamento_do_conteudo(): void
    {
        $gestor = $this->makeUser('gestor');
        $colab1 = $this->makeUser('colaborador');
        $colab2 = $this->makeUser('colaborador');
        $item = ContentItem::factory()->create(['created_by' => $gestor->id]);

        ContentAssignment::factory()->create(['item_id' => $item->id, 'user_id' => $colab1->id]);
        ContentAssignment::factory()->completed()->create(['item_id' => $item->id, 'user_id' => $colab2->id]);

        $this->actingAs($gestor)
            ->getJson("/api/content/{$item->id}/progress")
            ->assertOk()
            ->assertJsonStructure(['total', 'completed', 'in_progress', 'not_seen']);
    }
}

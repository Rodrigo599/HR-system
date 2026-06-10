<?php

namespace Tests\Feature\SmartForm;

use Src\SmartForm\Models\SmartForm;
use Tests\TestCase;

class SmartFormControllerTest extends TestCase
{
    public function test_index_retorna_forms_ativos(): void
    {
        SmartForm::factory()->create();
        SmartForm::factory()->draft()->create();

        $this->asUser()
            ->getJson('/api/smart-forms')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_index_filtra_por_categoria(): void
    {
        SmartForm::factory()->create(['category' => 'evaluation']);
        SmartForm::factory()->survey()->create();

        $this->asUser()
            ->getJson('/api/smart-forms?category=survey')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_store_cria_form_como_gestor(): void
    {
        $this->asUser('gestor')
            ->postJson('/api/smart-forms', [
                'name' => 'Avaliação Cultural',
                'slug' => 'avaliacao-cultural',
                'config' => ['steps' => [['title' => 'Passo 1', 'fields' => []]]],
                'category' => 'evaluation',
            ])
            ->assertOk()
            ->assertJsonPath('slug', 'avaliacao-cultural');
    }

    public function test_store_proibido_para_colaborador(): void
    {
        $this->asUser('colaborador')
            ->postJson('/api/smart-forms', [
                'name' => 'Form',
                'slug' => 'form-x',
                'config' => ['steps' => [['title' => 'Passo', 'fields' => []]]],
                'category' => 'evaluation',
            ])
            ->assertForbidden();
    }

    public function test_show_retorna_form_existente(): void
    {
        $form = SmartForm::factory()->create();

        $this->asUser()
            ->getJson("/api/smart-forms/{$form->id}")
            ->assertOk()
            ->assertJsonPath('id', $form->id);
    }

    public function test_update_altera_form_como_admin(): void
    {
        $form = SmartForm::factory()->create();

        $this->asUser('admin')
            ->putJson("/api/smart-forms/{$form->id}", [
                'name' => 'Nome Novo',
                'slug' => $form->slug,
                'config' => $form->config,
                'category' => $form->category->value,
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Nome Novo');
    }

    public function test_destroy_remove_form_como_admin(): void
    {
        $form = SmartForm::factory()->create();

        $this->asUser('admin')
            ->deleteJson("/api/smart-forms/{$form->id}")
            ->assertOk();

        $this->assertDatabaseMissing('smart_forms', ['id' => $form->id]);
    }

    public function test_store_response_registra_resposta(): void
    {
        $form = SmartForm::factory()->create();
        $user = $this->makeUser('colaborador');

        $this->actingAs($user)
            ->postJson("/api/smart-forms/{$form->id}/responses", [
                'responses' => ['q1' => 8, 'q2' => 9],
            ])
            ->assertOk()
            ->assertJsonPath('status', 'completed');
    }

    public function test_index_responses_proibido_para_colaborador(): void
    {
        $form = SmartForm::factory()->create();

        $this->asUser('colaborador')
            ->getJson("/api/smart-forms/{$form->id}/responses")
            ->assertForbidden();
    }

    public function test_index_responses_retorna_lista_para_gestor(): void
    {
        $form = SmartForm::factory()->create();
        $gestor = $this->makeUser('gestor');
        $colab = $this->makeUser('colaborador');

        $this->actingAs($colab)
            ->postJson("/api/smart-forms/{$form->id}/responses", [
                'responses' => ['q1' => 7],
            ]);

        $this->actingAs($gestor)
            ->getJson("/api/smart-forms/{$form->id}/responses")
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_aggregate_retorna_medias(): void
    {
        $form = SmartForm::factory()->create();
        $colab1 = $this->makeUser('colaborador');
        $colab2 = $this->makeUser('colaborador');

        $this->actingAs($colab1)->postJson("/api/smart-forms/{$form->id}/responses", ['responses' => ['q1' => 8]]);
        $this->actingAs($colab2)->postJson("/api/smart-forms/{$form->id}/responses", ['responses' => ['q1' => 6]]);

        $this->asUser('admin')
            ->getJson("/api/smart-forms/{$form->id}/aggregate")
            ->assertOk()
            ->assertJsonPath('total_responses', 2)
            ->assertJsonPath('averages.q1', 7.0);
    }
}

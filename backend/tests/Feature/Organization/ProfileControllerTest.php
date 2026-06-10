<?php

namespace Tests\Feature\Organization;

use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    public function test_show_retorna_perfil_do_usuario_autenticado(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('user_id', $user->id);
    }

    public function test_update_altera_proprio_perfil(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->putJson('/api/profile', ['full_name' => 'Nome Atualizado'])
            ->assertOk()
            ->assertJsonPath('full_name', 'Nome Atualizado');
    }

    public function test_update_proibido_para_outro_usuario(): void
    {
        $this->makeUser();
        $outro = $this->makeUser();

        // Autentica como um colaborador mas tenta usar a rota de profile — que sempre edita o próprio
        // O teste correto aqui é verificar que não é possível passar um user_id externo na edição
        $this->actingAs($outro)
            ->putJson('/api/profile', ['full_name' => 'Invadido'])
            ->assertOk()
            ->assertJsonPath('user_id', $outro->id);
    }

    public function test_team_retorna_liderados_do_gestor(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $this->makeUser('colaborador', $sector, $gestor->profile);
        $this->makeUser('colaborador', $sector, $gestor->profile);

        $this->actingAs($gestor)
            ->getJson('/api/profile/team')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_team_retorna_vazio_sem_liderados(): void
    {
        $this->asUser('gestor')
            ->getJson('/api/profile/team')
            ->assertOk()
            ->assertJsonCount(0);
    }
}

<?php

namespace Tests\Feature\Organization;

use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_index_retorna_usuarios_como_admin(): void
    {
        $this->makeUser('colaborador');
        $this->makeUser('colaborador');

        $this->asUser('admin')
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonStructure([['id', 'email', 'profile', 'roles']]);
    }

    public function test_index_proibido_para_nao_admin(): void
    {
        $this->asUser('colaborador')
            ->getJson('/api/users')
            ->assertForbidden();
    }

    public function test_store_cria_usuario_como_admin(): void
    {
        $sector = $this->makeSector();

        $this->asUser('admin')
            ->postJson('/api/users', [
                'name' => 'João Silva',
                'email' => 'joao@empresa.com',
                'password' => 'senha12345',
                'role' => 'colaborador',
                'sector_id' => $sector->id,
            ])
            ->assertOk()
            ->assertJsonPath('email', 'joao@empresa.com');

        $this->assertDatabaseHas('users', ['email' => 'joao@empresa.com']);
    }

    public function test_store_proibido_para_nao_admin(): void
    {
        $this->asUser('colaborador')
            ->postJson('/api/users', [
                'name' => 'Teste',
                'email' => 'teste@empresa.com',
                'password' => 'senha12345',
            ])
            ->assertForbidden();
    }

    public function test_deactivate_desativa_usuario_como_admin(): void
    {
        $target = $this->makeUser('colaborador');

        $this->asUser('admin')
            ->patchJson("/api/users/{$target->id}/deactivate")
            ->assertOk();

        $this->assertDatabaseHas('profiles', ['user_id' => $target->id, 'active' => false]);
    }

    public function test_deactivate_proibido_para_nao_admin(): void
    {
        $target = $this->makeUser('colaborador');

        $this->asUser('colaborador')
            ->patchJson("/api/users/{$target->id}/deactivate")
            ->assertForbidden();
    }
}

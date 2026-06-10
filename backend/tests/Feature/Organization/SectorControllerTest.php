<?php

namespace Tests\Feature\Organization;

use Tests\TestCase;

class SectorControllerTest extends TestCase
{
    public function test_index_retorna_todos_os_setores(): void
    {
        $this->makeSector('TI');
        $this->makeSector('RH');

        $this->asUser()
            ->getJson('/api/sectors')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_store_cria_setor_como_admin(): void
    {
        $this->asUser('admin')
            ->postJson('/api/sectors', ['name' => 'Financeiro', 'description' => 'Setor financeiro'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Financeiro');
    }

    public function test_store_proibido_para_nao_admin(): void
    {
        $this->asUser('colaborador')
            ->postJson('/api/sectors', ['name' => 'Financeiro'])
            ->assertForbidden();
    }

    public function test_update_altera_setor_como_admin(): void
    {
        $sector = $this->makeSector('TI');

        $this->asUser('admin')
            ->putJson("/api/sectors/{$sector->id}", ['name' => 'Tecnologia'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Tecnologia');
    }

    public function test_destroy_remove_setor_como_admin(): void
    {
        $sector = $this->makeSector('TI');

        $this->asUser('admin')
            ->deleteJson("/api/sectors/{$sector->id}")
            ->assertOk();

        $this->assertDatabaseMissing('sectors', ['id' => $sector->id]);
    }
}

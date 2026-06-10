<?php

namespace Tests\Feature\Feedback;

use Src\Feedback\Models\PointwiseFeedback;
use Tests\TestCase;

class FeedbackControllerTest extends TestCase
{
    public function test_received_retorna_feedbacks_recebidos(): void
    {
        $remetente = $this->makeUser('colaborador');
        $destinatario = $this->makeUser('colaborador');
        PointwiseFeedback::factory()->create([
            'from_user_id' => $remetente->id,
            'to_user_id' => $destinatario->id,
        ]);

        $this->actingAs($destinatario)
            ->getJson('/api/feedback/received')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_sent_retorna_feedbacks_enviados(): void
    {
        $remetente = $this->makeUser('colaborador');
        $destinatario = $this->makeUser('colaborador');
        PointwiseFeedback::factory()->create([
            'from_user_id' => $remetente->id,
            'to_user_id' => $destinatario->id,
        ]);

        $this->actingAs($remetente)
            ->getJson('/api/feedback/sent')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_team_retorna_feedbacks_do_time_para_gestor(): void
    {
        $sector = $this->makeSector();
        $gestor = $this->makeUser('gestor', $sector);
        $colab = $this->makeUser('colaborador', $sector, $gestor->profile);
        $outro = $this->makeUser('colaborador');

        PointwiseFeedback::factory()->create([
            'from_user_id' => $outro->id,
            'to_user_id' => $colab->id,
            'visibility' => 'with_manager',
        ]);

        $this->actingAs($gestor)
            ->getJson('/api/feedback/team')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_team_proibido_para_colaborador(): void
    {
        $this->asUser('colaborador')
            ->getJson('/api/feedback/team')
            ->assertForbidden();
    }

    public function test_store_cria_feedback(): void
    {
        $remetente = $this->makeUser('colaborador');
        $destinatario = $this->makeUser('colaborador');

        $this->actingAs($remetente)
            ->postJson('/api/feedback', [
                'to_user_id' => $destinatario->id,
                'type' => 'kudos',
                'content' => 'Ótimo trabalho na apresentação do projeto.',
                'visibility' => 'with_manager',
            ])
            ->assertOk()
            ->assertJsonPath('type', 'kudos');
    }

    public function test_store_nao_permite_feedback_para_si_mesmo(): void
    {
        $user = $this->makeUser('colaborador');

        $this->actingAs($user)
            ->postJson('/api/feedback', [
                'to_user_id' => $user->id,
                'type' => 'kudos',
                'content' => 'Auto elogio aqui.',
            ])
            ->assertUnprocessable();
    }

    public function test_destroy_remove_feedback_do_autor(): void
    {
        $remetente = $this->makeUser('colaborador');
        $destinatario = $this->makeUser('colaborador');
        $feedback = PointwiseFeedback::factory()->create([
            'from_user_id' => $remetente->id,
            'to_user_id' => $destinatario->id,
        ]);

        $this->actingAs($remetente)
            ->deleteJson("/api/feedback/{$feedback->id}")
            ->assertOk();

        $this->assertDatabaseMissing('pointwise_feedback', ['id' => $feedback->id]);
    }

    public function test_destroy_proibido_para_terceiros(): void
    {
        $remetente = $this->makeUser('colaborador');
        $destinatario = $this->makeUser('colaborador');
        $terceiro = $this->makeUser('colaborador');
        $feedback = PointwiseFeedback::factory()->create([
            'from_user_id' => $remetente->id,
            'to_user_id' => $destinatario->id,
        ]);

        $this->actingAs($terceiro)
            ->deleteJson("/api/feedback/{$feedback->id}")
            ->assertForbidden();
    }
}

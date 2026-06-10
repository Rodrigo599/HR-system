<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    public function test_login_retorna_token_com_credenciais_validas(): void
    {
        $user = $this->makeUser();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'roles']]);
    }

    public function test_login_retorna_422_com_credenciais_invalidas(): void
    {
        $this->makeUser();

        $this->postJson('/api/auth/login', [
            'email' => 'errado@email.com',
            'password' => 'errada',
        ])->assertUnprocessable();
    }

    public function test_me_retorna_usuario_autenticado(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id);
    }

    public function test_me_retorna_401_sem_autenticacao(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_invalida_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('api')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }
}

<?php

namespace Src\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function attempt(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        $user->load('profile', 'roles');

        $token = $user->createToken('api')->plainTextToken;

        return compact('user', 'token');
    }

    public function me(User $user): User
    {
        return $user->load('profile', 'roles');
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}

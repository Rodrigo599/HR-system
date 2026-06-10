<?php

namespace Src\Auth\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Src\Auth\Requests\LoginRequest;
use Src\Auth\Resources\AuthUserResource;
use Src\Auth\Services\AuthService;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(LoginRequest $request): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $this->auth->attempt(
            $request->email,
            $request->password,
        );

        return response()->json([
            'token' => $token,
            'user' => new AuthUserResource($user),
        ]);
    }

    public function me(Request $request): AuthUserResource
    {
        return new AuthUserResource(
            $this->auth->me($request->user())
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }
}

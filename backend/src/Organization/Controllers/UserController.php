<?php

namespace Src\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Organization\DTOs\CreateUserDTO;
use Src\Organization\Requests\CreateUserRequest;
use Src\Organization\Resources\UserResource;
use Src\Organization\Services\UserService;

class UserController extends Controller
{
    public function __construct(private readonly UserService $users) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $users = User::with('profile.sector', 'roles')->get();

        return UserResource::collection($users);
    }

    public function store(CreateUserRequest $request): UserResource
    {
        $this->authorize('create', User::class);

        return UserResource::make(
            $this->users->create(CreateUserDTO::fromRequest($request))
        );
    }

    public function update(CreateUserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        return UserResource::make(
            $this->users->create(CreateUserDTO::fromRequest($request))
        );
    }

    public function deactivate(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->users->deactivate($user);

        return response()->json(['message' => 'Usuário desativado.']);
    }
}

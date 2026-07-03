<?php

namespace Src\Organization\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Src\Organization\DTOs\CreateUserDTO;
use Src\Organization\Models\UserRole;

class UserService
{
    public function create(CreateUserDTO $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create([
                'name' => $dto->name,
                'email' => $dto->email,
                'password' => Hash::make($dto->password),
            ]);

            $user->profile()->update([
                'email' => $dto->email,
                'full_name' => $dto->name,
                'sector_id' => $dto->sectorId,
                'manager_id' => $dto->managerId,
            ]);

            $user->roles()->update(['role' => $dto->role]);

            return $user->load('profile', 'roles');
        });
    }

    public function update(User $user, CreateUserDTO $dto): User
    {
        return DB::transaction(function () use ($user, $dto) {
            $data = ['name' => $dto->name, 'email' => $dto->email];
            if ($dto->password !== '') {
                $data['password'] = Hash::make($dto->password);
            }
            $user->update($data);

            $user->profile()->update([
                'email' => $dto->email,
                'full_name' => $dto->name,
                'sector_id' => $dto->sectorId,
                'manager_id' => $dto->managerId,
            ]);

            $user->roles()->update(['role' => $dto->role]);

            return $user->load('profile', 'roles');
        });
    }

    public function deactivate(User $user): void
    {
        $user->profile()->update(['active' => false]);
        $user->tokens()->delete();
    }

    public function activate(User $user): void
    {
        $user->profile()->update(['active' => true]);
    }

    public function updateRole(User $user, string $role): void
    {
        UserRole::updateOrCreate(
            ['user_id' => $user->id, 'role' => $role],
        );
    }
}

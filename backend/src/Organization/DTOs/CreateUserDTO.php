<?php

namespace Src\Organization\DTOs;

use Illuminate\Http\Request;

class CreateUserDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $role,
        public readonly ?string $sectorId,
        public readonly ?string $managerId,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->string('name'),
            email: $request->string('email'),
            password: $request->string('password'),
            role: $request->string('role', 'colaborador'),
            sectorId: $request->input('sector_id'),
            managerId: $request->input('manager_id'),
        );
    }
}

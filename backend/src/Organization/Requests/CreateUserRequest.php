<?php

namespace Src\Organization\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Organization\Enums\AppRole;

class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['sometimes', Rule::enum(AppRole::class)],
            'sector_id' => ['nullable', 'uuid', 'exists:sectors,id'],
            'manager_id' => ['nullable', 'uuid', 'exists:profiles,id'],
        ];
    }
}

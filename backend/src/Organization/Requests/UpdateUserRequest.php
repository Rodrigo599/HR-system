<?php

namespace Src\Organization\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Organization\Enums\AppRole;

class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        // Edição de usuário existente: email é único exceto o próprio; senha é
        // opcional (só troca se vier preenchida).
        $target = $this->route('user');
        $userId = is_object($target) ? $target->id : $target;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::enum(AppRole::class)],
            'sector_id' => ['nullable', 'uuid', 'exists:sectors,id'],
            'manager_id' => ['nullable', 'uuid', 'exists:profiles,id'],
        ];
    }
}

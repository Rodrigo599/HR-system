<?php

namespace Src\Organization\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDependentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // profile_id opcional: se ausente, o dependente é do próprio usuário.
            'profile_id' => ['sometimes', 'uuid', 'exists:profiles,id'],
            'name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'relationship' => ['required', 'string', 'max:50'],
            'consent' => ['sometimes', 'boolean'],
        ];
    }
}

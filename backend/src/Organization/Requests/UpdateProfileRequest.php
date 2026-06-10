<?php

namespace Src\Organization\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'avatar_url' => ['sometimes', 'nullable', 'url'],
            'sector_id' => ['sometimes', 'nullable', 'uuid', 'exists:sectors,id'],
            'manager_id' => ['sometimes', 'nullable', 'uuid', 'exists:profiles,id'],
            'preferred_language' => ['sometimes', 'string', 'in:pt,es'],
        ];
    }
}

<?php

namespace Src\Content\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignContentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['uuid', 'exists:users,id'],
        ];
    }
}

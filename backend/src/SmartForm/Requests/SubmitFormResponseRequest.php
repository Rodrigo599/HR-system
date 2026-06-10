<?php

namespace Src\SmartForm\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFormResponseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'responses' => ['required', 'array'],
            'assigned_to' => ['nullable', 'uuid', 'exists:users,id'],
        ];
    }
}

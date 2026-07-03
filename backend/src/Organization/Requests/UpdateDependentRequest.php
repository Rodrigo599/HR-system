<?php

namespace Src\Organization\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDependentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'birth_date' => ['sometimes', 'date'],
            'relationship' => ['sometimes', 'string', 'max:50'],
            'consent' => ['sometimes', 'boolean'],
        ];
    }
}

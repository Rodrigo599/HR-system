<?php

namespace Src\PDI\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePdiTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'link' => ['nullable', 'url'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}

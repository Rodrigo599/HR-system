<?php

namespace Src\Content\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Content\Enums\ContentType;

class CreateContentItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ContentType::class)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'link_url' => ['nullable', 'url'],
            'file_url' => ['nullable', 'url'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}

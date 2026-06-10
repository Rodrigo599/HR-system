<?php

namespace Src\Content\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Content\Enums\ContentStatus;

class UpdateProgressRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ContentStatus::class)],
        ];
    }
}

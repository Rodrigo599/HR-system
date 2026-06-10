<?php

namespace Src\PDI\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:approved,rejected'],
            'comment' => ['nullable', 'string'],
        ];
    }
}

<?php

namespace Src\Evaluation\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitResponseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'scores' => ['required', 'array'],
            'scores.*.score' => ['required', 'numeric', 'between:0,10'],
        ];
    }
}

<?php

namespace Src\OneOnOne\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTopicRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'content' => ['required', 'string'],
        ];
    }
}

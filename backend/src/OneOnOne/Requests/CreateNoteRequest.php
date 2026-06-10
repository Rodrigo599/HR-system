<?php

namespace Src\OneOnOne\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateNoteRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'content' => ['required', 'string'],
            'type' => ['sometimes', 'in:decision,action,observation'],
        ];
    }
}

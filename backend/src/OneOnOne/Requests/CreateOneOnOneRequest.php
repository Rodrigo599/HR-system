<?php

namespace Src\OneOnOne\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOneOnOneRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'report_id' => ['required', 'uuid', 'exists:users,id'],
            'scheduled_at' => ['required', 'date'],
            'recurrence_rule' => ['nullable', 'in:weekly,biweekly,monthly'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

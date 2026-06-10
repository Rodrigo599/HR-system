<?php

namespace Src\Evaluation\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Evaluation\Enums\EvaluationFlowType;
use Src\Evaluation\Enums\EvaluationType;

class CreateEvaluationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'assigned_to' => ['required', 'uuid', 'exists:users,id'],
            'type' => ['required', Rule::enum(EvaluationType::class)],
            'flow_type' => ['sometimes', Rule::enum(EvaluationFlowType::class)],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2020,2099'],
            'smart_form_id' => ['nullable', 'uuid', 'exists:smart_forms,id'],
        ];
    }
}

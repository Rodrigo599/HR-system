<?php

namespace Src\KPI\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertKpiResultRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'kpi_id' => ['required', 'uuid', 'exists:kpis,id'],
            'user_id' => ['sometimes', 'uuid', 'exists:users,id'],
            'score' => ['required', 'numeric', 'min:0'],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2020,2099'],
        ];
    }
}

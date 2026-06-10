<?php

namespace Src\KPI\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\KPI\Enums\KpiUnit;

class StoreKpiRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_value' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', Rule::enum(KpiUnit::class)],
            'sector_ids' => ['nullable', 'array'],
            'sector_ids.*' => ['uuid', 'exists:sectors,id'],
        ];
    }
}

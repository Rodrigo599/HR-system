<?php

namespace Src\KPI\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreKpiRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_value' => ['required', 'numeric', 'min:0'],
            // Unidade é texto livre: os KPIs reais usam "%", "USD", "pts", "min",
            // "experimentos" etc. O enum fechado rejeitava tudo isso (422).
            'unit' => ['nullable', 'string', 'max:20'],
            'sector_ids' => ['nullable', 'array'],
            'sector_ids.*' => ['uuid', 'exists:sectors,id'],
        ];
    }
}

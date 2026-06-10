<?php

namespace Src\SmartForm\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\SmartForm\Enums\SmartFormCategory;
use Src\SmartForm\Enums\SmartFormStatus;

class CreateSmartFormRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', Rule::unique('smart_forms', 'slug')->ignore($this->route('smartForm')), 'regex:/^[a-z0-9\-]+$/'],
            'config' => ['required', 'array'],
            'config.steps' => ['required', 'array', 'min:1'],
            'status' => ['sometimes', Rule::enum(SmartFormStatus::class)],
            'category' => ['required', Rule::enum(SmartFormCategory::class)],
            'sector_id' => ['nullable', 'uuid', 'exists:sectors,id'],
        ];
    }
}

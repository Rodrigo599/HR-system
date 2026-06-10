<?php

namespace Src\SmartForm\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\SmartForm\Enums\SmartFormCategory;
use Src\SmartForm\Enums\SmartFormStatus;

class UpdateSmartFormRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'slug'          => ['sometimes', 'string', Rule::unique('smart_forms', 'slug')->ignore($this->route('smartForm')), 'regex:/^[a-z0-9\-]+$/'],
            'config'        => ['sometimes', 'array'],
            'config.steps'  => ['sometimes', 'array', 'min:1'],
            'status'        => ['sometimes', Rule::enum(SmartFormStatus::class)],
            'category'      => ['sometimes', Rule::enum(SmartFormCategory::class)],
            'sector_id'     => ['nullable', 'uuid', 'exists:sectors,id'],
        ];
    }
}

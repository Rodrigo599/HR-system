<?php

namespace Src\Feedback\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Feedback\Enums\FeedbackType;
use Src\Feedback\Enums\FeedbackVisibility;

class CreateFeedbackRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'to_user_id' => ['required', 'uuid', 'exists:users,id', Rule::notIn([$this->user()->id])],
            'type' => ['required', Rule::enum(FeedbackType::class)],
            'content' => ['required', 'string', 'min:10'],
            'visibility' => ['sometimes', Rule::enum(FeedbackVisibility::class)],
        ];
    }
}

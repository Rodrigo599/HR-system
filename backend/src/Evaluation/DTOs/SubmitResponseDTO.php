<?php

namespace Src\Evaluation\DTOs;

use Illuminate\Http\Request;

class SubmitResponseDTO
{
    public function __construct(
        public readonly array $scores,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            scores: $request->array('scores'),
        );
    }
}

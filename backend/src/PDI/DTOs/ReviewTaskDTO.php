<?php

namespace Src\PDI\DTOs;

use Illuminate\Http\Request;

class ReviewTaskDTO
{
    public function __construct(
        public readonly string $decision,
        public readonly ?string $comment,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            decision: $request->string('decision'),
            comment: $request->input('comment'),
        );
    }
}

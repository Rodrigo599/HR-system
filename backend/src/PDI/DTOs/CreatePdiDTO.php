<?php

namespace Src\PDI\DTOs;

use Illuminate\Http\Request;

class CreatePdiDTO
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $description,
        public readonly ?string $startDate,
        public readonly ?string $endDate,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title: $request->string('title'),
            description: $request->input('description'),
            startDate: $request->input('start_date'),
            endDate: $request->input('end_date'),
        );
    }
}

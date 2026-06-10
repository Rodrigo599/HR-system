<?php

namespace Src\PDI\DTOs;

use Illuminate\Http\Request;

class CreatePdiTaskDTO
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $description,
        public readonly ?string $link,
        public readonly ?string $dueDate,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title: $request->string('title'),
            description: $request->input('description'),
            link: $request->input('link'),
            dueDate: $request->input('due_date'),
        );
    }
}

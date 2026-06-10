<?php

namespace Src\Evaluation\DTOs;

use Illuminate\Http\Request;

class CreateEvaluationDTO
{
    public function __construct(
        public readonly string $assignedTo,
        public readonly string $type,
        public readonly string $flowType,
        public readonly int $month,
        public readonly int $year,
        public readonly ?string $smartFormId,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            assignedTo: $request->string('assigned_to'),
            type: $request->string('type'),
            flowType: $request->string('flow_type', 'sequential'),
            month: $request->integer('month'),
            year: $request->integer('year'),
            smartFormId: $request->input('smart_form_id'),
        );
    }
}

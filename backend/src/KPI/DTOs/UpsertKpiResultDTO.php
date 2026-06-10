<?php

namespace Src\KPI\DTOs;

use Illuminate\Http\Request;

class UpsertKpiResultDTO
{
    public function __construct(
        public readonly string $kpiId,
        public readonly string $userId,
        public readonly float $score,
        public readonly int $month,
        public readonly int $year,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            kpiId: $request->string('kpi_id'),
            userId: $request->string('user_id', $request->user()->id),
            score: $request->float('score'),
            month: $request->integer('month'),
            year: $request->integer('year'),
        );
    }
}

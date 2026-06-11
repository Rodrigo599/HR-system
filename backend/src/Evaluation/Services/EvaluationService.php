<?php

namespace Src\Evaluation\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Src\Evaluation\DTOs\CreateEvaluationDTO;
use Src\Evaluation\Enums\EvaluationFlowType;
use Src\Evaluation\Enums\EvaluationStatus;
use Src\Evaluation\Models\Evaluation;
use Src\Evaluation\Models\EvaluationResponse;

class EvaluationService
{
    public function create(User $creator, CreateEvaluationDTO $dto): Evaluation
    {
        $evaluation = Evaluation::create([
            'created_by' => $creator->id,
            'assigned_to' => $dto->assignedTo,
            'type' => $dto->type,
            'flow_type' => $dto->flowType,
            'month' => $dto->month,
            'year' => $dto->year,
            'smart_form_id' => $dto->smartFormId,
            'status' => EvaluationStatus::PendingSelf,
        ]);

        return $evaluation->load('assignee.profile', 'creator');
    }

    public function submitSelf(Evaluation $evaluation, array $scores): Evaluation
    {
        abort_if(
            $evaluation->status !== EvaluationStatus::PendingSelf,
            422,
            'Avaliação não está aguardando autoavaliação.'
        );

        DB::transaction(function () use ($evaluation, $scores) {
            foreach ($scores as $item) {
                EvaluationResponse::updateOrCreate(
                    ['evaluation_id' => $evaluation->id],
                    ['self_score' => $item['score']],
                );
            }

            $nextStatus = $evaluation->flow_type === EvaluationFlowType::Blind
                ? EvaluationStatus::PendingManager
                : EvaluationStatus::PendingManager;

            $evaluation->update(['status' => $nextStatus]);
        });

        return $evaluation->fresh('responses');
    }

    public function submitManager(Evaluation $evaluation, array $scores): Evaluation
    {
        abort_if(
            $evaluation->status !== EvaluationStatus::PendingManager,
            422,
            'Avaliação não está aguardando avaliação do gestor.'
        );

        DB::transaction(function () use ($evaluation, $scores) {
            foreach ($scores as $item) {
                $response = EvaluationResponse::firstOrCreate(
                    ['evaluation_id' => $evaluation->id],
                );

                $selfScore = $response->self_score ?? 0;
                $managerScore = $item['score'];

                $response->update([
                    'manager_score' => $managerScore,
                    'final_score' => round(($selfScore + $managerScore) / 2, 2),
                ]);
            }

            $evaluation->update(['status' => EvaluationStatus::Completed]);
        });

        return $evaluation->fresh('responses');
    }
}

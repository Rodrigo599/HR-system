<?php

namespace Src\Evaluation\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Evaluation\DTOs\CreateEvaluationDTO;
use Src\Evaluation\Models\Evaluation;
use Src\Evaluation\Requests\CreateEvaluationRequest;
use Src\Evaluation\Requests\SubmitResponseRequest;
use Src\Evaluation\Resources\EvaluationResource;
use Src\Evaluation\Services\EvaluationQueryService;
use Src\Evaluation\Services\EvaluationService;

class EvaluationController extends Controller
{
    public function __construct(
        private readonly EvaluationService $evaluations,
        private readonly EvaluationQueryService $queries,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $year = $request->integer('year') ?: null;
        $user = $request->user();

        $items = match (true) {
            $user->hasRole('admin') => $this->queries->forAdmin($year),
            $user->hasAnyRole(['gestor']) => $this->queries->forTeam($user, $year),
            default => $this->queries->forUser($user, $year),
        };

        return EvaluationResource::collection($items);
    }

    public function store(CreateEvaluationRequest $request): EvaluationResource
    {
        $this->authorize('create', Evaluation::class);

        return EvaluationResource::make(
            $this->evaluations->create(
                $request->user(),
                CreateEvaluationDTO::fromRequest($request),
            )
        );
    }

    public function show(Evaluation $evaluation): EvaluationResource
    {
        $this->authorize('view', $evaluation);

        return EvaluationResource::make(
            $evaluation->load('assignee.profile', 'creator', 'responses', 'smartForm')
        );
    }

    public function submitSelf(SubmitResponseRequest $request, Evaluation $evaluation): EvaluationResource
    {
        $this->authorize('submitSelf', $evaluation);

        return EvaluationResource::make(
            $this->evaluations->submitSelf($evaluation, $request->array('scores'))
        );
    }

    public function submitManager(SubmitResponseRequest $request, Evaluation $evaluation): EvaluationResource
    {
        $this->authorize('submitManager', $evaluation);

        return EvaluationResource::make(
            $this->evaluations->submitManager($evaluation, $request->array('scores'))
        );
    }
}

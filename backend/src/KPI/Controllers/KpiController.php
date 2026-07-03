<?php

namespace Src\KPI\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\KPI\DTOs\UpsertKpiResultDTO;
use Src\KPI\Models\Kpi;
use Src\KPI\Requests\StoreKpiRequest;
use Src\KPI\Requests\UpsertKpiResultRequest;
use Src\KPI\Resources\KpiResource;
use Src\KPI\Resources\KpiResultResource;
use Src\KPI\Services\KpiResultService;
use Src\KPI\Services\KpiService;
use Src\Organization\Services\HierarchyService;

class KpiController extends Controller
{
    public function __construct(
        private readonly KpiService $kpis,
        private readonly KpiResultService $results,
        private readonly HierarchyService $hierarchy,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $items = !$request->isPersonalView() && $user->hasAnyRole(['admin', 'gestor'])
            ? $this->kpis->forTeam($user)
            : $this->kpis->forUser($user);

        return KpiResource::collection($items);
    }

    public function store(StoreKpiRequest $request): KpiResource
    {
        $this->authorize('create', Kpi::class);

        return KpiResource::make(
            $this->kpis->create(
                $request->only('name', 'description', 'target_value', 'unit'),
                $request->input('sector_ids', []),
            )
        );
    }

    public function update(StoreKpiRequest $request, Kpi $kpi): KpiResource
    {
        $this->authorize('update', $kpi);

        return KpiResource::make(
            $this->kpis->update(
                $kpi,
                $request->only('name', 'description', 'target_value', 'unit'),
                $request->input('sector_ids', []),
            )
        );
    }

    public function destroy(Kpi $kpi): JsonResponse
    {
        $this->authorize('delete', $kpi);

        $kpi->delete();

        return response()->json(['message' => 'KPI removido.']);
    }

    public function indexResults(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $month = $request->integer('month', now()->month);
        $year = $request->integer('year', now()->year);

        $items = !$request->isPersonalView() && $user->hasAnyRole(['admin', 'gestor'])
            ? $this->results->forTeam($user, $month, $year)
            : $this->results->forUser($user, $month, $year);

        return KpiResultResource::collection($items);
    }

    public function upsertResult(UpsertKpiResultRequest $request): KpiResultResource
    {
        // PRD 3.4: lançar resultado de KPI é Admin (qualquer) ou Gestor (só do seu time).
        // Colaborador não tem acesso de escrita nenhum. Sem esta checagem, qualquer
        // usuário autenticado sobrescreveria o KPI de qualquer pessoa (user_id no body).
        $user = $request->user();
        $target = User::findOrFail($request->input('user_id', $user->id));

        abort_unless(
            $user->hasRole('admin')
                || ($user->hasRole('gestor') && $this->hierarchy->isManagerOf($user, $target)),
            403,
            'Sem permissão para lançar resultado de KPI deste colaborador.'
        );

        return KpiResultResource::make(
            $this->results->upsert(UpsertKpiResultDTO::fromRequest($request))->load('kpi')
        );
    }
}

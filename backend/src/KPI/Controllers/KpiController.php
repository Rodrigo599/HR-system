<?php

namespace Src\KPI\Controllers;

use App\Http\Controllers\Controller;
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

class KpiController extends Controller
{
    public function __construct(
        private readonly KpiService $kpis,
        private readonly KpiResultService $results,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return KpiResource::collection(
            $this->kpis->forUser($request->user())
        );
    }

    public function store(StoreKpiRequest $request): KpiResource
    {
        $this->authorize('create', Kpi::class);

        return KpiResource::make(
            $this->kpis->create(
                $request->only('name', 'description', 'target_value', 'unit'),
                $request->array('sector_ids', []),
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
                $request->array('sector_ids', []),
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

        $items = $user->hasAnyRole(['admin', 'gestor'])
            ? $this->results->forTeam($user, $month, $year)
            : $this->results->forUser($user, $month, $year);

        return KpiResultResource::collection($items);
    }

    public function upsertResult(UpsertKpiResultRequest $request): KpiResultResource
    {
        return KpiResultResource::make(
            $this->results->upsert(UpsertKpiResultDTO::fromRequest($request))->load('kpi')
        );
    }
}

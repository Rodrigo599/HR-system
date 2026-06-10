<?php

namespace Src\Organization\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Organization\Models\Sector;
use Src\Organization\Resources\SectorResource;

class SectorController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SectorResource::collection(Sector::all());
    }

    public function store(Request $request): SectorResource
    {
        $this->authorize('create-sector');

        $sector = Sector::create($request->validate([
            'name' => ['required', 'string', 'unique:sectors,name'],
            'description' => ['nullable', 'string'],
        ]));

        return SectorResource::make($sector);
    }

    public function update(Request $request, Sector $sector): SectorResource
    {
        $this->authorize('update-sector');

        $sector->update($request->validate([
            'name' => ['sometimes', 'string', 'unique:sectors,name,' . $sector->id],
            'description' => ['nullable', 'string'],
        ]));

        return SectorResource::make($sector);
    }

    public function destroy(Sector $sector): JsonResponse
    {
        $this->authorize('delete-sector');

        $sector->delete();

        return response()->json(['message' => 'Setor removido.']);
    }
}

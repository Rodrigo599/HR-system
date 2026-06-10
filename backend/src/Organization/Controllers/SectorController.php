<?php

namespace Src\Organization\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Organization\Models\Sector;
use Src\Organization\Resources\SectorResource;

class SectorController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SectorResource::collection(Sector::all());
    }

    public function store(\Illuminate\Http\Request $request): SectorResource
    {
        $this->authorize('create', Sector::class);

        $sector = Sector::create($request->validate([
            'name' => ['required', 'string', 'unique:sectors,name'],
            'description' => ['nullable', 'string'],
        ]));

        return new SectorResource($sector);
    }

    public function update(\Illuminate\Http\Request $request, Sector $sector): SectorResource
    {
        $this->authorize('update', $sector);

        $sector->update($request->validate([
            'name' => ['sometimes', 'string', 'unique:sectors,name,' . $sector->id],
            'description' => ['nullable', 'string'],
        ]));

        return new SectorResource($sector);
    }

    public function destroy(Sector $sector): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $sector);

        $sector->delete();

        return response()->json(['message' => 'Setor removido.']);
    }
}

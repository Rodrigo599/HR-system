<?php

namespace Src\Organization\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Organization\DTOs\UpdateProfileDTO;
use Src\Organization\Requests\UpdateProfileRequest;
use Src\Organization\Resources\ProfileResource;
use Src\Organization\Services\HierarchyService;
use Src\Organization\Services\ProfileService;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profiles,
        private readonly HierarchyService $hierarchy,
    ) {}

    public function show(Request $request): ProfileResource
    {
        return ProfileResource::make(
            $request->user()->profile->load('sector', 'dependents')
        );
    }

    public function update(UpdateProfileRequest $request): ProfileResource
    {
        $this->authorize('update', $request->user()->profile);

        return ProfileResource::make(
            $this->profiles->update(
                $request->user(),
                UpdateProfileDTO::fromRequest($request),
            )
        );
    }

    public function team(Request $request): AnonymousResourceCollection
    {
        return ProfileResource::collection(
            $this->hierarchy->getDirectReports($request->user())
        );
    }
}

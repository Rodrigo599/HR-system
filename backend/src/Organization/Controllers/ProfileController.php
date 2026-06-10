<?php

namespace Src\Organization\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Src\Organization\DTOs\UpdateProfileDTO;
use Src\Organization\Requests\UpdateProfileRequest;
use Src\Organization\Resources\ProfileResource;
use Src\Organization\Resources\UserResource;
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
        return new ProfileResource(
            $request->user()->profile->load('sector')
        );
    }

    public function update(UpdateProfileRequest $request): ProfileResource
    {
        $this->authorize('update', $request->user()->profile);

        $profile = $this->profiles->update(
            $request->user(),
            UpdateProfileDTO::fromRequest($request),
        );

        return new ProfileResource($profile);
    }

    public function team(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $reports = $this->hierarchy->getDirectReports($request->user());

        return ProfileResource::collection($reports);
    }
}

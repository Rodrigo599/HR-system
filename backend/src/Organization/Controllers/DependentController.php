<?php

namespace Src\Organization\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Organization\Models\Dependent;
use Src\Organization\Requests\StoreDependentRequest;
use Src\Organization\Requests\UpdateDependentRequest;
use Src\Organization\Resources\DependentResource;
use Src\Organization\Services\DependentService;
use Src\Organization\Services\HierarchyService;

class DependentController extends Controller
{
    public function __construct(
        private readonly DependentService $dependents,
        private readonly HierarchyService $hierarchy,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return DependentResource::collection(
            $this->dependents->forUser($request->user())
        );
    }

    public function store(StoreDependentRequest $request): DependentResource
    {
        $user = $request->user();

        // Sem profile_id => dependente do próprio usuário. Com profile_id, precisa
        // ser admin, o próprio dono, ou gestor do dono.
        $profileId = $request->input('profile_id', $user->profile->id);
        $this->assertCanManageProfile($user, $profileId);

        $data = $request->only('name', 'birth_date', 'relationship', 'consent');
        $data['profile_id'] = $profileId;

        return DependentResource::make($this->dependents->create($data));
    }

    public function update(UpdateDependentRequest $request, Dependent $dependent): DependentResource
    {
        $this->authorize('update', $dependent);

        return DependentResource::make(
            $this->dependents->update($dependent, $request->validated())
        );
    }

    public function destroy(Dependent $dependent): JsonResponse
    {
        $this->authorize('delete', $dependent);

        $dependent->delete();

        return response()->json(['message' => 'Dependente removido.']);
    }

    public function birthdays(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dependents->upcomingBirthdays($request->user()),
        ]);
    }

    private function assertCanManageProfile($user, string $profileId): void
    {
        if ($user->hasRole('admin') || $profileId === $user->profile->id) {
            return;
        }

        $owner = \Src\Organization\Models\Profile::find($profileId)?->user;
        abort_unless(
            $owner && $user->hasRole('gestor') && $this->hierarchy->isManagerOf($user, $owner),
            403,
            'Sem permissão para gerenciar dependentes deste colaborador.'
        );
    }
}

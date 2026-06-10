<?php

namespace Src\PDI\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\PDI\DTOs\CreatePdiDTO;
use Src\PDI\DTOs\CreatePdiTaskDTO;
use Src\PDI\DTOs\ReviewTaskDTO;
use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;
use Src\PDI\Requests\CreatePdiRequest;
use Src\PDI\Requests\CreatePdiTaskRequest;
use Src\PDI\Requests\ReviewTaskRequest;
use Src\PDI\Resources\PdiResource;
use Src\PDI\Resources\PdiTaskResource;
use Src\PDI\Services\PdiService;
use Src\PDI\Services\PdiTaskService;

class PdiController extends Controller
{
    public function __construct(
        private readonly PdiService $pdis,
        private readonly PdiTaskService $tasks,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $items = $request->user()->hasAnyRole(['admin', 'gestor'])
            ? $this->pdis->forTeam($request->user())
            : $this->pdis->forUser($request->user());

        return PdiResource::collection($items);
    }

    public function store(CreatePdiRequest $request): PdiResource
    {
        $pdi = $this->pdis->create(
            $request->user(),
            CreatePdiDTO::fromRequest($request),
        );

        return new PdiResource($pdi);
    }

    public function tasks(Request $request, Pdi $pdi): AnonymousResourceCollection
    {
        $this->authorize('view', $pdi);

        return PdiTaskResource::collection($pdi->tasks);
    }

    public function storeTask(CreatePdiTaskRequest $request, Pdi $pdi): PdiTaskResource
    {
        $this->authorize('view', $pdi);

        return new PdiTaskResource(
            $this->tasks->create($pdi, CreatePdiTaskDTO::fromRequest($request))
        );
    }

    public function submitTask(Request $request, Pdi $pdi, PdiTask $task): PdiTaskResource
    {
        $this->authorize('submitTask', $task);

        return new PdiTaskResource($this->tasks->submit($task));
    }

    public function reviewTask(ReviewTaskRequest $request, Pdi $pdi, PdiTask $task): PdiTaskResource
    {
        $this->authorize('reviewTask', $task);

        return new PdiTaskResource(
            $this->tasks->review($task, ReviewTaskDTO::fromRequest($request), $request->user())
        );
    }
}

<?php

namespace Src\OneOnOne\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Models\OneOnOneTopic;
use Src\OneOnOne\Requests\CreateNoteRequest;
use Src\OneOnOne\Requests\CreateOneOnOneRequest;
use Src\OneOnOne\Requests\CreateTopicRequest;
use Src\OneOnOne\Resources\OneOnOneNoteResource;
use Src\OneOnOne\Resources\OneOnOneResource;
use Src\OneOnOne\Resources\OneOnOneTopicResource;
use Src\OneOnOne\Services\OneOnOneService;
use Src\Organization\Services\HierarchyService;

class OneOnOneController extends Controller
{
    public function __construct(
        private readonly OneOnOneService $service,
        private readonly HierarchyService $hierarchy,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return OneOnOneResource::collection(
            $this->service->forUser($request->user())
        );
    }

    public function store(CreateOneOnOneRequest $request): OneOnOneResource
    {
        $this->authorize('create', OneOnOne::class);

        // Gestor só agenda 1:1 com o próprio liderado (escopo de time do PRD §5).
        // Sem isto, um gestor "fabrica" uma relação de 1:1 com qualquer funcionário
        // e passa a ter acesso permanente às notas/tópicos daquele registro.
        $user = $request->user();
        if (! $user->hasRole('admin')) {
            $target = User::findOrFail($request->input('report_id'));
            abort_unless(
                $this->hierarchy->isManagerOf($user, $target),
                403,
                'Só é possível agendar 1:1 com membros do seu time.'
            );
        }

        return OneOnOneResource::make(
            $this->service->create($request->user(), $request->validated())
        );
    }

    public function show(OneOnOne $oneOnOne): OneOnOneResource
    {
        $this->authorize('view', $oneOnOne);

        return OneOnOneResource::make(
            $oneOnOne->load('manager.profile', 'report.profile', 'topics', 'notes')
        );
    }

    public function update(Request $request, OneOnOne $oneOnOne): OneOnOneResource
    {
        $this->authorize('update', $oneOnOne);

        return OneOnOneResource::make(
            $this->service->update($oneOnOne, $request->only(
                'scheduled_at', 'recurrence_rule', 'status', 'notes'
            ))
        );
    }

    public function storeTopic(CreateTopicRequest $request, OneOnOne $oneOnOne): JsonResponse
    {
        $this->authorize('interact', $oneOnOne);

        $topic = $this->service->addTopic($oneOnOne, $request->user(), $request->string('content'));

        return response()->json(OneOnOneTopicResource::make($topic)->toArray(request()), 201);
    }

    public function updateTopic(Request $request, OneOnOne $oneOnOne, OneOnOneTopic $topic): JsonResponse
    {
        $this->authorize('interact', $oneOnOne);

        $topic = $this->service->updateTopic($topic, $request->only('content', 'addressed'));

        return response()->json(OneOnOneTopicResource::make($topic)->toArray(request()));
    }

    public function storeNote(CreateNoteRequest $request, OneOnOne $oneOnOne): JsonResponse
    {
        $this->authorize('interact', $oneOnOne);

        $note = $this->service->addNote($oneOnOne, $request->user(), $request->validated());

        return response()->json(OneOnOneNoteResource::make($note)->toArray(request()), 201);
    }
}

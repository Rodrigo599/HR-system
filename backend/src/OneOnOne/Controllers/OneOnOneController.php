<?php

namespace Src\OneOnOne\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Models\OneOnOneTopic;
use Src\OneOnOne\Requests\CreateNoteRequest;
use Src\OneOnOne\Requests\CreateOneOnOneRequest;
use Src\OneOnOne\Requests\CreateTopicRequest;
use Src\OneOnOne\Resources\OneOnOneResource;
use Src\OneOnOne\Services\OneOnOneService;

class OneOnOneController extends Controller
{
    public function __construct(private readonly OneOnOneService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return OneOnOneResource::collection(
            $this->service->forUser($request->user())
        );
    }

    public function store(CreateOneOnOneRequest $request): OneOnOneResource
    {
        $this->authorize('create', OneOnOne::class);

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

        return response()->json([
            'id' => $topic->id,
            'content' => $topic->content,
            'addressed' => $topic->addressed,
            'author_user_id' => $topic->author_user_id,
            'created_at' => $topic->created_at,
        ], 201);
    }

    public function updateTopic(Request $request, OneOnOne $oneOnOne, OneOnOneTopic $topic): JsonResponse
    {
        $this->authorize('interact', $oneOnOne);

        $topic = $this->service->updateTopic($topic, $request->only('content', 'addressed'));

        return response()->json([
            'id' => $topic->id,
            'content' => $topic->content,
            'addressed' => $topic->addressed,
        ]);
    }

    public function storeNote(CreateNoteRequest $request, OneOnOne $oneOnOne): JsonResponse
    {
        $this->authorize('interact', $oneOnOne);

        $note = $this->service->addNote($oneOnOne, $request->user(), $request->validated());

        return response()->json([
            'id' => $note->id,
            'content' => $note->content,
            'type' => $note->type,
            'author_user_id' => $note->author_user_id,
            'created_at' => $note->created_at,
        ], 201);
    }
}

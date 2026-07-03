<?php

namespace Src\Content\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Content\Enums\ContentStatus;
use Src\Content\Models\ContentAssignment;
use Src\Content\Models\ContentItem;
use Src\Content\Requests\AssignContentRequest;
use Src\Content\Requests\CreateContentItemRequest;
use Src\Content\Requests\UpdateProgressRequest;
use Src\Content\Resources\ContentAssignmentResource;
use Src\Content\Resources\ContentItemResource;
use Src\Content\Services\ContentService;
use Src\Organization\Services\HierarchyService;

class ContentController extends Controller
{
    public function __construct(
        private readonly ContentService $content,
        private readonly HierarchyService $hierarchy,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $isTeam = !$request->isPersonalView() && $request->user()->hasAnyRole(['admin', 'gestor']);

        $items = $isTeam
            ? $this->content->forTeam($request->user())
            : $this->content->forUser($request->user());

        return $isTeam
            ? ContentItemResource::collection($items)
            : ContentAssignmentResource::collection($items);
    }

    public function store(CreateContentItemRequest $request): ContentItemResource
    {
        $this->authorize('create', ContentItem::class);

        return ContentItemResource::make(
            $this->content->create($request->user(), $request->validated())
        );
    }

    public function assign(AssignContentRequest $request, ContentItem $contentItem): JsonResponse
    {
        $this->authorize('assign', $contentItem);

        // Gestor só atribui conteúdo a membros do próprio time (PRD §5).
        $user = $request->user();
        $userIds = $request->array('user_ids');
        if (! $user->hasRole('admin')) {
            $teamIds = $this->hierarchy->getTeamUserIds($user);
            abort_unless(
                empty(array_diff($userIds, $teamIds)),
                403,
                'Só é possível atribuir conteúdo a membros do seu time.'
            );
        }

        $this->content->assign($contentItem, $userIds);

        return response()->json(['message' => 'Conteúdo atribuído.']);
    }

    public function updateProgress(UpdateProgressRequest $request, ContentAssignment $contentAssignment): ContentAssignmentResource
    {
        $this->authorize('updateProgress', $contentAssignment);

        return ContentAssignmentResource::make(
            $this->content->updateProgress(
                $contentAssignment,
                ContentStatus::from($request->string('status')),
            )
        );
    }

    public function progress(ContentItem $contentItem): JsonResponse
    {
        $this->authorize('viewProgress', $contentItem);

        return response()->json(
            $this->content->itemProgress($contentItem)
        );
    }
}

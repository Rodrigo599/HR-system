<?php

namespace Src\Feedback\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\Feedback\Models\PointwiseFeedback;
use Src\Feedback\Requests\CreateFeedbackRequest;
use Src\Feedback\Resources\FeedbackResource;
use Src\Feedback\Services\FeedbackService;

class FeedbackController extends Controller
{
    public function __construct(private readonly FeedbackService $feedback) {}

    public function received(Request $request): AnonymousResourceCollection
    {
        return FeedbackResource::collection(
            $this->feedback->received($request->user())
        );
    }

    public function sent(Request $request): AnonymousResourceCollection
    {
        return FeedbackResource::collection(
            $this->feedback->sent($request->user())
        );
    }

    public function team(Request $request): AnonymousResourceCollection
    {
        abort_unless(
            $request->user()->hasAnyRole(['admin', 'gestor']),
            403
        );

        return FeedbackResource::collection(
            $this->feedback->forTeam($request->user())
        );
    }

    public function store(CreateFeedbackRequest $request): FeedbackResource
    {
        return new FeedbackResource(
            $this->feedback->create($request->user(), $request->validated())
        );
    }

    public function destroy(Request $request, PointwiseFeedback $pointwiseFeedback): JsonResponse
    {
        $this->authorize('delete', $pointwiseFeedback);

        $pointwiseFeedback->delete();

        return response()->json(['message' => 'Feedback removido.']);
    }
}

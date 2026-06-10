<?php

namespace Src\SmartForm\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\SmartForm\Models\SmartForm;
use Src\SmartForm\Requests\CreateSmartFormRequest;
use Src\SmartForm\Requests\SubmitFormResponseRequest;
use Src\SmartForm\Resources\SmartFormResource;
use Src\SmartForm\Resources\SmartFormResponseResource;
use Src\SmartForm\Services\SmartFormResponseService;
use Src\SmartForm\Services\SmartFormService;

class SmartFormController extends Controller
{
    public function __construct(
        private readonly SmartFormService $forms,
        private readonly SmartFormResponseService $responses,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return SmartFormResource::collection(
            $this->forms->forUser($request->user(), $request->input('category'))
        );
    }

    public function store(CreateSmartFormRequest $request): SmartFormResource
    {
        $this->authorize('create', SmartForm::class);

        return new SmartFormResource(
            $this->forms->create($request->validated())
        );
    }

    public function show(SmartForm $smartForm): SmartFormResource
    {
        return new SmartFormResource($smartForm);
    }

    public function update(CreateSmartFormRequest $request, SmartForm $smartForm): SmartFormResource
    {
        $this->authorize('update', $smartForm);

        return new SmartFormResource(
            $this->forms->update($smartForm, $request->validated())
        );
    }

    public function destroy(SmartForm $smartForm): JsonResponse
    {
        $this->authorize('delete', $smartForm);

        $smartForm->delete();

        return response()->json(['message' => 'Formulário removido.']);
    }

    public function storeResponse(SubmitFormResponseRequest $request, SmartForm $smartForm): SmartFormResponseResource
    {
        return new SmartFormResponseResource(
            $this->responses->submit(
                $smartForm,
                $request->user(),
                $request->array('responses'),
                $request->input('assigned_to'),
            )
        );
    }

    public function indexResponses(Request $request, SmartForm $smartForm): AnonymousResourceCollection
    {
        $this->authorize('viewResponses', $smartForm);

        return SmartFormResponseResource::collection(
            $this->responses->forForm($smartForm, $request->user())
        );
    }

    public function aggregate(SmartForm $smartForm): JsonResponse
    {
        $this->authorize('viewResponses', $smartForm);

        return response()->json(
            $this->responses->aggregate($smartForm)
        );
    }
}

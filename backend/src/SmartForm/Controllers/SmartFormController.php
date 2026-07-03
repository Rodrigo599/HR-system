<?php

namespace Src\SmartForm\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Src\SmartForm\Enums\SmartFormCategory;
use Src\SmartForm\Models\SmartForm;
use Src\SmartForm\Requests\CreateSmartFormRequest;
use Src\SmartForm\Requests\UpdateSmartFormRequest;
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

        return SmartFormResource::make($this->forms->create($request->validated()));
    }

    public function show(SmartForm $smartForm): SmartFormResource
    {
        return SmartFormResource::make($smartForm);
    }

    public function update(UpdateSmartFormRequest $request, SmartForm $smartForm): SmartFormResource
    {
        $this->authorize('update', $smartForm);

        return SmartFormResource::make(
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
        return SmartFormResponseResource::make(
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

        // Feedback de clima é anônimo: a lista individual (que expõe quem respondeu)
        // fica restrita ao admin/RH para auditoria. Gestor acompanha pela visão
        // agregada (/aggregate), que já respeita o piso de anonimato k>=3.
        if ($smartForm->category === SmartFormCategory::Feedback && ! $request->user()->hasRole('admin')) {
            abort(403, 'Respostas de clima são anônimas. Use a visão agregada.');
        }

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

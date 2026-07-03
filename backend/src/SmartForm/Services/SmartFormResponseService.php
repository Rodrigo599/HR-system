<?php

namespace Src\SmartForm\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\Organization\Services\HierarchyService;
use Src\SmartForm\Models\SmartForm;
use Src\SmartForm\Models\SmartFormResponse;

class SmartFormResponseService
{
    /** Anonimato mínimo: não revela agregado de clima com menos de K respostas. */
    private const MIN_ANONIMATO = 3;

    public function __construct(private readonly HierarchyService $hierarchy) {}

    public function submit(SmartForm $form, User $user, array $responses, ?string $assignedTo): SmartFormResponse
    {
        return SmartFormResponse::create([
            'form_id' => $form->id,
            'form_slug' => $form->slug,
            'user_id' => $user->id,
            'assigned_to' => $assignedTo,
            'assigned_by' => $assignedTo ? $user->id : null,
            'responses' => $responses,
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    public function forForm(SmartForm $form, User $requester): Collection
    {
        $query = SmartFormResponse::where('form_id', $form->id)->with('user.profile');

        if ($requester->hasRole('admin')) {
            // admin vê todas
        } elseif ($requester->hasRole('gestor')) {
            // gestor vê só as respostas do próprio time (PRD 3.7 "Ver respostas do time")
            $query->whereIn('user_id', $this->hierarchy->getTeamUserIds($requester));
        } else {
            $query->where('user_id', $requester->id);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function aggregate(SmartForm $form): array
    {
        $responses = SmartFormResponse::where('form_id', $form->id)
            ->where('status', 'completed')
            ->pluck('responses');

        $totals = [];
        $counts = [];

        foreach ($responses as $response) {
            foreach ($response as $key => $value) {
                if (is_numeric($value)) {
                    $totals[$key] = ($totals[$key] ?? 0) + $value;
                    $counts[$key] = ($counts[$key] ?? 0) + 1;
                }
            }
        }

        $count = $responses->count();

        // Anonimato: com menos de K respostas, a "média" revelaria a resposta
        // individual de quem respondeu. Não expõe os números nesse caso.
        if ($count < self::MIN_ANONIMATO) {
            return [
                'total_responses' => $count,
                'averages' => [],
                'insufficient' => true,
                'min_required' => self::MIN_ANONIMATO,
            ];
        }

        $averages = [];
        foreach ($totals as $key => $total) {
            $averages[$key] = (float) round($total / $counts[$key], 2);
        }

        return [
            'total_responses' => $count,
            'averages' => $averages,
            'insufficient' => false,
        ];
    }
}

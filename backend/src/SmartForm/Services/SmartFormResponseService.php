<?php

namespace Src\SmartForm\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\SmartForm\Models\SmartForm;
use Src\SmartForm\Models\SmartFormResponse;

class SmartFormResponseService
{
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
        return SmartFormResponse::where('form_id', $form->id)
            ->when(
                ! $requester->hasAnyRole(['admin', 'gestor']),
                fn ($q) => $q->where('user_id', $requester->id)
            )
            ->with('user.profile')
            ->orderByDesc('created_at')
            ->get();
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

        $averages = [];
        foreach ($totals as $key => $total) {
            $averages[$key] = round($total / $counts[$key], 2);
        }

        return [
            'total_responses' => $responses->count(),
            'averages' => $averages,
        ];
    }
}

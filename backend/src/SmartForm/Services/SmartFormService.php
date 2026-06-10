<?php

namespace Src\SmartForm\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Src\SmartForm\Enums\SmartFormStatus;
use Src\SmartForm\Models\SmartForm;

class SmartFormService
{
    public function forUser(User $user, ?string $category = null): Collection
    {
        $sectorId = $user->profile?->sector_id;
        $isPrivileged = $user->hasAnyRole(['admin', 'gestor', 'analista']);

        return SmartForm::when(!$isPrivileged, fn ($q) => $q->where('status', SmartFormStatus::Active))
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when(!$isPrivileged, fn ($q) => $q->where(fn ($q) => $q
                ->whereNull('sector_id')
                ->orWhere('sector_id', $sectorId)
            ))
            ->get();
    }

    public function create(array $data): SmartForm
    {
        return SmartForm::create($data);
    }

    public function update(SmartForm $form, array $data): SmartForm
    {
        $form->update($data);
        return $form->fresh();
    }
}

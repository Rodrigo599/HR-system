<?php

namespace Src\Organization\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Src\Organization\Models\Dependent;
use Src\Organization\Models\Profile;

class DependentService
{
    public function __construct(private readonly HierarchyService $hierarchy) {}

    /** Perfis que o usuário pode enxergar (próprio + time se gestor, tudo se admin). */
    private function visibleProfileIds(User $user): array
    {
        if ($user->hasRole('admin')) {
            return Profile::pluck('id')->all();
        }

        $ids = [$user->profile->id];

        if ($user->hasRole('gestor')) {
            $ids = array_merge(
                $ids,
                Profile::where('manager_id', $user->profile->id)->pluck('id')->all()
            );
        }

        return $ids;
    }

    public function forUser(User $user): Collection
    {
        return Dependent::whereIn('profile_id', $this->visibleProfileIds($user))
            ->with('profile')
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): Dependent
    {
        return Dependent::create($data);
    }

    public function update(Dependent $dependent, array $data): Dependent
    {
        $dependent->update($data);

        return $dependent->fresh();
    }

    /**
     * Aniversários nos próximos $dias, do escopo visível ao usuário.
     * Inclui os próprios colaboradores (profiles.birth_date) e seus dependentes.
     */
    public function upcomingBirthdays(User $user, int $dias = 30): array
    {
        $profileIds = $this->visibleProfileIds($user);
        $hoje = Carbon::today();

        $items = [];

        $profiles = Profile::whereIn('id', $profileIds)
            ->whereNotNull('birth_date')
            ->get();
        foreach ($profiles as $p) {
            $items[] = ['name' => $p->full_name, 'birth_date' => $p->birth_date, 'type' => 'colaborador', 'relationship' => null];
        }

        $deps = Dependent::whereIn('profile_id', $profileIds)
            ->with('profile')
            ->get();
        foreach ($deps as $d) {
            $items[] = ['name' => $d->name, 'birth_date' => $d->birth_date, 'type' => 'dependente', 'relationship' => $d->relationship, 'of' => $d->profile?->full_name];
        }

        $result = [];
        foreach ($items as $item) {
            /** @var Carbon $bd */
            $bd = $item['birth_date'];
            $next = Carbon::create($hoje->year, $bd->month, $bd->day);
            if ($next->lessThan($hoje)) {
                $next = $next->addYear();
            }
            $diff = $hoje->diffInDays($next);
            if ($diff <= $dias) {
                $result[] = [
                    'name' => $item['name'],
                    'date' => $next->format('Y-m-d'),
                    'days_until' => $diff,
                    'type' => $item['type'],
                    'relationship' => $item['relationship'],
                    'of' => $item['of'] ?? null,
                ];
            }
        }

        usort($result, fn ($a, $b) => $a['days_until'] <=> $b['days_until']);

        return $result;
    }
}

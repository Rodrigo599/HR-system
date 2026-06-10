<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Src\Evaluation\Models\Evaluation;
use Src\Evaluation\Policies\EvaluationPolicy;
use Src\KPI\Models\Kpi;
use Src\KPI\Policies\KpiPolicy;
use Src\Organization\Models\Profile;
use Src\Organization\Observers\UserObserver;
use Src\Organization\Policies\ProfilePolicy;
use Src\Organization\Policies\UserPolicy;
use Src\PDI\Models\Pdi;
use Src\PDI\Models\PdiTask;
use Src\PDI\Policies\PdiPolicy;
use Src\SmartForm\Models\SmartForm;
use Src\SmartForm\Policies\SmartFormPolicy;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        User::observe(UserObserver::class);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Profile::class, ProfilePolicy::class);
        Gate::policy(Evaluation::class, EvaluationPolicy::class);
        Gate::policy(Kpi::class, KpiPolicy::class);
        Gate::policy(Pdi::class, PdiPolicy::class);
        Gate::policy(PdiTask::class, PdiPolicy::class);
        Gate::policy(SmartForm::class, SmartFormPolicy::class);

        Gate::define('create-sector', fn (User $user) => $user->hasRole('admin'));
        Gate::define('update-sector', fn (User $user) => $user->hasRole('admin'));
        Gate::define('delete-sector', fn (User $user) => $user->hasRole('admin'));
    }
}

<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Src\Content\Models\ContentAssignment;
use Src\Content\Models\ContentItem;
use Src\Content\Policies\ContentPolicy;
use Src\Evaluation\Models\Evaluation;
use Src\Evaluation\Policies\EvaluationPolicy;
use Src\Feedback\Models\PointwiseFeedback;
use Src\Feedback\Policies\FeedbackPolicy;
use Src\KPI\Models\Kpi;
use Src\KPI\Policies\KpiPolicy;
use Src\OneOnOne\Models\OneOnOne;
use Src\OneOnOne\Policies\OneOnOnePolicy;
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
        Factory::guessFactoryNamesUsing(function (string $modelName) {
            $module = collect(explode('\\', $modelName))
                ->filter(fn ($s) => $s !== 'Src' && $s !== 'Models')
                ->values()
                ->join('\\');

            return "Database\\Factories\\{$module}Factory";
        });

        User::observe(UserObserver::class);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Profile::class, ProfilePolicy::class);
        Gate::policy(Evaluation::class, EvaluationPolicy::class);
        Gate::policy(Kpi::class, KpiPolicy::class);
        Gate::policy(Pdi::class, PdiPolicy::class);
        Gate::policy(PdiTask::class, PdiPolicy::class);
        Gate::policy(SmartForm::class, SmartFormPolicy::class);
        Gate::policy(PointwiseFeedback::class, FeedbackPolicy::class);
        Gate::policy(OneOnOne::class, OneOnOnePolicy::class);
        Gate::policy(ContentItem::class, ContentPolicy::class);
        Gate::policy(ContentAssignment::class, ContentPolicy::class);

        Gate::define('create-sector', fn (User $user) => $user->hasRole('admin'));
        Gate::define('update-sector', fn (User $user) => $user->hasRole('admin'));
        Gate::define('delete-sector', fn (User $user) => $user->hasRole('admin'));
    }
}

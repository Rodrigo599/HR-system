<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Src\Organization\Models\Profile;
use Src\Organization\Models\Sector;
use Src\Organization\Observers\UserObserver;
use Src\Organization\Policies\ProfilePolicy;
use Src\Organization\Policies\UserPolicy;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        User::observe(UserObserver::class);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Profile::class, ProfilePolicy::class);

        // Sector: somente admin gerencia
        Gate::define('create-sector', fn (User $user) => $user->hasRole('admin'));
        Gate::define('update-sector', fn (User $user) => $user->hasRole('admin'));
        Gate::define('delete-sector', fn (User $user) => $user->hasRole('admin'));
    }
}

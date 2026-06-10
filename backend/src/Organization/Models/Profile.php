<?php

namespace Src\Organization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'email', 'full_name', 'avatar_url',
        'sector_id', 'manager_id', 'preferred_language', 'active',
    ];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'manager_id');
    }

    public function directReports(): HasMany
    {
        return $this->hasMany(Profile::class, 'manager_id');
    }

    public function dependents(): HasMany
    {
        return $this->hasMany(Dependent::class);
    }
}

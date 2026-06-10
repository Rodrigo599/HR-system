<?php

namespace Src\OneOnOne\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OneOnOne extends Model
{
    use HasUuids;

    protected $fillable = [
        'manager_id', 'report_id', 'scheduled_at',
        'recurrence_rule', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return ['scheduled_at' => 'datetime'];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'manager_id');
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'report_id');
    }

    public function topics(): HasMany
    {
        return $this->hasMany(OneOnOneTopic::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(OneOnOneNote::class);
    }
}

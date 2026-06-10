<?php

namespace Src\OneOnOne\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Src\OneOnOne\Enums\RecurrenceRule;

class OneOnOne extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'manager_id', 'report_id', 'scheduled_at',
        'recurrence_rule', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'recurrence_rule' => RecurrenceRule::class,
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(User::class, 'report_id');
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

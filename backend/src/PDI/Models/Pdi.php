<?php

namespace Src\PDI\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pdi extends Model
{
    use HasUuids;

    protected $table = 'pdis';

    protected $fillable = ['user_id', 'title', 'description', 'start_date', 'end_date'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(PdiTask::class);
    }
}

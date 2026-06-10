<?php

namespace Src\KPI\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiResult extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['kpi_id', 'user_id', 'score', 'month', 'year'];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function kpi(): BelongsTo
    {
        return $this->belongsTo(Kpi::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}

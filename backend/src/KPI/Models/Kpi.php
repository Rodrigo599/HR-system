<?php

namespace Src\KPI\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Src\Organization\Models\Sector;

class Kpi extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'description', 'target_value', 'unit'];

    protected function casts(): array
    {
        return ['target_value' => 'decimal:2'];
    }

    public function sectors(): BelongsToMany
    {
        return $this->belongsToMany(Sector::class, 'kpi_sectors');
    }

    public function results(): HasMany
    {
        return $this->hasMany(KpiResult::class);
    }
}

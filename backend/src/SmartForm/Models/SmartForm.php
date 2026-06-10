<?php

namespace Src\SmartForm\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Src\Organization\Models\Sector;
use Src\SmartForm\Enums\SmartFormCategory;
use Src\SmartForm\Enums\SmartFormStatus;

class SmartForm extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'slug', 'config', 'status', 'category', 'sector_id'];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'status' => SmartFormStatus::class,
            'category' => SmartFormCategory::class,
        ];
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SmartFormResponse::class, 'form_id');
    }
}

<?php

namespace Src\Content\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Src\Content\Enums\ContentType;

class ContentItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'created_by', 'type', 'title', 'description',
        'link_url', 'file_url', 'due_date',
    ];

    protected function casts(): array
    {
        return [
            'type' => ContentType::class,
            'due_date' => 'date',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ContentAssignment::class, 'item_id');
    }
}

<?php

namespace Src\Content\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Src\Content\Enums\ContentStatus;

class ContentAssignment extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['item_id', 'user_id', 'status', 'seen_at', 'completed_at'];

    protected function casts(): array
    {
        return [
            'status' => ContentStatus::class,
            'seen_at' => 'datetime',
            'completed_at' => 'datetime',
            'assigned_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class, 'item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}

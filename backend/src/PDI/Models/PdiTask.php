<?php

namespace Src\PDI\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Src\PDI\Enums\PdiTaskStatus;

class PdiTask extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pdi_id', 'title', 'description', 'link', 'completed',
        'due_date', 'status', 'reviewer_id', 'review_comment', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'due_date' => 'date',
            'status' => PdiTaskStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function pdi(): BelongsTo
    {
        return $this->belongsTo(Pdi::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewer_id');
    }
}

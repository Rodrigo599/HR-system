<?php

namespace Src\Feedback\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Src\Feedback\Enums\FeedbackType;
use Src\Feedback\Enums\FeedbackVisibility;

class PointwiseFeedback extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = ['from_user_id', 'to_user_id', 'type', 'content', 'visibility'];

    protected function casts(): array
    {
        return [
            'type' => FeedbackType::class,
            'visibility' => FeedbackVisibility::class,
            'created_at' => 'datetime',
        ];
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'to_user_id');
    }
}

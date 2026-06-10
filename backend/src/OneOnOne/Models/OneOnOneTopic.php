<?php

namespace Src\OneOnOne\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OneOnOneTopic extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['one_on_one_id', 'author_user_id', 'content', 'addressed'];

    protected function casts(): array
    {
        return [
            'addressed' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function oneOnOne(): BelongsTo
    {
        return $this->belongsTo(OneOnOne::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'author_user_id');
    }
}

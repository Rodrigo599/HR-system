<?php

namespace Src\Organization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Src\Organization\Enums\AppRole;

class UserRole extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = ['user_id', 'role'];

    protected function casts(): array
    {
        return [
            'role' => AppRole::class,
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}

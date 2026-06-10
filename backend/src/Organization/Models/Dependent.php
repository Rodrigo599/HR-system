<?php

namespace Src\Organization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dependent extends Model
{
    use HasUuids;

    protected $fillable = ['profile_id', 'name', 'birth_date', 'relationship', 'consent'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'consent' => 'boolean',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}

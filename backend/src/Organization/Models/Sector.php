<?php

namespace Src\Organization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sector extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'description'];

    public function profiles(): HasMany
    {
        return $this->hasMany(Profile::class);
    }
}

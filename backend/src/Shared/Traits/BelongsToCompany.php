<?php

namespace Src\Shared\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::addGlobalScope('company', function (Builder $query) {
            if ($companyId = app('current_company_id')) {
                $query->where(static::getModel()->getTable() . '.company_id', $companyId);
            }
        });
    }
}

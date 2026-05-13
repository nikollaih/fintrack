<?php

namespace App\Models\Concerns;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            if (tenancy()->initialized) {
                $builder->where(
                    (new static())->qualifyColumn('tenant_id'),
                    tenancy()->tenant->id
                );
            }
        });

        static::creating(function ($model): void {
            if (tenancy()->initialized && empty($model->tenant_id)) {
                $model->tenant_id = tenancy()->tenant->id;
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

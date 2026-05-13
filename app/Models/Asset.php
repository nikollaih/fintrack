<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'type',
        'name',
        'initial_balance',
        'start_date',
        'compounding_frequency',
        'rate_ea',
        'maturity_date',
        'notes',
    ];

    protected $casts = [
        'initial_balance'       => 'decimal:4',
        'rate_ea'               => 'decimal:6',
        'start_date'            => 'date',
        'maturity_date'         => 'date',
    ];

    public function movements(): HasMany
    {
        return $this->hasMany(AssetMovement::class)->orderBy('date');
    }

    public function balanceCache(): HasOne
    {
        return $this->hasOne(AssetBalanceCache::class);
    }
}

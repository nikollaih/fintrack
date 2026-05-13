<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class AssetBalanceCache extends Model
{
    use BelongsToTenant;
    use HasUuids;

    protected $table = 'asset_balance_cache';

    protected $fillable = [
        'tenant_id',
        'asset_id',
        'balance',
        'interest_earned',
        'computed_at',
    ];

    protected $casts = [
        'balance'         => 'decimal:4',
        'interest_earned' => 'decimal:4',
        'computed_at'     => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiabilitySimulation extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'liability_id',
        'name',
        'extra_monthly_payment',
        'lump_sum_amount',
        'lump_sum_date',
        'resulting_payoff_date',
        'resulting_total_interest',
        'resulting_months_saved',
        'created_at',
    ];

    protected $casts = [
        'extra_monthly_payment'    => 'decimal:4',
        'lump_sum_amount'          => 'decimal:4',
        'lump_sum_date'            => 'date',
        'resulting_payoff_date'    => 'date',
        'resulting_total_interest' => 'decimal:4',
        'resulting_months_saved'   => 'integer',
        'created_at'               => 'datetime',
    ];

    public function liability(): BelongsTo
    {
        return $this->belongsTo(Liability::class);
    }
}

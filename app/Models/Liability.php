<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Liability extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'status',
        'original_amount',
        'outstanding_balance',
        'annual_interest_rate',
        'term_months',
        'start_date',
        'first_payment_date',
        'monthly_payment',
        'payment_day',
        'linked_account_id',
        'early_payment_penalty_rate',
        'notes',
        'estimated_property_value',
    ];

    protected $casts = [
        'original_amount'            => 'decimal:4',
        'outstanding_balance'        => 'decimal:4',
        'annual_interest_rate'       => 'decimal:4',
        'monthly_payment'            => 'decimal:4',
        'early_payment_penalty_rate' => 'decimal:4',
        'estimated_property_value'   => 'decimal:4',
        'start_date'                 => 'date',
        'first_payment_date'         => 'date',
        'term_months'                => 'integer',
        'payment_day'                => 'integer',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(LiabilityPayment::class)->orderBy('payment_date');
    }

    public function simulations(): HasMany
    {
        return $this->hasMany(LiabilitySimulation::class)->orderByDesc('created_at');
    }

    public function linkedAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'linked_account_id');
    }

    public function isMortgage(): bool
    {
        return $this->type === 'mortgage';
    }

    public function isCooperativeLoan(): bool
    {
        return $this->type === 'cooperative_loan';
    }

    /** Effective monthly rate (cooperative uses EA, others use nominal/12). */
    public function monthlyRate(): float
    {
        $annual = (float) $this->annual_interest_rate;

        if ($this->isCooperativeLoan()) {
            return pow(1 + $annual, 1 / 12) - 1;
        }

        return $annual / 12;
    }
}

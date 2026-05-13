<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RetirementPlan extends Model
{
    use BelongsToTenant;
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'current_age',
        'target_retirement_age',
        'expected_monthly_expense_at_retirement',
        'life_expectancy',
        'expected_annual_inflation_rate',
        'expected_portfolio_return_rate',
        'expected_retirement_return_rate',
        'monthly_contribution',
        'include_agro_income',
        'agro_monthly_equivalent',
        'notes',
    ];

    protected $casts = [
        'current_age'                             => 'integer',
        'target_retirement_age'                   => 'integer',
        'expected_monthly_expense_at_retirement'  => 'decimal:4',
        'life_expectancy'                         => 'integer',
        'expected_annual_inflation_rate'          => 'decimal:4',
        'expected_portfolio_return_rate'          => 'decimal:4',
        'expected_retirement_return_rate'         => 'decimal:4',
        'monthly_contribution'                    => 'decimal:4',
        'include_agro_income'                     => 'boolean',
        'agro_monthly_equivalent'                 => 'decimal:4',
    ];

    public function getYearsToRetirementAttribute(): int
    {
        return $this->target_retirement_age - $this->current_age;
    }

    public function getRetirementYearsAttribute(): int
    {
        return $this->life_expectancy - $this->target_retirement_age;
    }

    public function getTotalMonthlyContributionAttribute(): float
    {
        $base = (float) $this->monthly_contribution;
        if ($this->include_agro_income && $this->agro_monthly_equivalent) {
            $base += (float) $this->agro_monthly_equivalent;
        }
        return $base;
    }
}

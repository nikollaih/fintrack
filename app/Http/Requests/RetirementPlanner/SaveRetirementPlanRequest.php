<?php

namespace App\Http\Requests\RetirementPlanner;

use Illuminate\Foundation\Http\FormRequest;

class SaveRetirementPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_age'                            => ['required', 'integer', 'min:18', 'max:80'],
            'target_retirement_age'                  => ['required', 'integer', 'min:40', 'max:90', 'gt:current_age'],
            'expected_monthly_expense_at_retirement' => ['required', 'numeric', 'min:100000'],
            'life_expectancy'                        => ['required', 'integer', 'min:70', 'max:100', 'gt:target_retirement_age'],
            'expected_annual_inflation_rate'         => ['required', 'numeric', 'min:0.01', 'max:0.30'],
            'expected_portfolio_return_rate'         => ['required', 'numeric', 'min:0.01', 'max:0.40'],
            'expected_retirement_return_rate'        => ['required', 'numeric', 'min:0.01', 'max:0.30'],
            'monthly_contribution'                   => ['required', 'numeric', 'min:0'],
            'include_agro_income'                    => ['boolean'],
            'agro_monthly_equivalent'                => ['nullable', 'numeric', 'min:0'],
            'notes'                                  => ['nullable', 'string'],
        ];
    }
}

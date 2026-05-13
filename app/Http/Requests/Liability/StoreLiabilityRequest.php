<?php

namespace App\Http\Requests\Liability;

use Illuminate\Foundation\Http\FormRequest;

class StoreLiabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                        => 'required|string|max:255',
            'type'                        => 'required|in:mortgage,personal_loan,vehicle_loan,credit_card_loan,cooperative_loan,other',
            'status'                      => 'sometimes|in:active,paid_off,refinanced',
            'original_amount'             => 'required|numeric|min:0',
            'outstanding_balance'         => 'required|numeric|min:0',
            'annual_interest_rate'        => 'required|numeric|min:0|max:1',
            'term_months'                 => 'required|integer|min:1',
            'start_date'                  => 'required|date',
            'first_payment_date'          => 'required|date',
            'monthly_payment'             => 'required|numeric|min:0',
            'payment_day'                 => 'required|integer|min:1|max:28',
            'linked_account_id'           => 'nullable|uuid|exists:accounts,id',
            'early_payment_penalty_rate'  => 'nullable|numeric|min:0|max:1',
            'notes'                       => 'nullable|string',
            'estimated_property_value'    => 'nullable|numeric|min:0',
        ];
    }
}

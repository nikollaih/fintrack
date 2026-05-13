<?php

namespace App\Http\Requests\Liability;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLiabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                        => 'sometimes|required|string|max:255',
            'type'                        => 'sometimes|required|in:mortgage,personal_loan,vehicle_loan,credit_card_loan,cooperative_loan,other',
            'status'                      => 'sometimes|required|in:active,paid_off,refinanced',
            'original_amount'             => 'sometimes|required|numeric|min:0',
            'outstanding_balance'         => 'sometimes|required|numeric|min:0',
            'annual_interest_rate'        => 'sometimes|required|numeric|min:0|max:1',
            'term_months'                 => 'sometimes|required|integer|min:1',
            'start_date'                  => 'sometimes|required|date',
            'first_payment_date'          => 'sometimes|required|date',
            'monthly_payment'             => 'sometimes|required|numeric|min:0',
            'payment_day'                 => 'sometimes|required|integer|min:1|max:28',
            'linked_account_id'           => 'nullable|uuid|exists:accounts,id',
            'early_payment_penalty_rate'  => 'nullable|numeric|min:0|max:1',
            'notes'                       => 'nullable|string',
            'estimated_property_value'    => 'nullable|numeric|min:0',
        ];
    }
}

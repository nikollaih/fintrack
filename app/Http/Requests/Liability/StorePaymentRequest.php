<?php

namespace App\Http\Requests\Liability;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_date'            => 'required|date',
            'total_paid'              => 'required|numeric|min:0',
            'principal_paid'          => 'required|numeric|min:0',
            'interest_paid'           => 'required|numeric|min:0',
            'outstanding_balance_after' => 'required|numeric|min:0',
            'payment_type'            => 'required|in:scheduled,extra_payment,lump_sum_payment',
            'payment_number'          => 'nullable|integer|min:1',
            'create_transaction'      => 'boolean',
            'notes'                   => 'nullable|string',
        ];
    }
}

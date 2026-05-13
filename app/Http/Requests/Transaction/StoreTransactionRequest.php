<?php

namespace App\Http\Requests\Transaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_id' => ['nullable', 'uuid', 'exists:accounts,id'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'amount' => ['required', 'numeric', 'min:0.0001'],
            'description' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'payment_method' => ['nullable', Rule::in(['cash', 'debit', 'credit_card'])],
            'cashback_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ];
    }
}

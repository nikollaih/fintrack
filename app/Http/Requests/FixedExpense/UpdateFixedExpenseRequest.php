<?php

namespace App\Http\Requests\FixedExpense;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFixedExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.0001'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'payment_method' => ['required', Rule::in(['cash', 'debit', 'credit_card'])],
            'expected_day' => ['required', 'integer', 'min:1', 'max:31'],
            'is_active' => ['required', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

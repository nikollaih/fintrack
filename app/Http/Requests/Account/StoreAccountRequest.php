<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['savings', 'checking', 'credit_card', 'cash', 'digital_wallet', 'investment'])],
            'currency' => ['nullable', 'string', 'size:3'],
            'initial_balance' => ['required', 'numeric'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

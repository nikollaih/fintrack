<?php

namespace App\Http\Requests\Transfer;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_account_id' => ['required', 'uuid', 'exists:accounts,id', 'different:to_account_id'],
            'to_account_id' => ['required', 'uuid', 'exists:accounts,id', 'different:from_account_id'],
            'amount' => ['required', 'numeric', 'min:0.0001'],
            'date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_account_id.different' => 'La cuenta origen y destino deben ser diferentes.',
            'to_account_id.different' => 'La cuenta origen y destino deben ser diferentes.',
        ];
    }
}

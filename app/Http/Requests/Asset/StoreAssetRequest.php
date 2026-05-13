<?php

namespace App\Http\Requests\Asset;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'                  => ['required', Rule::in(['cajita', 'cdt', 'cooperativa', 'cash', 'other'])],
            'name'                  => ['required', 'string', 'max:255'],
            'initial_balance'       => ['required', 'numeric'],
            'start_date'            => ['required', 'date'],
            'compounding_frequency' => ['required', Rule::in(['daily', 'monthly', 'at_maturity'])],
            'rate_ea'               => ['nullable', 'numeric', 'min:0', 'max:1'],
            'maturity_date'         => ['nullable', 'date', 'after_or_equal:start_date'],
            'notes'                 => ['nullable', 'string'],
        ];
    }
}

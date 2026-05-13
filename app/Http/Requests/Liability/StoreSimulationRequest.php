<?php

namespace App\Http\Requests\Liability;

use Illuminate\Foundation\Http\FormRequest;

class StoreSimulationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => 'required|string|max:255',
            'extra_monthly_payment'  => 'required|numeric|min:0',
            'lump_sum_amount'        => 'nullable|numeric|min:0',
            'lump_sum_date'          => 'nullable|date',
        ];
    }
}

<?php

namespace App\Http\Requests\CropSale;

use Illuminate\Foundation\Http\FormRequest;

class StoreCropSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cycle_id' => ['required', 'uuid', 'exists:crop_cycles,id'],
            'buyer_id' => ['nullable', 'uuid', 'exists:buyers,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit' => ['required', 'string', 'max:50'],
            'unit_price' => ['required', 'numeric', 'min:0.0001'],
            'sale_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

<?php

namespace App\Http\Requests\Asset;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => ['required', 'uuid', 'exists:assets,id'],
            'date'     => ['required', 'date'],
            'amount'   => ['required', 'numeric', 'not_in:0'],
            'note'     => ['nullable', 'string'],
        ];
    }
}

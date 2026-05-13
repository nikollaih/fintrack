<?php

namespace App\Http\Requests\CropExpense;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCropExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cycle_id' => ['required', 'uuid', 'exists:crop_cycles,id'],
            'supplier_id' => ['nullable', 'uuid', 'exists:suppliers,id'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'phase' => ['required', Rule::in(['preparation', 'sowing', 'maintenance', 'harvest'])],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0.0001'],
            'expense_date' => ['required', 'date'],
        ];
    }
}

<?php

namespace App\Http\Requests\CropCycle;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCropCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_type' => ['required', 'string', 'max:100'],
            'area_sqm' => ['required', 'numeric', 'min:0.01'],
            'location' => ['required', 'string', 'max:255'],
            'sown_at' => ['required', 'date'],
            'expected_harvest_at' => ['nullable', 'date', 'after:sown_at'],
            'harvested_at' => ['nullable', 'date', 'after:sown_at'],
            'status' => ['required', Rule::in(['planned', 'active', 'harvested', 'failed'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}

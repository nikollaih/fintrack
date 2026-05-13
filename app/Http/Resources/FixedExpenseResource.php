<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FixedExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $check = $this->checks->first();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'amount' => (float) $this->amount,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('categoryModel', fn () => new CategoryResource($this->categoryModel)),
            'category_text' => $this->category,
            'payment_method' => $this->payment_method,
            'expected_day' => $this->expected_day,
            'is_active' => $this->is_active,
            'notes' => $this->notes,
            'check' => $check ? new FixedExpenseCheckResource($check) : null,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cycle_id' => $this->cycle_id,
            'supplier_id' => $this->supplier_id,
            'supplier' => $this->whenLoaded('supplier', fn () => new SupplierResource($this->supplier)),
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('categoryModel', fn () => new CategoryResource($this->categoryModel)),
            'category_text' => $this->category,
            'phase' => $this->phase,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            'expense_date' => $this->expense_date->toDateString(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropCycleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalExpenses = $this->whenLoaded('expenses', fn () => $this->expenses->sum('amount'), null);
        $totalRevenue = $this->whenLoaded('sales', fn () => $this->sales->sum(fn ($s) => $s->quantity * $s->unit_price), null);

        return [
            'id' => $this->id,
            'crop_type' => $this->crop_type,
            'area_sqm' => (float) $this->area_sqm,
            'location' => $this->location,
            'sown_at' => $this->sown_at->toDateString(),
            'expected_harvest_at' => $this->expected_harvest_at?->toDateString(),
            'harvested_at' => $this->harvested_at?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'expenses' => CropExpenseResource::collection($this->whenLoaded('expenses')),
            'sales' => CropSaleResource::collection($this->whenLoaded('sales')),
            'total_expenses' => $totalExpenses !== null ? (float) $totalExpenses : null,
            'total_revenue' => $totalRevenue !== null ? (float) $totalRevenue : null,
            'profit' => ($totalExpenses !== null && $totalRevenue !== null)
                ? (float) ($totalRevenue - $totalExpenses)
                : null,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}

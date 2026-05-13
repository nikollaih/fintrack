<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropSaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cycle_id' => $this->cycle_id,
            'buyer_id' => $this->buyer_id,
            'buyer' => $this->whenLoaded('buyer', fn () => new BuyerResource($this->buyer)),
            'quantity' => (float) $this->quantity,
            'unit' => $this->unit,
            'unit_price' => (float) $this->unit_price,
            'total' => (float) ($this->quantity * $this->unit_price),
            'sale_date' => $this->sale_date->toDateString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

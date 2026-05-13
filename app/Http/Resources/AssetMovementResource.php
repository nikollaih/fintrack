<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'asset_id'   => $this->asset_id,
            'date'       => $this->date->toDateString(),
            'amount'     => (float) $this->amount,
            'note'       => $this->note,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

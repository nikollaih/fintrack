<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_account_id' => $this->from_account_id,
            'from_account' => $this->whenLoaded('fromAccount', fn () => [
                'id' => $this->fromAccount->id,
                'name' => $this->fromAccount->name,
                'type' => $this->fromAccount->type,
            ]),
            'to_account_id' => $this->to_account_id,
            'to_account' => $this->whenLoaded('toAccount', fn () => [
                'id' => $this->toAccount->id,
                'name' => $this->toAccount->name,
                'type' => $this->toAccount->type,
            ]),
            'amount' => (float) $this->amount,
            'date' => $this->date->toDateString(),
            'description' => $this->description,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

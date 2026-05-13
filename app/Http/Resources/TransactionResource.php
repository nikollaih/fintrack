<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'account' => $this->whenLoaded('account', fn () => [
                'id' => $this->account->id,
                'name' => $this->account->name,
                'type' => $this->account->type,
            ]),
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('categoryModel', fn () => new CategoryResource($this->categoryModel)),
            'category_text' => $this->category,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'date' => $this->date->toDateString(),
            'payment_method' => $this->payment_method,
            'cashback_rate' => (float) $this->cashback_rate,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

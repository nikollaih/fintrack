<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class AssetResource extends JsonResource
{
    // These are set by the controller before returning the resource
    public ?float $computed_balance           = null;
    public ?float $computed_interest_earned   = null;
    public ?float $computed_interest_this_month = null;
    public ?float $computed_maturity_value    = null;

    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'type'                 => $this->type,
            'name'                 => $this->name,
            'initial_balance'      => (float) $this->initial_balance,
            'start_date'           => $this->start_date->toDateString(),
            'rate_ea'              => $this->rate_ea ? (float) $this->rate_ea : null,
            'compounding_frequency' => $this->compounding_frequency,
            'maturity_date'        => $this->maturity_date?->toDateString(),
            'notes'                => $this->notes,
            // Computed fields set by the controller
            'balance'              => $this->computed_balance,
            'interest_earned'      => $this->computed_interest_earned,
            'interest_this_month'  => $this->computed_interest_this_month,
            'maturity_value'       => $this->computed_maturity_value,
            'days_to_maturity'     => $this->maturity_date
                ? max(0, (int) Carbon::today()->diffInDays($this->maturity_date, false))
                : null,
            'created_at'           => $this->created_at->toISOString(),
            'updated_at'           => $this->updated_at->toISOString(),
        ];
    }
}

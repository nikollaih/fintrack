<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RetirementSnapshot extends Model
{
    use BelongsToTenant;
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'snapshot_date',
        'total_portfolio_value',
        'required_corpus',
        'gap',
        'projected_retirement_age',
        'on_track',
    ];

    protected $casts = [
        'snapshot_date'          => 'date',
        'total_portfolio_value'  => 'decimal:4',
        'required_corpus'        => 'decimal:4',
        'gap'                    => 'decimal:4',
        'projected_retirement_age' => 'integer',
        'on_track'               => 'boolean',
    ];
}

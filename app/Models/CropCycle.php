<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class CropCycle extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'crop_type',
        'area_sqm',
        'location',
        'sown_at',
        'expected_harvest_at',
        'harvested_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'area_sqm' => 'decimal:2',
        'sown_at' => 'date',
        'expected_harvest_at' => 'date',
        'harvested_at' => 'date',
    ];

    public function expenses(): HasMany
    {
        return $this->hasMany(CropExpense::class, 'cycle_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(CropSale::class, 'cycle_id');
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'icon',
        'color',
        'is_predefined',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_predefined' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}

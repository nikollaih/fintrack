<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use BelongsToTenant;
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'year',
        'month',
        'status',
        'file_path',
        'file_size',
        'error_message',
    ];

    protected $casts = [
        'year'      => 'integer',
        'month'     => 'integer',
        'file_size' => 'integer',
    ];

    private const MONTH_NAMES = [
        1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
        5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
        9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
    ];

    public function getMonthNameAttribute(): string
    {
        return self::MONTH_NAMES[$this->month] ?? '?';
    }

    public function getLabelAttribute(): string
    {
        return $this->month_name . ' ' . $this->year;
    }

    public function getFileSizeHumanAttribute(): string
    {
        if (! $this->file_size) {
            return '—';
        }
        if ($this->file_size >= 1024 * 1024) {
            return number_format($this->file_size / (1024 * 1024), 1) . ' MB';
        }
        return number_format($this->file_size / 1024, 0) . ' KB';
    }
}

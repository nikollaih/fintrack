<?php

namespace App\Jobs;

use App\Models\Report;
use App\Services\ReportGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateMonthlyReportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 180;
    public int $tries   = 2;

    public function __construct(private readonly Report $report) {}

    public function handle(ReportGeneratorService $service): void
    {
        tenancy()->initialize($this->report->tenant);
        $service->generate($this->report);
    }

    public function failed(\Throwable $e): void
    {
        $this->report->update([
            'status'        => 'failed',
            'error_message' => $e->getMessage(),
        ]);
    }
}

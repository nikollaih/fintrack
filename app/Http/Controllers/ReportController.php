<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Services\ReportGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportGeneratorService $service) {}

    public function index(): Response
    {
        $reports = Report::orderByDesc('year')->orderByDesc('month')->get();

        $reportsData = $reports->map(fn (Report $r): array => [
            'id'              => $r->id,
            'year'            => $r->year,
            'month'           => $r->month,
            'label'           => $r->label,
            'status'          => $r->status,
            'file_size_human' => $r->file_size_human,
            'error_message'   => $r->error_message,
            'created_at'      => $r->created_at->toISOString(),
            'updated_at'      => $r->updated_at->toISOString(),
        ]);

        // Build list of available months (last 24 months, excluding current)
        $availableMonths = [];
        for ($i = 1; $i <= 24; $i++) {
            $d = Carbon::now()->subMonths($i);
            $availableMonths[] = [
                'value' => $d->year . '-' . str_pad($d->month, 2, '0', STR_PAD_LEFT),
                'label' => $d->monthName . ' ' . $d->year,
            ];
        }

        return Inertia::render('Reports/Index', [
            'reports'          => $reportsData,
            'available_months' => $availableMonths,
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $request->validate([
            'month_year' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        [$year, $month] = explode('-', $request->month_year);
        $year  = (int) $year;
        $month = (int) $month;

        // Only past months
        $target = Carbon::create($year, $month, 1);
        if ($target->greaterThanOrEqualTo(Carbon::now()->startOfMonth())) {
            return back()->with('error', 'Solo se pueden generar informes de meses pasados.');
        }

        $report = Report::firstOrCreate(
            ['year' => $year, 'month' => $month],
            ['status' => 'pending']
        );

        if ($report->status === 'generating') {
            return back()->with('warning', 'El informe ya se está generando.');
        }

        // Generate synchronously (fast enough for personal finance data volumes)
        try {
            $this->service->generate($report->fresh());

            return back()->with('success', "Informe de {$report->fresh()->label} generado correctamente.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Error al generar el informe: ' . $e->getMessage());
        }
    }

    public function download(Report $report): StreamedResponse|RedirectResponse
    {
        if ($report->status !== 'completed' || ! $report->file_path) {
            return back()->with('error', 'El informe no está disponible.');
        }

        if (! Storage::exists($report->file_path)) {
            $report->update(['status' => 'failed', 'error_message' => 'Archivo no encontrado en el servidor.']);

            return back()->with('error', 'El archivo fue eliminado. Por favor regenera el informe.');
        }

        $filename = sprintf(
            'informe-financiero-%d-%02d.pdf',
            $report->year,
            $report->month
        );

        return Storage::download($report->file_path, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function destroy(Report $report): RedirectResponse
    {
        if ($report->file_path && Storage::exists($report->file_path)) {
            Storage::delete($report->file_path);
        }

        $report->delete();

        return back()->with('success', 'Informe eliminado.');
    }
}

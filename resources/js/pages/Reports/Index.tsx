import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Report } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/UI/Button';
import Select from '@/components/UI/Select';
import Card, { CardHeader } from '@/components/UI/Card';

interface AvailableMonth {
    value: string;
    label: string;
}

interface Props {
    reports: Report[];
    available_months: AvailableMonth[];
}

const statusConfig: Record<string, { label: string; classes: string }> = {
    pending:    { label: 'Pendiente',   classes: 'bg-gray-100 text-gray-700' },
    generating: { label: 'Generando…', classes: 'bg-blue-100 text-blue-700' },
    completed:  { label: 'Listo',       classes: 'bg-green-100 text-green-700' },
    failed:     { label: 'Error',       classes: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? statusConfig.pending;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.classes}`}>
            {status === 'generating' && (
                <svg className="w-3 h-3 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {cfg.label}
        </span>
    );
}

function ReportRow({ report }: { report: Report }) {
    const [deleting, setDeleting] = useState(false);
    const [regen, setRegen] = useState(false);

    const handleDownload = () => {
        window.location.href = `/reports/${report.id}/download`;
    };

    const handleDelete = () => {
        if (!confirm(`¿Eliminar el informe de ${report.label}?`)) return;
        setDeleting(true);
        router.delete(`/reports/${report.id}`, { onFinish: () => setDeleting(false) });
    };

    const handleRegenerate = () => {
        setRegen(true);
        const [year, month] = [report.year, String(report.month).padStart(2, '0')];
        router.post('/reports/generate', { month_year: `${year}-${month}` }, {
            onFinish: () => setRegen(false),
        });
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 font-semibold text-gray-900">{report.label}</td>
            <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
            <td className="px-4 py-3 text-sm text-gray-500">
                {report.status === 'completed' ? report.file_size_human : '—'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-400">
                {new Date(report.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
            <td className="px-4 py-3">
                {report.status === 'failed' && report.error_message && (
                    <p className="text-xs text-red-600 truncate max-w-xs" title={report.error_message}>
                        {report.error_message}
                    </p>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                    {report.status === 'completed' && (
                        <Button size="sm" onClick={handleDownload}>
                            ↓ Descargar PDF
                        </Button>
                    )}
                    {(report.status === 'failed' || report.status === 'pending') && (
                        <Button size="sm" variant="secondary" onClick={handleRegenerate} loading={regen}>
                            Generar
                        </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={handleDelete} loading={deleting}>
                        ×
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function ReportsIndex({ reports, available_months }: Props) {
    const { data, setData, post, processing } = useForm({ month_year: '' });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.month_year) return;
        post('/reports/generate');
    };

    return (
        <AppLayout title="Informes Financieros Mensuales">
            {/* Generator panel */}
            <Card className="mb-6">
                <CardHeader
                    title="Generar informe"
                    subtitle="Selecciona un mes pasado para generar su informe PDF"
                />
                <form onSubmit={handleGenerate} className="flex gap-3 items-end">
                    <div className="w-64">
                        <Select
                            options={available_months}
                            value={data.month_year}
                            onChange={(e) => setData('month_year', e.target.value)}
                            placeholder="Seleccionar mes..."
                        />
                    </div>
                    <Button type="submit" loading={processing} disabled={!data.month_year}>
                        Generar informe
                    </Button>
                </form>
                <p className="text-xs text-gray-400 mt-3">
                    La generación tarda unos segundos. El PDF incluye ingresos, gastos, activos, cuentas, gastos fijos y análisis automático.
                </p>
            </Card>

            {/* Reports list */}
            <Card>
                <CardHeader title={`Historial (${reports.length} informes)`} />
                {reports.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">
                        Sin informes generados aún. Genera el primero seleccionando un mes.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="px-4 py-3">Período</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Tamaño</th>
                                    <th className="px-4 py-3">Última actualización</th>
                                    <th className="px-4 py-3">Info</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reports.map((r) => (
                                    <ReportRow key={r.id} report={r} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </AppLayout>
    );
}

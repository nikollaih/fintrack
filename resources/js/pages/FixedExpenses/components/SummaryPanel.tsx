import { formatCOP } from '@/utils/currency';
import ProgressBar from '@/components/UI/ProgressBar';

interface SummaryPanelProps {
    total: number;
    paid: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    month: number;
    year: number;
}

const monthNames = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function SummaryPanel({
    total,
    paid,
    totalAmount,
    paidAmount,
    pendingAmount,
    month,
    year,
}: SummaryPanelProps) {
    const progress = total > 0 ? Math.round((paid / total) * 100) : 0;
    const pending = total - paid;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5 sticky top-4">
            <div>
                <h3 className="text-base font-semibold text-gray-900">Resumen del mes</h3>
                <p className="text-sm text-gray-500 mt-0.5">{monthNames[month]} {year}</p>
            </div>

            {/* Progress */}
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Progreso</span>
                    <span className="font-bold text-primary-700">{progress}%</span>
                </div>
                <ProgressBar
                    value={progress}
                    color={progress === 100 ? 'bg-green-500' : 'bg-primary-600'}
                    height="h-3"
                />
                <p className="text-xs text-gray-500 mt-1.5 text-right">
                    {paid} de {total} pagados
                </p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
                <MetricRow
                    label="Total comprometido"
                    value={formatCOP(totalAmount)}
                    valueClass="text-gray-900 font-semibold"
                />
                <MetricRow
                    label={`Pagado (${paid})`}
                    value={`+ ${formatCOP(paidAmount)}`}
                    valueClass="text-green-700 font-semibold"
                    dotColor="bg-green-500"
                />
                <MetricRow
                    label={`Pendiente (${pending})`}
                    value={formatCOP(pendingAmount)}
                    valueClass={pendingAmount > 0 ? 'text-red-700 font-semibold' : 'text-gray-400'}
                    dotColor={pendingAmount > 0 ? 'bg-red-500' : 'bg-gray-300'}
                />
            </div>

            {progress === 100 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600 text-lg">🎉</span>
                    <p className="text-sm font-medium text-green-800">¡Todos los gastos pagados!</p>
                </div>
            )}
        </div>
    );
}

function MetricRow({ label, value, valueClass, dotColor }: {
    label: string;
    value: string;
    valueClass: string;
    dotColor?: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className={`text-sm ${valueClass}`}>{value}</span>
        </div>
    );
}

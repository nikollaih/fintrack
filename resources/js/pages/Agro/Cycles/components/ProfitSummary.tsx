import { CropCycle } from '@/types';
import { formatCOP } from '@/utils/currency';
import { getCycleROI } from '@/utils/calculations';

interface ProfitSummaryProps {
    cycle: CropCycle;
}

export default function ProfitSummary({ cycle }: ProfitSummaryProps) {
    const revenue = cycle.total_revenue ?? 0;
    const expenses = cycle.total_expenses ?? 0;
    const profit = cycle.profit ?? (revenue - expenses);
    const roi = getCycleROI(revenue, expenses);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCell label="Ingresos" value={formatCOP(revenue)} valueClass="text-green-700" />
            <MetricCell label="Gastos" value={formatCOP(expenses)} valueClass="text-red-700" />
            <MetricCell
                label="Ganancia"
                value={formatCOP(profit)}
                valueClass={profit >= 0 ? 'text-green-700' : 'text-red-700'}
            />
            <MetricCell
                label="ROI"
                value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}
                valueClass={roi >= 0 ? 'text-green-700' : 'text-red-700'}
            />
        </div>
    );
}

function MetricCell({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
        </div>
    );
}

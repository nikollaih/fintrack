import { FixedExpensesSummary } from '@/types';
import { formatCOP } from '@/utils/currency';
import ProgressBar from '@/components/UI/ProgressBar';
import { Link } from '@inertiajs/react';

interface FixedExpensesWidgetProps {
    summary: FixedExpensesSummary;
}

export default function FixedExpensesWidget({ summary }: FixedExpensesWidgetProps) {
    const progress = summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">Gastos Fijos</h3>
                <Link href="/fixed-expenses" className="text-sm text-primary-600 hover:underline">
                    Ver checklist →
                </Link>
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">{summary.paid} / {summary.total} pagados</span>
                <span className="font-bold text-primary-700">{progress}%</span>
            </div>

            <ProgressBar
                value={progress}
                color={progress === 100 ? 'bg-green-500' : 'bg-primary-600'}
                height="h-2"
                className="mb-3"
            />

            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-gray-600">Pendiente</span>
                </div>
                <span className="font-semibold text-red-700">{formatCOP(summary.pending_amount)}</span>
            </div>
        </div>
    );
}

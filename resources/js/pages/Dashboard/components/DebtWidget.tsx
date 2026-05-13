import { Link } from '@inertiajs/react';
import { DebtSummary } from '@/types';

interface Props {
    summary: DebtSummary;
}

function cop(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function fmtDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function DebtWidget({ summary }: Props) {
    const { total_debt, monthly_commitment, next_payment_date, next_payment_name, next_payment_amount, active_count } = summary;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                        Pasivos
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">({active_count} activos)</span>
                    </span>
                </div>
                <Link href="/liabilities" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Ver pasivos →
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Deuda Total</p>
                    <p className="text-lg font-bold text-rose-600">{cop(total_debt)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Cuota Mensual</p>
                    <p className="text-lg font-bold text-amber-600">{cop(monthly_commitment)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Próximo Pago</p>
                    {next_payment_date ? (
                        <>
                            <p className="text-sm font-bold text-gray-800">{fmtDate(next_payment_date)}</p>
                            <p className="text-xs text-gray-500 truncate">{next_payment_name}</p>
                            <p className="text-xs font-medium text-gray-700">{cop(next_payment_amount!)}</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400">—</p>
                    )}
                </div>
            </div>
        </div>
    );
}

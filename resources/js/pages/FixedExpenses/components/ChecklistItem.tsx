import { FixedExpense, FixedExpenseCheck } from '@/types';
import { formatCOP } from '@/utils/currency';
import CategoryChip from '@/components/UI/CategoryChip';
import Button from '@/components/UI/Button';
import { Link } from '@inertiajs/react';

interface ChecklistItemProps {
    expense: FixedExpense;
    check: FixedExpenseCheck | null;
    today: number;
    toggling: boolean;
    paying: boolean;
    onToggle: () => void;
    onPay: () => void;
    onEdit: () => void;
}

const methodLabels: Record<string, string> = {
    cash: 'Efectivo',
    debit: 'Débito',
    credit_card: 'T. Crédito',
};

export default function ChecklistItem({
    expense,
    check,
    today,
    toggling,
    paying,
    onToggle,
    onPay,
    onEdit,
}: ChecklistItemProps) {
    const isPaid = check?.is_paid ?? false;
    const isPastDue = !isPaid && today > expense.expected_day;

    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors
            ${isPaid
                ? 'bg-green-50 border-green-200'
                : isPastDue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
            }`}
        >
            {/* Checkbox */}
            <button
                onClick={onToggle}
                disabled={toggling}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${toggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                    ${isPaid
                        ? 'bg-green-500 border-green-500'
                        : isPastDue
                            ? 'border-red-400 hover:border-red-500'
                            : 'border-gray-300 hover:border-primary-500'
                    }`}
                aria-label={isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
            >
                {isPaid && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${isPaid ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {expense.name}
                    </span>
                    <CategoryChip category={expense.category} fallback={expense.category_text} />
                    {isPastDue && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Vencido
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                    Día {expense.expected_day} · {methodLabels[expense.payment_method]}
                </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold ${isPaid ? 'text-green-700' : 'text-gray-900'}`}>
                    {formatCOP(expense.amount)}
                </p>
                {check?.paid_at && (
                    <p className="text-xs text-gray-400">
                        {new Date(check.paid_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
                {check?.transaction_id ? (
                    <Link
                        href="/transactions"
                        className="text-xs text-primary-600 font-medium hover:underline whitespace-nowrap"
                    >
                        Ver transacción →
                    </Link>
                ) : (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onPay}
                        loading={paying}
                        disabled={isPaid && !check?.transaction_id}
                        className="text-xs whitespace-nowrap"
                    >
                        Pagar y registrar
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </Button>
            </div>
        </div>
    );
}

import { Transaction } from '@/types';
import { formatCOP } from '@/utils/currency';
import Badge from '@/components/UI/Badge';
import CategoryChip from '@/components/UI/CategoryChip';
import Button from '@/components/UI/Button';
import { router } from '@inertiajs/react';

interface TransactionRowProps {
    transaction: Transaction;
    onEdit: (t: Transaction) => void;
}

const typeLabels: Record<string, string> = {
    income: 'ingreso',
    expense: 'gasto',
};

const methodLabels: Record<string, string> = {
    cash: 'Efectivo',
    debit: 'Débito',
    credit_card: 'T. Crédito',
};

export default function TransactionRow({ transaction, onEdit }: TransactionRowProps) {
    const handleDelete = () => {
        if (confirm('¿Eliminar esta transacción?')) {
            router.delete(`/transactions/${transaction.id}`);
        }
    };

    const accountLabel = transaction.account?.name
        ?? (transaction.payment_method ? methodLabels[transaction.payment_method] : '—');

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <Badge variant={transaction.type === 'income' ? 'green' : 'red'}>
                    {typeLabels[transaction.type]}
                </Badge>
            </td>
            <td className="px-4 py-3 text-gray-700 text-sm">{transaction.date}</td>
            <td className="px-4 py-3">
                <CategoryChip category={transaction.category} fallback={transaction.category_text} />
            </td>
            <td className="px-4 py-3 text-gray-500 text-sm max-w-xs truncate">{transaction.description}</td>
            <td className="px-4 py-3 text-right font-semibold">
                <span className={transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCOP(transaction.amount)}
                </span>
            </td>
            <td className="px-4 py-3 text-gray-500 text-sm">{accountLabel}</td>
            <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
                </div>
            </td>
        </tr>
    );
}

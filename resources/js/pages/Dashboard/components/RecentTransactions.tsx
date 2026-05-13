import { Transaction } from '@/types';
import { formatCOP } from '@/utils/currency';
import Badge from '@/components/UI/Badge';
import CategoryChip from '@/components/UI/CategoryChip';
import { Link } from '@inertiajs/react';

interface RecentTransactionsProps {
    transactions: Transaction[];
}

const typeLabels: Record<string, string> = {
    income: 'ingreso',
    expense: 'gasto',
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
    if (transactions.length === 0) {
        return <p className="text-sm text-gray-400 py-4 text-center">Sin transacciones registradas.</p>;
    }

    return (
        <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Badge variant={tx.type === 'income' ? 'green' : 'red'}>
                            {typeLabels[tx.type]}
                        </Badge>
                        <div>
                            <CategoryChip category={tx.category} fallback={tx.category_text} />
                            <p className="text-xs text-gray-500">{tx.date}</p>
                        </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCOP(tx.amount)}
                    </span>
                </div>
            ))}
            <div className="pt-3">
                <Link href="/transactions" className="text-sm text-primary-600 hover:underline">
                    Ver todas las transacciones →
                </Link>
            </div>
        </div>
    );
}

import { Account, AccountType, Transaction, Transfer } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Badge from '@/components/UI/Badge';
import { formatCOP } from '@/utils/currency';
import { Link, router } from '@inertiajs/react';
import Button from '@/components/UI/Button';

interface Props {
    account: Account;
    transactions: { data: Transaction[] };
    transfers: { data: Transfer[] };
}

const typeLabels: Record<AccountType, string> = {
    savings: 'Cuenta de ahorros',
    checking: 'Cuenta corriente',
    credit_card: 'Tarjeta de crédito',
    cash: 'Efectivo',
    digital_wallet: 'Billetera digital',
    investment: 'Inversión',
};

const txTypeLabels: Record<string, string> = { income: 'ingreso', expense: 'gasto' };

export default function AccountShow({ account, transactions, transfers }: Props) {
    const handleDeleteTransfer = (id: string) => {
        if (confirm('¿Eliminar esta transferencia?')) {
            router.delete(`/transfers/${id}`);
        }
    };

    // Build a unified timeline: transactions + transfers, sorted by date desc
    const timeline: Array<{
        key: string;
        date: string;
        kind: 'income' | 'expense' | 'transfer_in' | 'transfer_out';
        amount: number;
        label: string;
        sublabel?: string;
        deleteId?: string;
    }> = [
        ...transactions.data.map((tx) => ({
            key: `tx-${tx.id}`,
            date: tx.date,
            kind: tx.type as 'income' | 'expense',
            amount: tx.amount,
            label: tx.category,
            sublabel: tx.description ?? undefined,
        })),
        ...transfers.data.map((tr) => {
            const isOut = tr.from_account_id === account.id;
            return {
                key: `tr-${tr.id}`,
                date: tr.date,
                kind: (isOut ? 'transfer_out' : 'transfer_in') as 'transfer_in' | 'transfer_out',
                amount: tr.amount,
                label: isOut
                    ? `Transferencia a ${tr.to_account?.name ?? '—'}`
                    : `Transferencia desde ${tr.from_account?.name ?? '—'}`,
                sublabel: tr.description ?? undefined,
                deleteId: tr.id,
            };
        }),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const kindConfig = {
        income: { sign: '+', colorClass: 'text-green-700', badgeVariant: 'green' as const, label: 'ingreso' },
        expense: { sign: '-', colorClass: 'text-red-700', badgeVariant: 'red' as const, label: 'gasto' },
        transfer_in: { sign: '+', colorClass: 'text-blue-700', badgeVariant: 'blue' as const, label: 'entrada' },
        transfer_out: { sign: '-', colorClass: 'text-gray-600', badgeVariant: 'gray' as const, label: 'salida' },
    };

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6">
                <Link href="/accounts" className="text-sm text-gray-500 hover:underline">← Cuentas</Link>
                <div className="flex items-start justify-between mt-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
                            <Badge variant="blue">{typeLabels[account.type]}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                            Saldo inicial: {formatCOP(account.initial_balance)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">{account.is_credit_card ? 'Deuda actual' : 'Saldo actual'}</p>
                        <p className={`text-3xl font-bold ${account.is_credit_card ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatCOP(account.balance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Historial ({timeline.length} movimientos)
                    </h2>
                </div>

                {timeline.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">
                        Sin movimientos registrados en esta cuenta.
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {timeline.map((item) => {
                            const cfg = kindConfig[item.kind];
                            return (
                                <div key={item.key} className="flex items-center gap-4 px-5 py-3">
                                    <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                                        {item.sublabel && (
                                            <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                                        )}
                                        <p className="text-xs text-gray-400">{item.date}</p>
                                    </div>
                                    <span className={`text-sm font-semibold flex-shrink-0 ${cfg.colorClass}`}>
                                        {cfg.sign}{formatCOP(item.amount)}
                                    </span>
                                    {item.deleteId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteTransfer(item.deleteId!)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            ×
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

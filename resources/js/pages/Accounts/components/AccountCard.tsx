import { Account, AccountType } from '@/types';
import { formatCOP } from '@/utils/currency';
import Badge from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import { Link, router } from '@inertiajs/react';

interface AccountCardProps {
    account: Account;
    onEdit: () => void;
    onTransfer: () => void;
}

const typeConfig: Record<AccountType, { label: string; badgeVariant: 'blue' | 'indigo' | 'red' | 'green' | 'purple' | 'yellow' }> = {
    savings: { label: 'Ahorros', badgeVariant: 'blue' },
    checking: { label: 'Corriente', badgeVariant: 'indigo' },
    credit_card: { label: 'Tarjeta crédito', badgeVariant: 'red' },
    cash: { label: 'Efectivo', badgeVariant: 'green' },
    digital_wallet: { label: 'Billetera digital', badgeVariant: 'purple' },
    investment: { label: 'Inversión', badgeVariant: 'yellow' },
};

export default function AccountCard({ account, onEdit, onTransfer }: AccountCardProps) {
    const config = typeConfig[account.type];

    const handleDelete = () => {
        if (confirm(`¿Eliminar la cuenta "${account.name}"?`)) {
            router.delete(`/accounts/${account.id}`);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <Badge variant={config.badgeVariant}>{config.label}</Badge>
                    <h3 className="font-semibold text-gray-900 mt-1.5 truncate">{account.name}</h3>
                    {account.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{account.notes}</p>
                    )}
                </div>
            </div>

            <div>
                <p className="text-xs text-gray-500 mb-0.5">
                    {account.is_credit_card ? 'Deuda actual' : 'Saldo actual'}
                </p>
                <p className={`text-2xl font-bold ${account.is_credit_card ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCOP(account.balance)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    Saldo inicial: {formatCOP(account.initial_balance)}
                </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                <Link href={`/accounts/${account.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                        Ver historial
                    </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={onTransfer}>
                    Transferir
                </Button>
                <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
            </div>
        </div>
    );
}

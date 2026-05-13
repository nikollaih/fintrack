import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import CategorySelect from '@/components/UI/CategorySelect';
import { Account, Category, Transaction } from '@/types';
import { formatCOP } from '@/utils/currency';
import { calculateCashback } from '@/utils/calculations';

interface TransactionFormProps {
    transaction?: Transaction;
    accounts: Account[];
    categories: Category[];
    onSuccess: () => void;
}

const typeOptions = [
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' },
];

const LAST_ACCOUNT_KEY = 'fintrack_last_account_id';

function getLastAccountId(accounts: Account[]): string {
    const stored = localStorage.getItem(LAST_ACCOUNT_KEY);
    if (stored && accounts.some((a) => a.id === stored)) return stored;
    return accounts[0]?.id ?? '';
}

export default function TransactionForm({ transaction, accounts, categories, onSuccess }: TransactionFormProps) {
    const accountOptions = accounts.map((a) => ({
        value: a.id,
        label: `${a.name} — ${formatCOP(a.balance)}`,
    }));

    const { data, setData, post, put, processing, errors } = useForm({
        account_id: transaction?.account_id ?? getLastAccountId(accounts),
        category_id: transaction?.category_id ?? '',
        type: transaction?.type ?? 'expense',
        amount: transaction?.amount?.toString() ?? '',
        description: transaction?.description ?? '',
        date: transaction?.date ?? new Date().toISOString().slice(0, 10),
        cashback_rate: transaction?.cashback_rate?.toString() ?? '0',
    });

    // Clear category when type changes and selected category no longer matches
    useEffect(() => {
        if (!data.category_id) return;
        const cat = categories.find((c) => c.id === data.category_id);
        if (!cat) return;
        if (cat.type !== data.type && cat.type !== 'both') setData('category_id', '');
    }, [data.type]);

    const selectedAccount = accounts.find((a) => a.id === data.account_id);
    const isCreditCard    = selectedAccount?.is_credit_card ?? false;

    const cashbackAmount =
        isCreditCard && data.type === 'expense' && data.amount && data.cashback_rate
            ? calculateCashback(parseFloat(data.amount), parseFloat(data.cashback_rate))
            : 0;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.account_id) localStorage.setItem(LAST_ACCOUNT_KEY, data.account_id);
        if (transaction) {
            put(`/transactions/${transaction.id}`, { onSuccess });
        } else {
            post('/transactions', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {accounts.length > 0 && (
                <Select
                    label="Cuenta"
                    options={accountOptions}
                    value={data.account_id}
                    onChange={(e) => setData('account_id', e.target.value)}
                    error={errors.account_id}
                    placeholder="Seleccionar cuenta..."
                />
            )}

            {/* ── Credit card contextual hints ─────────────────────────── */}
            {isCreditCard && data.type === 'expense' && (
                <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <span className="flex-shrink-0 mt-0.5">💳</span>
                    <p>
                        <span className="font-semibold">Compra con tarjeta de crédito.</span>{' '}
                        Esto aumentará la deuda de <strong>{selectedAccount?.name}</strong>.
                        Cuando pagues la factura de tu TC, usa{' '}
                        <span className="font-semibold">Transferencia</span> —
                        no registres el pago como un gasto o lo contabilizarás dos veces.
                    </p>
                </div>
            )}
            {isCreditCard && data.type === 'income' && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    <p>
                        ¿Estás registrando el pago de una tarjeta de crédito como ingreso?
                        Es más correcto hacerlo como <span className="font-semibold">Transferencia</span>{' '}
                        desde tu cuenta de ahorros. Así el patrimonio neto no se altera incorrectamente.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Select
                    label="Tipo"
                    options={typeOptions}
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value as 'income' | 'expense')}
                    error={errors.type}
                />
                <Input
                    label="Fecha"
                    type="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    error={errors.date}
                    required
                />
            </div>

            <CategorySelect
                label="Categoría"
                value={data.category_id}
                onChange={(id) => setData('category_id', id)}
                categories={categories}
                filterType={data.type as 'income' | 'expense'}
                error={errors.category_id}
            />

            <Input
                label="Monto (COP)"
                type="number"
                step="0.0001"
                min="0"
                value={data.amount}
                onChange={(e) => setData('amount', e.target.value)}
                error={errors.amount}
                required
            />
            <Input
                label="Descripción"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                error={errors.description}
            />

            {isCreditCard && data.type === 'expense' && (
                <Input
                    label="Tasa cashback (opcional)"
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={data.cashback_rate}
                    onChange={(e) => setData('cashback_rate', e.target.value)}
                    placeholder="ej. 0.015"
                />
            )}

            {cashbackAmount > 0 && (
                <p className="text-sm text-green-700 font-medium">
                    Cashback estimado: {formatCOP(cashbackAmount)}
                </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>
                    {transaction ? 'Actualizar' : 'Agregar transacción'}
                </Button>
            </div>
        </form>
    );
}

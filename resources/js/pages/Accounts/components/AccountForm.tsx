import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { Account } from '@/types';

interface AccountFormProps {
    account?: Account;
    onSuccess: () => void;
}

const typeOptions = [
    { value: 'savings', label: 'Cuenta de ahorros' },
    { value: 'checking', label: 'Cuenta corriente' },
    { value: 'credit_card', label: 'Tarjeta de crédito' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'digital_wallet', label: 'Billetera digital' },
    { value: 'investment', label: 'Inversión' },
];

export default function AccountForm({ account, onSuccess }: AccountFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: account?.name ?? '',
        type: account?.type ?? 'savings',
        currency: account?.currency ?? 'COP',
        initial_balance: account?.initial_balance?.toString() ?? '0',
        is_active: account?.is_active ?? true,
        notes: account?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (account) {
            put(`/accounts/${account.id}`, { onSuccess });
        } else {
            post('/accounts', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Input
                label="Nombre de la cuenta"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
                placeholder="ej. Bancolombia Ahorros, Nubank"
                required
            />
            <Select
                label="Tipo"
                options={typeOptions}
                value={data.type}
                onChange={(e) => setData('type', e.target.value as Account['type'])}
                error={errors.type}
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Saldo inicial (COP)"
                    type="number"
                    step="0.01"
                    value={data.initial_balance}
                    onChange={(e) => setData('initial_balance', e.target.value)}
                    error={errors.initial_balance}
                    required
                />
                <Input
                    label="Moneda"
                    value={data.currency}
                    onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                    error={errors.currency}
                    maxLength={3}
                />
            </div>
            {data.type === 'credit_card' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Para tarjetas de crédito el saldo inicial representa la deuda actual al momento de crear la cuenta.
                </div>
            )}
            <Input
                label="Notas"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={errors.notes}
            />
            {account && (
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Activa</p>
                        <p className="text-xs text-gray-500">Las cuentas inactivas no aparecen en el dashboard</p>
                    </div>
                </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>
                    {account ? 'Actualizar' : 'Crear cuenta'}
                </Button>
            </div>
        </form>
    );
}

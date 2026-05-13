import { useForm } from '@inertiajs/react';
import Select from '@/components/UI/Select';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import { Account } from '@/types';
import { formatCOP } from '@/utils/currency';

interface TransferFormProps {
    accounts: Account[];
    defaultFromId?: string;
    onSuccess: () => void;
}

export default function TransferForm({ accounts, defaultFromId, onSuccess }: TransferFormProps) {
    const accountOptions = accounts.map((a) => ({
        value: a.id,
        label: `${a.name} (${formatCOP(a.balance)})`,
    }));

    const { data, setData, post, processing, errors } = useForm({
        from_account_id: defaultFromId ?? accounts.find((a) => !a.is_credit_card)?.id ?? '',
        to_account_id: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
    });

    const fromAccount = accounts.find((a) => a.id === data.from_account_id);
    const toAccount   = accounts.find((a) => a.id === data.to_account_id);

    const isCcPayment = toAccount?.is_credit_card ?? false;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/transfers', { onSuccess });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Select
                label="Cuenta origen"
                options={accountOptions}
                value={data.from_account_id}
                onChange={(e) => setData('from_account_id', e.target.value)}
                error={errors.from_account_id}
                placeholder="Seleccionar cuenta..."
            />
            <Select
                label="Cuenta destino"
                options={accountOptions.filter((o) => o.value !== data.from_account_id)}
                value={data.to_account_id}
                onChange={(e) => setData('to_account_id', e.target.value)}
                error={errors.to_account_id}
                placeholder="Seleccionar cuenta..."
            />

            {/* ── Contextual hints based on selected accounts ──────────── */}
            {isCcPayment && fromAccount && (
                <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                    <span className="flex-shrink-0 mt-0.5">✅</span>
                    <p>
                        <span className="font-semibold">Pago de tarjeta de crédito.</span>{' '}
                        Correcto: esto reducirá la deuda de <strong>{toAccount.name}</strong> y descontará
                        el dinero de <strong>{fromAccount.name}</strong>.
                        El gasto ya fue registrado cuando hiciste la compra —
                        esta transferencia <em>solo mueve dinero para saldar la deuda</em>,
                        no crea un nuevo gasto.
                    </p>
                </div>
            )}

            {fromAccount?.is_credit_card && !isCcPayment && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    <p>
                        Estás transfiriendo <em>desde</em> una tarjeta de crédito.
                        Esto se registrará como un avance de efectivo y{' '}
                        <span className="font-semibold">aumentará la deuda</span> de {fromAccount.name}.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Monto (COP)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    error={errors.amount}
                    required
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
            <Input
                label="Descripción (opcional)"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                error={errors.description}
                placeholder="ej. Pago factura enero"
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>Registrar transferencia</Button>
            </div>
        </form>
    );
}

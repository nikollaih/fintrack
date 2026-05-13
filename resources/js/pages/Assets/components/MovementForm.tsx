import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';

interface MovementFormProps {
    assetId: string;
    onSuccess: () => void;
}

const todayStr = new Date().toISOString().split('T')[0];

export default function MovementForm({ assetId, onSuccess }: MovementFormProps) {
    const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amountInput, setAmountInput] = useState('');
    const [date, setDate] = useState(todayStr);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const absAmount = Math.abs(parseFloat(amountInput) || 0);
        if (absAmount === 0) {
            setErrors({ amount: 'El monto debe ser mayor a 0' });
            return;
        }

        const signedAmount = movementType === 'withdrawal' ? -absAmount : absAmount;

        setProcessing(true);
        router.post('/asset-movements', {
            asset_id: assetId,
            date,
            amount: signedAmount,
            note: note || undefined,
        }, {
            onSuccess: () => {
                setAmountInput('');
                setNote('');
                setDate(todayStr);
                setErrors({});
                onSuccess();
            },
            onError: (e) => setErrors(e),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Type toggle */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setMovementType('deposit')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                            movementType === 'deposit'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Depósito
                    </button>
                    <button
                        type="button"
                        onClick={() => setMovementType('withdrawal')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                            movementType === 'withdrawal'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Retiro
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto (COP)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="0"
                        required
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ej. Abono mensual"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess} disabled={processing}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    loading={processing}
                    variant={movementType === 'withdrawal' ? 'danger' : 'primary'}
                >
                    {movementType === 'deposit' ? 'Registrar depósito' : 'Registrar retiro'}
                </Button>
            </div>
        </form>
    );
}

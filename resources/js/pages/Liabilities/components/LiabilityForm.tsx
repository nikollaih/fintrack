import { useForm } from '@inertiajs/react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import { LiabilityCard } from '@/types';
import { calcMonthlyPayment } from '../utils';
import { useEffect } from 'react';

interface Account { id: string; name: string; type: string; }

interface Props {
    open: boolean;
    onClose: () => void;
    accounts: Account[];
    liability?: LiabilityCard;
}

const typeOptions = [
    { value: 'mortgage', label: 'Hipoteca' },
    { value: 'personal_loan', label: 'Préstamo Personal' },
    { value: 'vehicle_loan', label: 'Crédito Vehículo' },
    { value: 'credit_card_loan', label: 'Crédito Tarjeta' },
    { value: 'cooperative_loan', label: 'Crédito Cooperativa' },
    { value: 'other', label: 'Otro' },
];

const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'paid_off', label: 'Pagado' },
    { value: 'refinanced', label: 'Refinanciado' },
];

export default function LiabilityForm({ open, onClose, accounts, liability }: Props) {
    const isEdit = !!liability;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: liability?.name ?? '',
        type: liability?.type ?? 'mortgage',
        status: liability?.status ?? 'active',
        original_amount: liability?.original_amount?.toString() ?? '',
        outstanding_balance: liability?.outstanding_balance?.toString() ?? '',
        annual_interest_rate: liability ? (liability.annual_interest_rate * 100).toFixed(4) : '',
        term_months: liability?.term_months?.toString() ?? '',
        start_date: liability?.start_date ?? '',
        first_payment_date: liability?.first_payment_date ?? '',
        monthly_payment: liability?.monthly_payment?.toString() ?? '',
        payment_day: liability?.payment_day?.toString() ?? '',
        linked_account_id: liability?.linked_account?.id ?? '',
        notes: liability?.notes ?? '',
        estimated_property_value: liability?.estimated_property_value?.toString() ?? '',
        create_fixed_expense: false,
    });

    // Auto-compute monthly_payment when params change
    useEffect(() => {
        const p = parseFloat(data.original_amount);
        const r = parseFloat(data.annual_interest_rate) / 100;
        const n = parseInt(data.term_months);
        if (p > 0 && r > 0 && n > 0) {
            const isEA = data.type === 'cooperative_loan';
            const mp = calcMonthlyPayment(p, r, n, isEA);
            setData('monthly_payment', mp.toFixed(0));
        }
    }, [data.original_amount, data.annual_interest_rate, data.term_months, data.type]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...data,
            annual_interest_rate: (parseFloat(data.annual_interest_rate) / 100).toString(),
        };
        if (isEdit) {
            put(`/liabilities/${liability!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post('/liabilities', { onSuccess: () => { reset(); onClose(); } });
        }
    }

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Pasivo' : 'Nuevo Pasivo'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <Input value={data.name} onChange={e => setData('name', e.target.value)}
                            placeholder="Ej. Crédito Hipotecario Bancolombia" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <Select value={data.type} onChange={e => setData('type', e.target.value as any)}
                            options={typeOptions} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <Select value={data.status} onChange={e => setData('status', e.target.value as any)}
                            options={statusOptions} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto Original (COP)</label>
                        <Input type="number" value={data.original_amount} onChange={e => setData('original_amount', e.target.value)} min="0" step="1000" />
                        {errors.original_amount && <p className="text-red-500 text-xs mt-1">{errors.original_amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Actual (COP)</label>
                        <Input type="number" value={data.outstanding_balance} onChange={e => setData('outstanding_balance', e.target.value)} min="0" step="1000" />
                        {errors.outstanding_balance && <p className="text-red-500 text-xs mt-1">{errors.outstanding_balance}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Anual (%)</label>
                        <Input type="number" value={data.annual_interest_rate} onChange={e => setData('annual_interest_rate', e.target.value)}
                            placeholder="Ej. 12.50" min="0" max="100" step="0.01" />
                        <p className="text-xs text-gray-400 mt-0.5">
                            {data.type === 'cooperative_loan' ? 'Tasa efectiva anual (EA)' : 'Tasa nominal anual (÷12)'}
                        </p>
                        {errors.annual_interest_rate && <p className="text-red-500 text-xs mt-1">{errors.annual_interest_rate}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plazo (meses)</label>
                        <Input type="number" value={data.term_months} onChange={e => setData('term_months', e.target.value)} min="1" />
                        {errors.term_months && <p className="text-red-500 text-xs mt-1">{errors.term_months}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                        <Input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha 1er Pago</label>
                        <Input type="date" value={data.first_payment_date} onChange={e => setData('first_payment_date', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuota Mensual (COP)</label>
                        <Input type="number" value={data.monthly_payment} onChange={e => setData('monthly_payment', e.target.value)} min="0" step="1000" />
                        <p className="text-xs text-gray-400 mt-0.5">Calculado automáticamente</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Día de Pago</label>
                        <Input type="number" value={data.payment_day} onChange={e => setData('payment_day', e.target.value)} min="1" max="28" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Débito</label>
                        <Select
                            value={data.linked_account_id}
                            onChange={e => setData('linked_account_id', e.target.value)}
                            options={[
                                { value: '', label: 'Sin cuenta vinculada' },
                                ...accounts.map(a => ({ value: a.id, label: a.name })),
                            ]}
                        />
                    </div>

                    {data.type === 'mortgage' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado Inmueble (COP)</label>
                            <Input type="number" value={data.estimated_property_value} onChange={e => setData('estimated_property_value', e.target.value)} min="0" step="1000000" />
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {!isEdit && data.linked_account_id && (
                        <div className="col-span-2 flex items-center gap-2">
                            <input type="checkbox" id="cfe" checked={data.create_fixed_expense}
                                onChange={e => setData('create_fixed_expense', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                            <label htmlFor="cfe" className="text-sm text-gray-700">
                                Crear gasto fijo automáticamente para la cuota mensual
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={processing}>{isEdit ? 'Guardar Cambios' : 'Crear Pasivo'}</Button>
                </div>
            </form>
        </Modal>
    );
}

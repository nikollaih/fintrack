import { useForm } from '@inertiajs/react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import { AmortizationRow, LiabilityFull } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    liability: LiabilityFull;
    scheduledRow?: AmortizationRow;
    hasLinkedAccount: boolean;
}

export default function RegisterPaymentModal({ open, onClose, liability, scheduledRow, hasLinkedAccount }: Props) {
    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, processing, errors, reset } = useForm({
        payment_date: today,
        total_paid: scheduledRow?.payment?.toFixed(0) ?? liability.monthly_payment.toFixed(0),
        principal_paid: scheduledRow?.principal?.toFixed(0) ?? '0',
        interest_paid: scheduledRow?.interest?.toFixed(0) ?? '0',
        outstanding_balance_after: scheduledRow?.ending_balance?.toFixed(0)
            ?? (liability.outstanding_balance - (scheduledRow?.principal ?? 0)).toFixed(0),
        payment_type: 'scheduled' as const,
        payment_number: scheduledRow?.number?.toString() ?? '',
        create_transaction: false,
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/liabilities/${liability.id}/payments`, {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Modal open={open} onClose={onClose} title="Registrar Pago" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
                        <Input type="date" value={data.payment_date} onChange={e => setData('payment_date', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <Select value={data.payment_type}
                            onChange={e => setData('payment_type', e.target.value as any)}
                            options={[
                                { value: 'scheduled', label: 'Cuota programada' },
                                { value: 'extra_payment', label: 'Abono extra' },
                                { value: 'lump_sum_payment', label: 'Abono lump sum' },
                            ]} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Pagado (COP)</label>
                        <Input type="number" value={data.total_paid} onChange={e => setData('total_paid', e.target.value)} min="0" step="100" />
                        {errors.total_paid && <p className="text-red-500 text-xs mt-1">{errors.total_paid}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">N° Cuota</label>
                        <Input type="number" value={data.payment_number} onChange={e => setData('payment_number', e.target.value)} min="1" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capital Pagado (COP)</label>
                        <Input type="number" value={data.principal_paid} onChange={e => setData('principal_paid', e.target.value)} min="0" step="100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Intereses Pagados (COP)</label>
                        <Input type="number" value={data.interest_paid} onChange={e => setData('interest_paid', e.target.value)} min="0" step="100" />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Restante Después del Pago (COP)</label>
                        <Input type="number" value={data.outstanding_balance_after} onChange={e => setData('outstanding_balance_after', e.target.value)} min="0" step="100" />
                    </div>

                    {hasLinkedAccount && (
                        <div className="col-span-2 flex items-center gap-2">
                            <input type="checkbox" id="ct" checked={data.create_transaction}
                                onChange={e => setData('create_transaction', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                            <label htmlFor="ct" className="text-sm text-gray-700">
                                Registrar también como transacción en la cuenta vinculada
                            </label>
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <Input value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Opcional" />
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={processing}>Registrar Pago</Button>
                </div>
            </form>
        </Modal>
    );
}

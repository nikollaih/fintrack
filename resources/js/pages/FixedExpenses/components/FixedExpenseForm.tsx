import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import CategorySelect from '@/components/UI/CategorySelect';
import { Category, FixedExpense } from '@/types';

interface FixedExpenseFormProps {
    expense?: FixedExpense;
    categories: Category[];
    onSuccess: () => void;
}

const paymentOptions = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'debit', label: 'Débito' },
    { value: 'credit_card', label: 'Tarjeta de crédito' },
];

export default function FixedExpenseForm({ expense, categories, onSuccess }: FixedExpenseFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: expense?.name ?? '',
        amount: expense?.amount?.toString() ?? '',
        category_id: expense?.category_id ?? '',
        payment_method: expense?.payment_method ?? 'debit',
        expected_day: expense?.expected_day?.toString() ?? '1',
        is_active: expense?.is_active ?? true,
        notes: expense?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (expense) {
            put(`/fixed-expenses/${expense.id}`, { onSuccess });
        } else {
            post('/fixed-expenses', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Input
                label="Nombre"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
                placeholder="ej. Arriendo, Internet, Celular"
                required
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Monto (COP)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    error={errors.amount}
                    required
                />
                <Input
                    label="Día esperado de pago"
                    type="number"
                    min="1"
                    max="31"
                    value={data.expected_day}
                    onChange={(e) => setData('expected_day', e.target.value)}
                    error={errors.expected_day}
                    required
                />
            </div>

            <CategorySelect
                label="Categoría"
                value={data.category_id}
                onChange={(id) => setData('category_id', id)}
                categories={categories}
                filterType="expense"
                error={errors.category_id}
            />

            <Select
                label="Método de pago"
                options={paymentOptions}
                value={data.payment_method}
                onChange={(e) => setData('payment_method', e.target.value as FixedExpense['payment_method'])}
                error={errors.payment_method}
            />
            <Input
                label="Notas"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={errors.notes}
            />
            {expense && (
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Activo</p>
                        <p className="text-xs text-gray-500">Desactiva para ocultar del checklist sin eliminar</p>
                    </div>
                </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>
                    {expense ? 'Actualizar' : 'Crear gasto fijo'}
                </Button>
            </div>
        </form>
    );
}

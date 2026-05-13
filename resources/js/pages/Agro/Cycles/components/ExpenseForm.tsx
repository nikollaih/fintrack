import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import CategorySelect from '@/components/UI/CategorySelect';
import { Category, Supplier } from '@/types';

interface ExpenseFormProps {
    cycleId: string;
    suppliers: Supplier[];
    agroCategories: Category[];
    onSuccess: () => void;
}

const phaseOptions = [
    { value: 'preparation', label: 'Preparación' },
    { value: 'sowing', label: 'Siembra' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'harvest', label: 'Cosecha' },
];

export default function ExpenseForm({ cycleId, suppliers, agroCategories, onSuccess }: ExpenseFormProps) {
    const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

    const { data, setData, post, processing, errors } = useForm({
        cycle_id: cycleId,
        supplier_id: '',
        category_id: '',
        phase: 'preparation',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().slice(0, 10),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/crop-expenses', { onSuccess });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Select
                    label="Fase"
                    options={phaseOptions}
                    value={data.phase}
                    onChange={(e) => setData('phase', e.target.value)}
                    error={errors.phase}
                />
                <Select
                    label="Proveedor (opcional)"
                    options={supplierOptions}
                    value={data.supplier_id}
                    onChange={(e) => setData('supplier_id', e.target.value)}
                    placeholder="Sin proveedor"
                    error={errors.supplier_id}
                />
            </div>

            <CategorySelect
                label="Categoría"
                value={data.category_id}
                onChange={(id) => setData('category_id', id)}
                categories={agroCategories}
                filterType="agro"
                error={errors.category_id}
            />

            <Input
                label="Descripción"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                error={errors.description}
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Monto (COP)"
                    type="number"
                    step="0.0001"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    error={errors.amount}
                    required
                />
                <Input
                    label="Fecha"
                    type="date"
                    value={data.expense_date}
                    onChange={(e) => setData('expense_date', e.target.value)}
                    error={errors.expense_date}
                    required
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>Agregar gasto</Button>
            </div>
        </form>
    );
}

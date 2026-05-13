import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { Supplier } from '@/types';

interface SupplierFormProps {
    supplier?: Supplier;
    onSuccess: () => void;
}

const categoryOptions = [
    { value: 'seeds', label: 'Semillas' },
    { value: 'fertilizer', label: 'Fertilizante' },
    { value: 'pesticide', label: 'Pesticida' },
    { value: 'labor', label: 'Mano de obra' },
    { value: 'other', label: 'Otro' },
];

export default function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: supplier?.name ?? '',
        category: supplier?.category ?? 'other',
        phone: supplier?.phone ?? '',
        notes: supplier?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (supplier) {
            put(`/suppliers/${supplier.id}`, { onSuccess });
        } else {
            post('/suppliers', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Input
                label="Nombre"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
                required
            />
            <Select
                label="Categoría"
                options={categoryOptions}
                value={data.category}
                onChange={(e) => setData('category', e.target.value as Supplier['category'])}
                error={errors.category}
            />
            <Input
                label="Teléfono"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
                error={errors.phone}
            />
            <Input
                label="Notas"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={errors.notes}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>
                    {supplier ? 'Actualizar' : 'Agregar proveedor'}
                </Button>
            </div>
        </form>
    );
}

import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { Buyer } from '@/types';

interface BuyerFormProps {
    buyer?: Buyer;
    onSuccess: () => void;
}

const typeOptions = [
    { value: 'plaza', label: 'Plaza' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'intermediary', label: 'Intermediario' },
    { value: 'direct', label: 'Directo' },
    { value: 'other', label: 'Otro' },
];

export default function BuyerForm({ buyer, onSuccess }: BuyerFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: buyer?.name ?? '',
        type: buyer?.type ?? 'other',
        phone: buyer?.phone ?? '',
        location: buyer?.location ?? '',
        notes: buyer?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (buyer) {
            put(`/buyers/${buyer.id}`, { onSuccess });
        } else {
            post('/buyers', { onSuccess });
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
                label="Tipo"
                options={typeOptions}
                value={data.type}
                onChange={(e) => setData('type', e.target.value as Buyer['type'])}
                error={errors.type}
            />
            <Input
                label="Teléfono"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
                error={errors.phone}
            />
            <Input
                label="Ubicación"
                value={data.location}
                onChange={(e) => setData('location', e.target.value)}
                error={errors.location}
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
                    {buyer ? 'Actualizar' : 'Agregar comprador'}
                </Button>
            </div>
        </form>
    );
}

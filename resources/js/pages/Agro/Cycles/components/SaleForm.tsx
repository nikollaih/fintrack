import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { Buyer } from '@/types';

interface SaleFormProps {
    cycleId: string;
    buyers: Buyer[];
    onSuccess: () => void;
}

export default function SaleForm({ cycleId, buyers, onSuccess }: SaleFormProps) {
    const buyerOptions = buyers.map((b) => ({ value: b.id, label: b.name }));

    const { data, setData, post, processing, errors } = useForm({
        cycle_id: cycleId,
        buyer_id: '',
        quantity: '',
        unit: 'kg',
        unit_price: '',
        sale_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/crop-sales', { onSuccess });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Select
                label="Comprador (opcional)"
                options={buyerOptions}
                value={data.buyer_id}
                onChange={(e) => setData('buyer_id', e.target.value)}
                placeholder="Sin comprador"
                error={errors.buyer_id}
            />
            <div className="grid grid-cols-3 gap-3">
                <Input
                    label="Cantidad"
                    type="number"
                    step="0.01"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', e.target.value)}
                    error={errors.quantity}
                    required
                />
                <Input
                    label="Unidad"
                    value={data.unit}
                    onChange={(e) => setData('unit', e.target.value)}
                    error={errors.unit}
                    placeholder="kg, lb, unidades"
                    required
                />
                <Input
                    label="Precio unitario (COP)"
                    type="number"
                    step="0.0001"
                    value={data.unit_price}
                    onChange={(e) => setData('unit_price', e.target.value)}
                    error={errors.unit_price}
                    required
                />
            </div>
            <Input
                label="Fecha de venta"
                type="date"
                value={data.sale_date}
                onChange={(e) => setData('sale_date', e.target.value)}
                error={errors.sale_date}
                required
            />
            <Input
                label="Notas"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={errors.notes}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>Registrar venta</Button>
            </div>
        </form>
    );
}

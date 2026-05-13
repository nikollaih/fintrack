import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { CropCycle } from '@/types';

interface CycleFormProps {
    cycle?: CropCycle;
    onSuccess: () => void;
}

const statusOptions = [
    { value: 'planned', label: 'Planeado' },
    { value: 'active', label: 'Activo' },
    { value: 'harvested', label: 'Cosechado' },
    { value: 'failed', label: 'Fallido' },
];

export default function CycleForm({ cycle, onSuccess }: CycleFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        crop_type: cycle?.crop_type ?? '',
        area_sqm: cycle?.area_sqm?.toString() ?? '',
        location: cycle?.location ?? '',
        sown_at: cycle?.sown_at ?? '',
        expected_harvest_at: cycle?.expected_harvest_at ?? '',
        harvested_at: cycle?.harvested_at ?? '',
        status: cycle?.status ?? 'planned',
        notes: cycle?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cycle) {
            put(`/crop-cycles/${cycle.id}`, { onSuccess });
        } else {
            post('/crop-cycles', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Tipo de cultivo"
                    value={data.crop_type}
                    onChange={(e) => setData('crop_type', e.target.value)}
                    error={errors.crop_type}
                    placeholder="ej. Maíz, Tomates"
                    required
                />
                <Input
                    label="Área (m²)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.area_sqm}
                    onChange={(e) => setData('area_sqm', e.target.value)}
                    error={errors.area_sqm}
                    required
                />
            </div>
            <Input
                label="Ubicación"
                value={data.location}
                onChange={(e) => setData('location', e.target.value)}
                error={errors.location}
                required
            />
            <div className="grid grid-cols-3 gap-3">
                <Input
                    label="Fecha de siembra"
                    type="date"
                    value={data.sown_at}
                    onChange={(e) => setData('sown_at', e.target.value)}
                    error={errors.sown_at}
                    required
                />
                <Input
                    label="Cosecha esperada"
                    type="date"
                    value={data.expected_harvest_at}
                    onChange={(e) => setData('expected_harvest_at', e.target.value)}
                    error={errors.expected_harvest_at}
                />
                <Input
                    label="Cosechado el"
                    type="date"
                    value={data.harvested_at}
                    onChange={(e) => setData('harvested_at', e.target.value)}
                    error={errors.harvested_at}
                />
            </div>
            <Select
                label="Estado"
                options={statusOptions}
                value={data.status}
                onChange={(e) => setData('status', e.target.value as CropCycle['status'])}
                error={errors.status}
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
                    {cycle ? 'Actualizar ciclo' : 'Crear ciclo'}
                </Button>
            </div>
        </form>
    );
}

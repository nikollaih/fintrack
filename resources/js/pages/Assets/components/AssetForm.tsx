import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { Asset } from '@/types';

interface AssetFormProps {
    asset?: Asset;
    onSuccess: () => void;
}

const typeOptions = [
    { value: 'cajita', label: 'Cajita' },
    { value: 'cdt', label: 'CDT' },
    { value: 'cooperativa', label: 'Cooperativa' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'other', label: 'Otro' },
];

const compoundingOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'at_maturity', label: 'Al vencimiento' },
];

const compoundingHints: Record<string, string> = {
    daily: 'El interés se acumula diariamente usando la tasa EA.',
    monthly: 'El interés se acumula mensualmente usando la tasa EA.',
    at_maturity: 'El interés se paga íntegro al vencimiento del activo.',
};

const todayStr = new Date().toISOString().split('T')[0];

export default function AssetForm({ asset, onSuccess }: AssetFormProps) {
    const { data, setData, post, put, processing, errors } = useForm({
        type: asset?.type ?? 'cash',
        name: asset?.name ?? '',
        initial_balance: asset?.initial_balance?.toString() ?? '',
        start_date: asset?.start_date ?? todayStr,
        compounding_frequency: asset?.compounding_frequency ?? 'daily',
        rate_ea: asset?.rate_ea?.toString() ?? '',
        maturity_date: asset?.maturity_date ?? '',
        notes: asset?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (asset) {
            put(`/assets/${asset.id}`, { onSuccess });
        } else {
            post('/assets', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Select
                label="Tipo"
                options={typeOptions}
                value={data.type}
                onChange={(e) => setData('type', e.target.value as Asset['type'])}
                error={errors.type}
            />
            <Input
                label="Nombre"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
                placeholder="ej. CDT Bancolombia 2025"
                required
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Capital inicial (COP)"
                    type="number"
                    step="0.0001"
                    value={data.initial_balance}
                    onChange={(e) => setData('initial_balance', e.target.value)}
                    error={errors.initial_balance}
                    required
                />
                <Input
                    label="Fecha de inicio"
                    type="date"
                    value={data.start_date}
                    onChange={(e) => setData('start_date', e.target.value)}
                    error={errors.start_date}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Tasa EA (decimal)"
                    type="number"
                    step="0.000001"
                    min="0"
                    max="1"
                    value={data.rate_ea}
                    onChange={(e) => setData('rate_ea', e.target.value)}
                    error={errors.rate_ea}
                    placeholder="ej. 0.12 = 12%"
                />
                <Input
                    label="Fecha de vencimiento"
                    type="date"
                    value={data.maturity_date}
                    onChange={(e) => setData('maturity_date', e.target.value)}
                    error={errors.maturity_date}
                />
            </div>
            <div>
                <Select
                    label="Frecuencia de capitalización"
                    options={compoundingOptions}
                    value={data.compounding_frequency}
                    onChange={(e) => setData('compounding_frequency', e.target.value as Asset['compounding_frequency'])}
                    error={errors.compounding_frequency}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {compoundingHints[data.compounding_frequency]}
                </p>
            </div>
            <Input
                label="Notas"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={errors.notes}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>
                    {asset ? 'Actualizar activo' : 'Crear activo'}
                </Button>
            </div>
        </form>
    );
}

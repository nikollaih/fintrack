import { useForm } from '@inertiajs/react';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import Button from '@/components/UI/Button';
import { Category } from '@/types';

interface CategoryFormProps {
    category?: Category;
    onSuccess: () => void;
}

const typeOptions = [
    { value: 'expense', label: 'Gasto' },
    { value: 'income', label: 'Ingreso' },
    { value: 'agro', label: 'Agro' },
    { value: 'both', label: 'General (ambos)' },
];

export default function CategoryForm({ category, onSuccess }: CategoryFormProps) {
    const isPredefined = category?.is_predefined ?? false;

    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name ?? '',
        type: category?.type ?? 'expense',
        icon: category?.icon ?? 'circle',
        color: category?.color ?? '#6366f1',
        is_active: category?.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (category) {
            put(`/categories/${category.id}`, { onSuccess });
        } else {
            post('/categories', { onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {!isPredefined && (
                <>
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
                        onChange={(e) => setData('type', e.target.value as Category['type'])}
                        error={errors.type}
                    />
                </>
            )}

            {isPredefined && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Categoría predefinida — solo puedes cambiar el color y el ícono.
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                        />
                        <Input
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                        />
                    </div>
                    {errors.color && <p className="text-xs text-red-600">{errors.color}</p>}
                </div>
                <Input
                    label="Ícono (Tabler)"
                    value={data.icon}
                    onChange={(e) => setData('icon', e.target.value)}
                    error={errors.icon}
                    placeholder="ej. shopping-bag"
                />
            </div>

            {category && (
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Activa</p>
                        <p className="text-xs text-gray-500">Las categorías inactivas no aparecen en los formularios</p>
                    </div>
                </label>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" loading={processing}>
                    {category ? 'Guardar cambios' : 'Crear categoría'}
                </Button>
            </div>
        </form>
    );
}

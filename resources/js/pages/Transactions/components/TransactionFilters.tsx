import { router } from '@inertiajs/react';
import Select from '@/components/UI/Select';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import { useState } from 'react';

interface Filters {
    month?: string;
    type?: string;
    category?: string;
}

interface TransactionFiltersProps {
    filters: Filters;
}

const typeOptions = [
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' },
];

export default function TransactionFilters({ filters }: TransactionFiltersProps) {
    const [local, setLocal] = useState<Filters>(filters);

    const apply = () => {
        router.get('/transactions', local, { preserveState: true, replace: true });
    };

    const reset = () => {
        setLocal({});
        router.get('/transactions', {}, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-wrap gap-3 items-end">
            <Input
                label="Mes"
                type="month"
                value={local.month ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, month: e.target.value }))}
            />
            <Select
                label="Tipo"
                options={typeOptions}
                value={local.type ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, type: e.target.value }))}
                placeholder="Todos los tipos"
            />
            <Input
                label="Categoría"
                value={local.category ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, category: e.target.value }))}
                placeholder="Filtrar por categoría"
            />
            <div className="flex gap-2">
                <Button onClick={apply} size="sm">Aplicar</Button>
                <Button onClick={reset} variant="secondary" size="sm">Limpiar</Button>
            </div>
        </div>
    );
}

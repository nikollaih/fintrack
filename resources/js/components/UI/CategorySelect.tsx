import { useEffect, useRef, useState } from 'react';
import { Category, CategoryType } from '@/types';

interface CategorySelectProps {
    value: string;
    onChange: (id: string) => void;
    categories: Category[];
    label?: string;
    error?: string;
    placeholder?: string;
    filterType?: CategoryType | CategoryType[];
}

function CategoryDot({ color }: { color: string }) {
    return (
        <span
            className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm"
            style={{ backgroundColor: color }}
        />
    );
}

const groupLabels: Record<CategoryType, string> = {
    expense: 'Gastos',
    income: 'Ingresos',
    agro: 'Agro',
    both: 'General',
};

const groupOrder: CategoryType[] = ['income', 'expense', 'agro', 'both'];

export default function CategorySelect({
    value,
    onChange,
    categories,
    label,
    error,
    placeholder = 'Seleccionar categoría...',
    filterType,
}: CategorySelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => searchRef.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = categories.filter((c) => {
        if (!c.is_active) return false;
        if (filterType) {
            const types = Array.isArray(filterType) ? filterType : [filterType];
            if (!types.includes(c.type) && c.type !== 'both') return false;
        }
        return c.name.toLowerCase().includes(search.toLowerCase());
    });

    // Group by type preserving order
    const groups = groupOrder
        .map((type) => ({ type, items: filtered.filter((c) => c.type === type) }))
        .filter((g) => g.items.length > 0);

    const selected = categories.find((c) => c.id === value);

    const handleSelect = (id: string) => {
        onChange(id);
        setOpen(false);
        setSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
                    ${open ? 'border-primary-500 ring-2 ring-primary-500' : ''}`}
            >
                {selected ? (
                    <>
                        <CategoryDot color={selected.color} />
                        <span className="flex-1 text-gray-900">{selected.name}</span>
                    </>
                ) : (
                    <span className="flex-1 text-gray-400">{placeholder}</span>
                )}
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar categoría..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {groups.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-gray-400 text-center">
                                Sin resultados para "{search}"
                            </p>
                        ) : (
                            groups.map(({ type, items }) => (
                                <div key={type}>
                                    {groups.length > 1 && (
                                        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">
                                            {groupLabels[type]}
                                        </p>
                                    )}
                                    {items.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleSelect(cat.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
                                                transition-colors hover:bg-gray-50
                                                ${cat.id === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-800'}`}
                                        >
                                            <CategoryDot color={cat.color} />
                                            {cat.name}
                                            {cat.id === value && (
                                                <svg className="ml-auto w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {value && (
                        <div className="border-t border-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left hover:bg-gray-50 rounded"
                            >
                                Limpiar selección
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

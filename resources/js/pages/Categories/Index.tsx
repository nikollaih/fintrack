import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Category, CategoryType } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import CategoryForm from './components/CategoryForm';

interface Grouped {
    expense: { data: Category[] };
    income: { data: Category[] };
    agro: { data: Category[] };
    both: { data: Category[] };
}

interface Props {
    grouped: Grouped;
}

const sectionLabels: Record<string, string> = {
    expense: 'Gastos',
    income: 'Ingresos',
    agro: 'Agro / Cultivos',
    both: 'General',
};

function CategoryRow({ category, onEdit }: { category: Category; onEdit: () => void }) {
    const handleDelete = () => {
        if (confirm(`¿Eliminar la categoría "${category.name}"?`)) {
            router.delete(`/categories/${category.id}`);
        }
    };

    return (
        <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors
            ${category.is_active ? 'hover:bg-gray-50' : 'opacity-50 hover:bg-gray-50'}`}
        >
            <span
                className="w-4 h-4 rounded-full flex-shrink-0 border border-white shadow"
                style={{ backgroundColor: category.color }}
            />
            <span className="flex-1 text-sm text-gray-900">{category.name}</span>
            <span className="text-xs text-gray-400 font-mono">{category.icon}</span>
            {category.is_predefined && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    predefinida
                </span>
            )}
            {!category.is_active && (
                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">inactiva</span>
            )}
            <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
                    {category.is_predefined ? 'Personalizar' : 'Editar'}
                </Button>
                {!category.is_predefined && (
                    <Button variant="danger" size="sm" onClick={handleDelete} className="text-xs">
                        Eliminar
                    </Button>
                )}
            </div>
        </div>
    );
}

function CategorySection({ title, categories, onEdit }: {
    title: string;
    categories: Category[];
    onEdit: (c: Category) => void;
}) {
    if (categories.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                {title}
            </h3>
            <div className="divide-y divide-gray-100">
                {categories.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} onEdit={() => onEdit(cat)} />
                ))}
            </div>
        </div>
    );
}

export default function CategoriesIndex({ grouped }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Category | undefined>(undefined);

    const openCreate = () => { setEditing(undefined); setModalOpen(true); };
    const openEdit = (c: Category) => { setEditing(c); setModalOpen(true); };

    const sections: Array<{ key: string; categories: Category[] }> = [
        { key: 'expense', categories: grouped.expense.data },
        { key: 'income', categories: grouped.income.data },
        { key: 'agro', categories: grouped.agro.data },
        { key: 'both', categories: grouped.both.data },
    ];

    return (
        <AppLayout title="Categorías">
            <div className="flex justify-end mb-4">
                <Button onClick={openCreate}>+ Nueva categoría</Button>
            </div>

            <div className="space-y-4">
                {sections.map(({ key, categories }) => (
                    <CategorySection
                        key={key}
                        title={sectionLabels[key]}
                        categories={categories}
                        onEdit={openEdit}
                    />
                ))}
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing
                    ? editing.is_predefined ? 'Personalizar Categoría' : 'Editar Categoría'
                    : 'Nueva Categoría'
                }
            >
                <CategoryForm category={editing} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

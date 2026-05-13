import { useState } from 'react';
import { Supplier } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Modal from '@/components/UI/Modal';
import Select from '@/components/UI/Select';
import SupplierForm from './components/SupplierForm';
import { router } from '@inertiajs/react';

interface Props {
    suppliers: { data: Supplier[] };
    filters: { category?: string };
}

const categoryOptions = [
    { value: 'seeds', label: 'Semillas' },
    { value: 'fertilizer', label: 'Fertilizante' },
    { value: 'pesticide', label: 'Pesticida' },
    { value: 'labor', label: 'Mano de obra' },
    { value: 'other', label: 'Otro' },
];

const categoryLabels: Record<string, string> = {
    seeds: 'Semillas',
    fertilizer: 'Fertilizante',
    pesticide: 'Pesticida',
    labor: 'Mano de obra',
    other: 'Otro',
};

export default function SuppliersIndex({ suppliers, filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | undefined>(undefined);

    const openEdit = (s: Supplier) => { setEditing(s); setModalOpen(true); };
    const openCreate = () => { setEditing(undefined); setModalOpen(true); };

    const handleDelete = (s: Supplier) => {
        if (confirm(`¿Eliminar al proveedor "${s.name}"?`)) {
            router.delete(`/suppliers/${s.id}`);
        }
    };

    return (
        <AppLayout title="Proveedores">
            <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
                <Select
                    options={categoryOptions}
                    value={filters.category ?? ''}
                    onChange={(e) =>
                        router.get('/suppliers', e.target.value ? { category: e.target.value } : {}, { preserveState: true, replace: true })
                    }
                    placeholder="Todas las categorías"
                />
                <Button onClick={openCreate}>+ Agregar proveedor</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">Teléfono</th>
                                <th className="px-4 py-3">Notas</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {suppliers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        Sin proveedores registrados.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.data.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="indigo">{categoryLabels[s.category] ?? s.category}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{s.phone ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.notes ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>Eliminar</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
                <SupplierForm supplier={editing} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

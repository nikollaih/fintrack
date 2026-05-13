import { useState } from 'react';
import { Buyer } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Modal from '@/components/UI/Modal';
import Select from '@/components/UI/Select';
import BuyerForm from './components/BuyerForm';
import { router } from '@inertiajs/react';

interface Props {
    buyers: { data: Buyer[] };
    filters: { type?: string };
}

const typeOptions = [
    { value: 'plaza', label: 'Plaza' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'intermediary', label: 'Intermediario' },
    { value: 'direct', label: 'Directo' },
    { value: 'other', label: 'Otro' },
];

const typeLabels: Record<string, string> = {
    plaza: 'Plaza',
    restaurant: 'Restaurante',
    intermediary: 'Intermediario',
    direct: 'Directo',
    other: 'Otro',
};

export default function BuyersIndex({ buyers, filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Buyer | undefined>(undefined);

    const openEdit = (b: Buyer) => { setEditing(b); setModalOpen(true); };
    const openCreate = () => { setEditing(undefined); setModalOpen(true); };

    const handleDelete = (b: Buyer) => {
        if (confirm(`¿Eliminar al comprador "${b.name}"?`)) {
            router.delete(`/buyers/${b.id}`);
        }
    };

    return (
        <AppLayout title="Compradores">
            <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
                <Select
                    options={typeOptions}
                    value={filters.type ?? ''}
                    onChange={(e) =>
                        router.get('/buyers', e.target.value ? { type: e.target.value } : {}, { preserveState: true, replace: true })
                    }
                    placeholder="Todos los tipos"
                />
                <Button onClick={openCreate}>+ Agregar comprador</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Teléfono</th>
                                <th className="px-4 py-3">Ubicación</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {buyers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        Sin compradores registrados.
                                    </td>
                                </tr>
                            ) : (
                                buyers.data.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="purple">{typeLabels[b.type] ?? b.type}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{b.phone ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-500">{b.location ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>Editar</Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(b)}>Eliminar</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Comprador' : 'Nuevo Comprador'}>
                <BuyerForm buyer={editing} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

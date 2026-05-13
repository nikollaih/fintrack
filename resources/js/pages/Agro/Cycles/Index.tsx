import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { CropCycle } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Modal from '@/components/UI/Modal';
import CycleForm from './components/CycleForm';

interface Props {
    cycles: { data: CropCycle[] };
}

const statusVariants: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow'> = {
    planned: 'gray',
    active: 'blue',
    harvested: 'green',
    failed: 'red',
};

const statusLabels: Record<string, string> = {
    planned: 'Planeado',
    active: 'Activo',
    harvested: 'Cosechado',
    failed: 'Fallido',
};

export default function CyclesIndex({ cycles }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CropCycle | undefined>(undefined);

    const openCreate = () => { setEditing(undefined); setModalOpen(true); };
    const openEdit = (c: CropCycle) => { setEditing(c); setModalOpen(true); };

    const handleDelete = (c: CropCycle) => {
        if (confirm(`¿Eliminar el ciclo "${c.crop_type}"?`)) {
            router.delete(`/crop-cycles/${c.id}`);
        }
    };

    return (
        <AppLayout title="Ciclos de Cultivo">
            <div className="flex justify-end mb-4">
                <Button onClick={openCreate}>+ Nuevo ciclo</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {cycles.data.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        Sin ciclos registrados. Crea el primero.
                    </div>
                ) : (
                    cycles.data.map((cycle) => (
                        <Card key={cycle.id}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{cycle.crop_type}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{cycle.location}</p>
                                </div>
                                <Badge variant={statusVariants[cycle.status] ?? 'gray'}>
                                    {statusLabels[cycle.status] ?? cycle.status}
                                </Badge>
                            </div>

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                                <dt className="text-gray-500">Área</dt>
                                <dd className="text-gray-900">{cycle.area_sqm} m²</dd>
                                <dt className="text-gray-500">Sembrado</dt>
                                <dd className="text-gray-900">{cycle.sown_at}</dd>
                                {cycle.expected_harvest_at && (
                                    <>
                                        <dt className="text-gray-500">Cosecha esperada</dt>
                                        <dd className="text-gray-900">{cycle.expected_harvest_at}</dd>
                                    </>
                                )}
                            </dl>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <Link
                                    href={`/crop-cycles/${cycle.id}`}
                                    className="text-sm text-primary-600 font-medium hover:underline"
                                >
                                    Ver detalle →
                                </Link>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(cycle)}>Editar</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(cycle)}>Eliminar</Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Ciclo' : 'Nuevo Ciclo de Cultivo'}
                size="lg"
            >
                <CycleForm cycle={editing} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

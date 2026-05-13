import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Buyer, Category, CropCycle, Supplier } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card, { CardHeader } from '@/components/UI/Card';
import Badge from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import CycleTimeline from './components/CycleTimeline';
import ExpensesByPhase from './components/ExpensesByPhase';
import SalesList from './components/SalesList';
import ProfitSummary from './components/ProfitSummary';
import ExpenseForm from './components/ExpenseForm';
import SaleForm from './components/SaleForm';

interface Props {
    cycle: CropCycle;
    suppliers?: { data: Supplier[] };
    buyers?: { data: Buyer[] };
    agro_categories?: { data: Category[] };
}

const statusVariants: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
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

export default function CycleShow({ cycle, suppliers, buyers, agro_categories }: Props) {
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [saleModalOpen, setSaleModalOpen] = useState(false);

    return (
        <AppLayout>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/crop-cycles" className="text-sm text-gray-500 hover:underline">
                            ← Ciclos
                        </Link>
                        <Badge variant={statusVariants[cycle.status] ?? 'gray'}>
                            {statusLabels[cycle.status] ?? cycle.status}
                        </Badge>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">{cycle.crop_type}</h1>
                    <p className="text-sm text-gray-500">{cycle.location} · {cycle.area_sqm} m²</p>
                </div>
            </div>

            <Card className="mb-4">
                <CardHeader title="Progreso" />
                <CycleTimeline cycle={cycle} />
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <dt className="text-gray-500">Fecha de siembra</dt>
                    <dd className="text-gray-900">{cycle.sown_at}</dd>
                    {cycle.expected_harvest_at && (
                        <>
                            <dt className="text-gray-500">Cosecha esperada</dt>
                            <dd className="text-gray-900">{cycle.expected_harvest_at}</dd>
                        </>
                    )}
                    {cycle.harvested_at && (
                        <>
                            <dt className="text-gray-500">Cosechado el</dt>
                            <dd className="text-gray-900">{cycle.harvested_at}</dd>
                        </>
                    )}
                </dl>
                {cycle.notes && (
                    <p className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">{cycle.notes}</p>
                )}
            </Card>

            <Card className="mb-4">
                <CardHeader title="Resumen P&G" />
                <ProfitSummary cycle={cycle} />
            </Card>

            <Card className="mb-4">
                <CardHeader
                    title="Gastos"
                    action={
                        <Button size="sm" onClick={() => setExpenseModalOpen(true)}>+ Agregar gasto</Button>
                    }
                />
                <ExpensesByPhase expenses={cycle.expenses ?? []} />
            </Card>

            <Card>
                <CardHeader
                    title="Ventas"
                    action={
                        <Button size="sm" onClick={() => setSaleModalOpen(true)}>+ Registrar venta</Button>
                    }
                />
                <SalesList sales={cycle.sales ?? []} />
            </Card>

            <Modal
                open={expenseModalOpen}
                onClose={() => setExpenseModalOpen(false)}
                title="Agregar Gasto"
                size="lg"
            >
                <ExpenseForm
                    cycleId={cycle.id}
                    suppliers={suppliers?.data ?? []}
                    agroCategories={agro_categories?.data ?? []}
                    onSuccess={() => setExpenseModalOpen(false)}
                />
            </Modal>

            <Modal
                open={saleModalOpen}
                onClose={() => setSaleModalOpen(false)}
                title="Registrar Venta"
                size="lg"
            >
                <SaleForm
                    cycleId={cycle.id}
                    buyers={buyers?.data ?? []}
                    onSuccess={() => setSaleModalOpen(false)}
                />
            </Modal>
        </AppLayout>
    );
}

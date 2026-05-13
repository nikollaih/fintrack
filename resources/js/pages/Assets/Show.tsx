import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Asset, AssetMovement } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card, { CardHeader } from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Modal from '@/components/UI/Modal';
import { formatCOP, formatPercent } from '@/utils/currency';
import MovementForm from './components/MovementForm';
import ProjectionChart from './components/ProjectionChart';
import BalanceTimeline, { TimelineEntry } from './components/BalanceTimeline';

interface ComputedData {
    balance: number;
    interest_earned: number;
    interest_this_month: number;
    principal: number;
    maturity_value: number | null;
    days_to_maturity: number | null;
}

interface Props {
    asset: Asset;
    computed: ComputedData;
    movements: { data: AssetMovement[] };
    timeline: TimelineEntry[];
}

const typeLabels: Record<string, string> = {
    cajita: 'Cajita',
    cdt: 'CDT',
    cooperativa: 'Cooperativa',
    cash: 'Efectivo',
    other: 'Otro',
};

const typeColors: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
    cajita: 'blue',
    cdt: 'green',
    cooperativa: 'yellow',
    cash: 'gray',
    other: 'gray',
};

export default function AssetShow({ asset, computed, movements, timeline }: Props) {
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const color = typeColors[asset.type] ?? 'gray';

    const handleDeleteMovement = (id: string) => {
        if (confirm('¿Eliminar este movimiento?')) {
            router.delete(`/asset-movements/${id}`);
        }
    };

    return (
        <AppLayout title="">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <a href="/assets" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </a>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
                        <Badge variant={color}>{typeLabels[asset.type] ?? asset.type}</Badge>
                    </div>
                </div>
                <Button onClick={() => setMovementModalOpen(true)}>
                    + Agregar movimiento
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Saldo actual"
                    value={formatCOP(computed.balance)}
                    className="bg-primary-600 text-white"
                    valueClass="text-white text-2xl"
                    labelClass="text-primary-100"
                />
                <StatCard
                    label="Interés acumulado"
                    value={`+${formatCOP(computed.interest_earned)}`}
                    className="bg-white border border-gray-200"
                    valueClass="text-green-700 text-xl"
                    labelClass="text-gray-500"
                />
                <StatCard
                    label="Capital inicial"
                    value={formatCOP(computed.principal)}
                    className="bg-white border border-gray-200"
                    valueClass="text-gray-900 text-xl"
                    labelClass="text-gray-500"
                />
                <StatCard
                    label="Interés este mes"
                    value={`+${formatCOP(computed.interest_this_month)}`}
                    className="bg-white border border-gray-200"
                    valueClass="text-green-600 text-xl"
                    labelClass="text-gray-500"
                />
            </div>

            {/* CDT-specific section */}
            {asset.maturity_date && (
                <Card className="mb-6">
                    <CardHeader title="Información de vencimiento" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoItem label="Fecha inicio" value={asset.start_date} />
                        <InfoItem label="Fecha vencimiento" value={asset.maturity_date} />
                        <InfoItem
                            label="Días restantes"
                            value={computed.days_to_maturity !== null ? `${computed.days_to_maturity} días` : '—'}
                        />
                        {computed.maturity_value !== null && (
                            <InfoItem
                                label="Valor al vencer"
                                value={formatCOP(computed.maturity_value)}
                                valueClass="text-green-700 font-bold"
                            />
                        )}
                        {asset.rate_ea && (
                            <InfoItem
                                label="Tasa EA"
                                value={formatPercent(asset.rate_ea)}
                            />
                        )}
                        <InfoItem
                            label="Capitalización"
                            value={
                                asset.compounding_frequency === 'daily' ? 'Diaria' :
                                asset.compounding_frequency === 'monthly' ? 'Mensual' :
                                'Al vencimiento'
                            }
                        />
                    </div>
                </Card>
            )}

            {/* Projection chart */}
            {asset.rate_ea && (
                <Card className="mb-6">
                    <ProjectionChart assetId={asset.id} />
                </Card>
            )}

            {/* Timeline + movements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Historial de saldo" />
                    <BalanceTimeline timeline={timeline} />
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900">Movimientos</h3>
                        <Button size="sm" onClick={() => setMovementModalOpen(true)}>
                            + Agregar
                        </Button>
                    </div>
                    {movements.data.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center">Sin movimientos registrados.</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {movements.data.map((mov) => (
                                <div key={mov.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            {mov.note ?? (mov.amount >= 0 ? 'Depósito' : 'Retiro')}
                                        </p>
                                        <p className="text-xs text-gray-400">{mov.date}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-semibold ${mov.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {mov.amount >= 0 ? '+' : ''}{formatCOP(mov.amount)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteMovement(mov.id)}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Movement modal */}
            <Modal
                open={movementModalOpen}
                onClose={() => setMovementModalOpen(false)}
                title="Agregar movimiento"
            >
                <MovementForm
                    assetId={asset.id}
                    onSuccess={() => setMovementModalOpen(false)}
                />
            </Modal>
        </AppLayout>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    className?: string;
    valueClass?: string;
    labelClass?: string;
}

function StatCard({ label, value, className = '', valueClass = '', labelClass = '' }: StatCardProps) {
    return (
        <div className={`rounded-xl p-4 ${className}`}>
            <p className={`text-xs font-medium ${labelClass}`}>{label}</p>
            <p className={`font-bold mt-1 ${valueClass}`}>{value}</p>
        </div>
    );
}

interface InfoItemProps {
    label: string;
    value: string;
    valueClass?: string;
}

function InfoItem({ label, value, valueClass = 'text-gray-900' }: InfoItemProps) {
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-sm font-medium mt-0.5 ${valueClass}`}>{value}</p>
        </div>
    );
}

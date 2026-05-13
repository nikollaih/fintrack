import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Asset } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import Badge from '@/components/UI/Badge';
import AssetForm from './components/AssetForm';
import { formatCOP, formatPercent } from '@/utils/currency';

interface Props {
    assets: Asset[];
    total_balance: number;
}

const typeLabels: Record<string, string> = {
    cajita: 'Cajita',
    cdt: 'CDT',
    cooperativa: 'Cooperativa',
    cash: 'Efectivo',
    other: 'Otro',
};

const typeColors: Record<string, 'blue' | 'green' | 'yellow' | 'gray' | 'red'> = {
    cajita: 'blue',
    cdt: 'green',
    cooperativa: 'yellow',
    cash: 'gray',
    other: 'gray',
};

export default function AssetsIndex({ assets, total_balance }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Asset | undefined>(undefined);

    const openCreate = () => { setEditing(undefined); setModalOpen(true); };
    const openEdit = (asset: Asset) => { setEditing(asset); setModalOpen(true); };

    const handleDelete = (asset: Asset) => {
        if (confirm(`¿Eliminar el activo "${asset.name}"?`)) {
            router.delete(`/assets/${asset.id}`);
        }
    };

    return (
        <AppLayout title="Activos">
            {/* Summary bar */}
            <div className="mb-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-sm text-primary-100 font-medium">Portafolio total</p>
                    <p className="text-3xl font-bold mt-1">{formatCOP(total_balance)}</p>
                </div>
                <Button onClick={openCreate} variant="secondary">
                    + Nueva inversión
                </Button>
            </div>

            {assets.length === 0 ? (
                <Card>
                    <p className="text-center text-gray-400 py-10">
                        Sin activos registrados. Agrega el primero.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Activo' : 'Nueva Inversión'}
            >
                <AssetForm asset={editing} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

interface AssetCardProps {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
}

function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
    const balance = asset.balance ?? asset.initial_balance;
    const color = typeColors[asset.type] ?? 'gray';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant={color}>{typeLabels[asset.type] ?? asset.type}</Badge>
                    {asset.maturity_date && asset.days_to_maturity !== undefined && asset.days_to_maturity !== null && (
                        <Badge variant={asset.days_to_maturity <= 30 ? 'red' : 'yellow'}>
                            {asset.days_to_maturity}d
                        </Badge>
                    )}
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(asset)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(asset)}>×</Button>
                </div>
            </div>

            {/* Name and balance */}
            <div>
                <p className="text-sm font-medium text-gray-500">{asset.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCOP(balance)}</p>
                {asset.interest_earned !== undefined && asset.interest_earned > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                        +{formatCOP(asset.interest_earned)} interés acumulado
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-gray-400 text-xs">Capital inicial</p>
                    <p className="font-medium text-gray-700">{formatCOP(asset.initial_balance)}</p>
                </div>
                {asset.rate_ea && (
                    <div>
                        <p className="text-gray-400 text-xs">Tasa EA</p>
                        <p className="font-medium text-gray-700">{formatPercent(asset.rate_ea)}</p>
                    </div>
                )}
                {asset.maturity_date && (
                    <div>
                        <p className="text-gray-400 text-xs">Vencimiento</p>
                        <p className="font-medium text-gray-700">{asset.maturity_date}</p>
                    </div>
                )}
                {asset.maturity_value !== undefined && asset.maturity_value !== null && (
                    <div>
                        <p className="text-gray-400 text-xs">Valor al vencer</p>
                        <p className="font-medium text-green-700">{formatCOP(asset.maturity_value)}</p>
                    </div>
                )}
            </div>

            {/* Detail link */}
            <div className="pt-1 border-t border-gray-100">
                <a
                    href={`/assets/${asset.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Ver detalle →
                </a>
            </div>
        </div>
    );
}

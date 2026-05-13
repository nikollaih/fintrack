import { Asset } from '@/types';
import { formatCOP, formatPercent } from '@/utils/currency';
import Badge from '@/components/UI/Badge';

interface AssetsListProps {
    assets: Asset[];
}

const assetTypeLabels: Record<string, string> = {
    cajita: 'Cajita',
    cdt: 'CDT',
    cooperativa: 'Cooperativa',
    cash: 'Efectivo',
    other: 'Otro',
};

export default function AssetsList({ assets }: AssetsListProps) {
    if (assets.length === 0) {
        return <p className="text-sm text-gray-400 py-4 text-center">Sin activos registrados.</p>;
    }

    return (
        <div className="divide-y divide-gray-100">
            {assets.map((asset) => {
                const balance = asset.balance ?? asset.initial_balance;
                return (
                    <div key={asset.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="blue">{assetTypeLabels[asset.type] ?? asset.type}</Badge>
                            <div>
                                <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                                {asset.days_to_maturity !== null && asset.days_to_maturity !== undefined && (
                                    <span className="ml-2 text-xs text-amber-600">
                                        vence en {asset.days_to_maturity}d
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatCOP(balance)}</p>
                            {asset.interest_earned !== undefined && asset.interest_earned > 0 && (
                                <p className="text-xs text-green-600">
                                    +{formatCOP(asset.interest_earned)} total
                                </p>
                            )}
                            {asset.rate_ea && (
                                <p className="text-xs text-gray-400">{formatPercent(asset.rate_ea)} EA</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

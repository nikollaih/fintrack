import { CropSale } from '@/types';
import { formatCOP } from '@/utils/currency';
import Button from '@/components/UI/Button';
import { router } from '@inertiajs/react';

interface SalesListProps {
    sales: CropSale[];
}

export default function SalesList({ sales }: SalesListProps) {
    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar esta venta?')) {
            router.delete(`/crop-sales/${id}`);
        }
    };

    if (sales.length === 0) {
        return <p className="text-sm text-gray-400 py-2">Sin ventas registradas.</p>;
    }

    return (
        <div className="divide-y divide-gray-100">
            {sales.map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                        <p className="font-medium text-gray-900">
                            {sale.quantity} {sale.unit} @ {formatCOP(sale.unit_price)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {sale.sale_date}
                            {sale.buyer && <span className="ml-2">— {sale.buyer.name}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-700">{formatCOP(sale.total)}</span>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(sale.id)}>×</Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

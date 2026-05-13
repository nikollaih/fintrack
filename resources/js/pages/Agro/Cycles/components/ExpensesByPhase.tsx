import { CropExpense } from '@/types';
import { formatCOP } from '@/utils/currency';
import Badge from '@/components/UI/Badge';
import CategoryChip from '@/components/UI/CategoryChip';
import Button from '@/components/UI/Button';
import { router } from '@inertiajs/react';

interface ExpensesByPhaseProps {
    expenses: CropExpense[];
}

const phases = ['preparation', 'sowing', 'maintenance', 'harvest'] as const;

const phaseLabels: Record<string, string> = {
    preparation: 'Preparación',
    sowing: 'Siembra',
    maintenance: 'Mantenimiento',
    harvest: 'Cosecha',
};

export default function ExpensesByPhase({ expenses }: ExpensesByPhaseProps) {
    const grouped = phases.reduce<Record<string, CropExpense[]>>((acc, phase) => {
        acc[phase] = expenses.filter((e) => e.phase === phase);
        return acc;
    }, {});

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar este gasto?')) {
            router.delete(`/crop-expenses/${id}`);
        }
    };

    return (
        <div className="space-y-4">
            {phases.map((phase) => {
                const list = grouped[phase];
                if (list.length === 0) return null;
                const total = list.reduce((s, e) => s + e.amount, 0);

                return (
                    <div key={phase}>
                        <div className="flex items-center justify-between mb-2">
                            <Badge variant="yellow">{phaseLabels[phase]}</Badge>
                            <span className="text-sm font-semibold text-gray-700">{formatCOP(total)}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {list.map((expense) => (
                                <div key={expense.id} className="py-2 flex items-center justify-between text-sm">
                                    <div>
                                        <CategoryChip category={expense.category} fallback={expense.category_text} />
                                        {expense.supplier && (
                                            <span className="text-gray-500 ml-2">— {expense.supplier.name}</span>
                                        )}
                                        {expense.description && (
                                            <p className="text-xs text-gray-400">{expense.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-gray-700">{formatCOP(expense.amount)}</span>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(expense.id)}>×</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

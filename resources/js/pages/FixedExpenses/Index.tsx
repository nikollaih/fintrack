import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Category, FixedExpense, FixedExpenseCheck } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import { useToast } from '@/components/UI/Toast';
import { apiFetch } from '@/utils/api';
import ChecklistItem from './components/ChecklistItem';
import FixedExpenseForm from './components/FixedExpenseForm';
import SummaryPanel from './components/SummaryPanel';

interface Props {
    expenses: { data: FixedExpense[] };
    categories: { data: Category[] };
    month: number;
    year: number;
}

export default function FixedExpensesIndex({ expenses, categories, month, year }: Props) {
    const { showToast } = useToast();
    const today = new Date().getDate();

    // Local check state for optimistic UI — synced from server props
    const [checksState, setChecksState] = useState<Record<string, FixedExpenseCheck | null>>(
        () => Object.fromEntries(expenses.data.map((e) => [e.id, e.check ?? null])),
    );
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    const [paying, setPaying] = useState<Record<string, boolean>>({});

    // Re-sync when Inertia navigates and props refresh
    useEffect(() => {
        setChecksState(Object.fromEntries(expenses.data.map((e) => [e.id, e.check ?? null])));
    }, [expenses]);

    const getCheck = (expense: FixedExpense) => checksState[expense.id] ?? expense.check;

    const handleToggle = async (expense: FixedExpense) => {
        const check = getCheck(expense);
        if (!check) return;

        const prev = { ...check };
        const newIsPaid = !check.is_paid;

        // Optimistic update
        setChecksState((s) => ({ ...s, [expense.id]: { ...check, is_paid: newIsPaid, paid_at: newIsPaid ? new Date().toISOString() : null } }));
        setToggling((s) => ({ ...s, [expense.id]: true }));

        try {
            const res = await apiFetch(`/fixed-expenses/${expense.id}/toggle`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setChecksState((s) => ({ ...s, [expense.id]: data.check }));
            showToast(newIsPaid ? '✓ Marcado como pagado' : 'Marcado como pendiente', newIsPaid ? 'success' : 'info');
        } catch {
            setChecksState((s) => ({ ...s, [expense.id]: prev })); // revert
            showToast('Error al actualizar el estado', 'error');
        } finally {
            setToggling((s) => ({ ...s, [expense.id]: false }));
        }
    };

    const handlePay = async (expense: FixedExpense) => {
        setPaying((s) => ({ ...s, [expense.id]: true }));
        try {
            const res = await apiFetch(`/fixed-expenses/${expense.id}/pay`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setChecksState((s) => ({ ...s, [expense.id]: data.check }));
            showToast('Transacción creada y gasto marcado como pagado');
        } catch {
            showToast('Error al registrar el pago', 'error');
        } finally {
            setPaying((s) => ({ ...s, [expense.id]: false }));
        }
    };

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<FixedExpense | undefined>(undefined);

    const openCreate = () => { setEditing(undefined); setModalOpen(true); };
    const openEdit = (e: FixedExpense) => { setEditing(e); setModalOpen(true); };

    const handleDelete = (expense: FixedExpense) => {
        if (confirm(`¿Eliminar "${expense.name}" de los gastos fijos?`)) {
            router.delete(`/fixed-expenses/${expense.id}`);
        }
    };

    // Computed summary (uses optimistic state)
    const paidExpenses = expenses.data.filter((e) => getCheck(e)?.is_paid);
    const summary = {
        total: expenses.data.length,
        paid: paidExpenses.length,
        totalAmount: expenses.data.reduce((s, e) => s + e.amount, 0),
        paidAmount: paidExpenses.reduce((s, e) => s + e.amount, 0),
        pendingAmount: 0,
    };
    summary.pendingAmount = summary.totalAmount - summary.paidAmount;

    const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gastos Fijos Mensuales</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{monthNames[month]} {year}</p>
                </div>
                <Button onClick={openCreate}>+ Nuevo gasto fijo</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: checklist */}
                <div className="lg:col-span-2 space-y-2">
                    {expenses.data.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                            <p className="text-gray-400 mb-3">Sin gastos fijos configurados.</p>
                            <Button onClick={openCreate} variant="secondary" size="sm">
                                Agregar el primero
                            </Button>
                        </div>
                    ) : (
                        expenses.data.map((expense) => (
                            <ChecklistItem
                                key={expense.id}
                                expense={expense}
                                check={getCheck(expense)}
                                today={today}
                                toggling={toggling[expense.id] ?? false}
                                paying={paying[expense.id] ?? false}
                                onToggle={() => handleToggle(expense)}
                                onPay={() => handlePay(expense)}
                                onEdit={() => openEdit(expense)}
                            />
                        ))
                    )}
                </div>

                {/* Right: summary */}
                <div className="lg:col-span-1">
                    <SummaryPanel
                        total={summary.total}
                        paid={summary.paid}
                        totalAmount={summary.totalAmount}
                        paidAmount={summary.paidAmount}
                        pendingAmount={summary.pendingAmount}
                        month={month}
                        year={year}
                    />
                </div>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
            >
                <FixedExpenseForm expense={editing} categories={categories.data} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

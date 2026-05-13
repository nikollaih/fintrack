import { useState } from 'react';
import { Account, Category, MonthlySummary, Transaction } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card, { CardHeader } from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import MonthlyBarChart from '@/components/Charts/MonthlyBarChart';
import TransactionFilters from './components/TransactionFilters';
import TransactionForm from './components/TransactionForm';
import TransactionRow from './components/TransactionRow';

interface Filters {
    month?: string;
    type?: string;
    category_id?: string;
    account_id?: string;
}

interface Props {
    transactions: { data: Transaction[] };
    monthly_summary: MonthlySummary[];
    accounts: { data: Account[] };
    categories: { data: Category[] };
    filters: Filters;
}

export default function TransactionsIndex({ transactions, monthly_summary, accounts, categories, filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Transaction | undefined>(undefined);

    const openCreate = () => { setEditing(undefined); setModalOpen(true); };
    const openEdit = (t: Transaction) => { setEditing(t); setModalOpen(true); };

    return (
        <AppLayout title="Transacciones">
            {monthly_summary.length > 0 && (
                <Card className="mb-4">
                    <CardHeader title="Resumen Mensual" />
                    <MonthlyBarChart data={monthly_summary} />
                </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                <TransactionFilters filters={filters} />
                <Button onClick={openCreate} className="self-end sm:self-auto">
                    + Agregar transacción
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3 text-right">Monto</th>
                                <th className="px-4 py-3">Método</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                        Sin transacciones encontradas.
                                    </td>
                                </tr>
                            ) : (
                                transactions.data.map((tx) => (
                                    <TransactionRow key={tx.id} transaction={tx} onEdit={openEdit} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Transacción' : 'Nueva Transacción'}
                size="lg"
            >
                <TransactionForm transaction={editing} accounts={accounts.data} categories={categories.data} onSuccess={() => setModalOpen(false)} />
            </Modal>
        </AppLayout>
    );
}

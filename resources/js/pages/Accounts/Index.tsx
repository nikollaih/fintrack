import { useState } from 'react';
import { Account } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import AccountCard from './components/AccountCard';
import AccountForm from './components/AccountForm';
import TransferForm from './components/TransferForm';
import { formatCOP } from '@/utils/currency';

interface Props {
    accounts: { data: Account[] };
}

function SectionHeader({ label, sublabel }: { label: string; sublabel?: string }) {
    return (
        <div className="mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{label}</h2>
            {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
    );
}

export default function AccountsIndex({ accounts }: Props) {
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [editing, setEditing] = useState<Account | undefined>(undefined);
    const [defaultFromId, setDefaultFromId] = useState<string | undefined>(undefined);

    const openCreate   = () => { setEditing(undefined); setAccountModalOpen(true); };
    const openEdit     = (a: Account) => { setEditing(a); setAccountModalOpen(true); };
    const openTransfer = (fromId?: string) => { setDefaultFromId(fromId); setTransferModalOpen(true); };

    const active   = accounts.data.filter((a) => a.is_active);
    const inactive = accounts.data.filter((a) => !a.is_active);

    const assetAccounts = active.filter((a) => !a.is_credit_card);
    const ccAccounts    = active.filter((a) =>  a.is_credit_card);

    const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0);
    const totalDebt   = ccAccounts.reduce((s, a) => s + a.balance, 0);
    const netWorth    = totalAssets - totalDebt;

    return (
        <AppLayout title="Cuentas">
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">Activos y pasivos de tus cuentas</p>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openTransfer()}>↔ Transferencia</Button>
                    <Button onClick={openCreate}>+ Nueva cuenta</Button>
                </div>
            </div>

            {/* ── Asset accounts ─────────────────────────────────────────── */}
            {assetAccounts.length > 0 && (
                <section className="mb-8">
                    <SectionHeader
                        label="Activos"
                        sublabel="Dinero disponible en tus cuentas"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {assetAccounts.map((account) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                onEdit={() => openEdit(account)}
                                onTransfer={() => openTransfer(account.id)}
                            />
                        ))}
                    </div>
                    <div className="flex justify-end mt-3 pr-1">
                        <span className="text-xs text-gray-500 mr-2">Total activos:</span>
                        <span className="text-sm font-bold text-gray-900">{formatCOP(totalAssets)}</span>
                    </div>
                </section>
            )}

            {/* ── Credit card liabilities ───────────────────────────────── */}
            {ccAccounts.length > 0 && (
                <section className="mb-8">
                    <SectionHeader
                        label="Pasivos — Tarjetas de crédito"
                        sublabel="Deuda pendiente. Para pagar una TC usa Transferencia desde tu cuenta de ahorros, no un gasto."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {ccAccounts.map((account) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                onEdit={() => openEdit(account)}
                                onTransfer={() => openTransfer(undefined)}
                            />
                        ))}
                    </div>
                    <div className="flex justify-end mt-3 pr-1">
                        <span className="text-xs text-gray-500 mr-2">Total deuda TC:</span>
                        <span className="text-sm font-bold text-red-600">{formatCOP(totalDebt)}</span>
                    </div>
                </section>
            )}

            {/* ── Net worth footer ──────────────────────────────────────── */}
            {active.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Patrimonio neto</p>
                            {ccAccounts.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatCOP(totalAssets)} activos − {formatCOP(totalDebt)} deuda TC
                                </p>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatCOP(netWorth)}
                        </p>
                    </div>

                    {ccAccounts.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <span className="font-semibold">¿Cómo funciona la TC?</span>{' '}
                                Cada compra con TC registra un gasto y aumenta la deuda.
                                Cuando pagas la factura, registra una{' '}
                                <span className="font-semibold">Transferencia</span>{' '}
                                desde tu cuenta de ahorros a la TC — eso reduce la deuda sin crear un
                                gasto duplicado, y el patrimonio neto no cambia.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Empty state ───────────────────────────────────────────── */}
            {active.length === 0 && (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                    <p className="text-gray-400 mb-3">Sin cuentas configuradas.</p>
                    <Button onClick={openCreate} variant="secondary" size="sm">Crear primera cuenta</Button>
                </div>
            )}

            {/* ── Inactive accounts ─────────────────────────────────────── */}
            {inactive.length > 0 && (
                <div className="mt-8">
                    <SectionHeader label="Cuentas inactivas" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
                        {inactive.map((account) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                onEdit={() => openEdit(account)}
                                onTransfer={() => openTransfer(account.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <Modal
                open={accountModalOpen}
                onClose={() => setAccountModalOpen(false)}
                title={editing ? 'Editar Cuenta' : 'Nueva Cuenta'}
            >
                <AccountForm account={editing} onSuccess={() => setAccountModalOpen(false)} />
            </Modal>

            <Modal
                open={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                title="Nueva Transferencia"
            >
                <TransferForm
                    accounts={active}
                    defaultFromId={defaultFromId}
                    onSuccess={() => setTransferModalOpen(false)}
                />
            </Modal>
        </AppLayout>
    );
}

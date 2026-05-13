import { AccountsSummary, AccountSummaryItem, AccountType } from '@/types';
import { formatCOP } from '@/utils/currency';
import { Link } from '@inertiajs/react';

interface AccountsSummaryProps {
    summary: AccountsSummary;
}

const typeLabels: Record<AccountType, string> = {
    savings: 'Ahorros',
    checking: 'Corriente',
    credit_card: 'Tarjeta crédito',
    cash: 'Efectivo',
    digital_wallet: 'Billetera digital',
    investment: 'Inversión',
};

const assetTypeOrder: AccountType[] = ['savings', 'checking', 'cash', 'digital_wallet', 'investment'];

function AccountLine({ account }: { account: AccountSummaryItem }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700 truncate pr-2">{account.name}</span>
            <span className={`text-sm font-semibold flex-shrink-0 ${account.is_credit_card ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCOP(account.balance)}
            </span>
        </div>
    );
}

function SectionHeader({ label }: { label: string }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{label}</p>
    );
}

export default function AccountsSummaryWidget({ summary }: AccountsSummaryProps) {
    if (summary.accounts.length === 0) return null;

    const assetAccounts = summary.accounts.filter((a) => !a.is_credit_card);
    const ccAccounts    = summary.accounts.filter((a) =>  a.is_credit_card);

    // Group asset accounts by type
    const assetGroups = assetTypeOrder
        .map((type) => ({ type, items: assetAccounts.filter((a) => a.type === type) }))
        .filter((g) => g.items.length > 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Cuentas</h3>
                <Link href="/accounts" className="text-sm text-primary-600 hover:underline">
                    Gestionar →
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Assets column ── */}
                <div className="lg:col-span-1">
                    <SectionHeader label="Activos" />
                    {assetGroups.length === 0 ? (
                        <p className="text-sm text-gray-400">Sin cuentas activas</p>
                    ) : (
                        <div className="space-y-3">
                            {assetGroups.map(({ type, items }) => (
                                <div key={type}>
                                    <p className="text-xs text-gray-400 mb-1">{typeLabels[type]}</p>
                                    {items.map((a) => <AccountLine key={a.id} account={a} />)}
                                </div>
                            ))}
                        </div>
                    )}
                    {summary.total_assets > 0 && (
                        <div className="flex justify-between pt-2 mt-2 border-t border-gray-100">
                            <span className="text-xs font-semibold text-gray-500">Total activos</span>
                            <span className="text-sm font-bold text-gray-900">{formatCOP(summary.total_assets)}</span>
                        </div>
                    )}
                </div>

                {/* ── Liabilities column ── */}
                <div className="lg:col-span-1">
                    {ccAccounts.length > 0 && (
                        <>
                            <SectionHeader label="Pasivos (Deuda TC)" />
                            {ccAccounts.map((a) => <AccountLine key={a.id} account={a} />)}
                            <div className="flex justify-between pt-2 mt-2 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-500">Total deuda</span>
                                <span className="text-sm font-bold text-red-600">
                                    {formatCOP(summary.total_debt)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Net worth column ── */}
                <div className="lg:col-span-1 flex items-center justify-center">
                    <div className="text-center bg-gray-50 rounded-xl p-5 w-full">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Patrimonio neto
                        </p>
                        <p className={`text-2xl font-bold ${summary.net_worth >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatCOP(summary.net_worth)}
                        </p>
                        <div className="text-xs text-gray-400 mt-2 leading-tight space-y-0.5">
                            <div>{formatCOP(summary.total_assets)} <span className="text-gray-300">cuentas</span></div>
                            {summary.total_debt > 0 && (
                                <div>− <span className="text-red-400">{formatCOP(summary.total_debt)}</span> <span className="text-gray-300">TC</span></div>
                            )}
                            {(summary as any).total_liabilities > 0 && (
                                <div>− <span className="text-rose-500">{formatCOP((summary as any).total_liabilities)}</span> <span className="text-gray-300">créditos</span></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

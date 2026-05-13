import { Account, AccountsSummary, Asset, DashboardSummary, DebtSummary, FixedExpensesSummary, Transaction } from '@/types';
import AppLayout from '@/layouts/AppLayout';
import Card, { CardHeader } from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import SummaryCard from './components/SummaryCard';
import FixedExpensesWidget from './components/FixedExpensesWidget';
import AccountsSummaryWidget from './components/AccountsSummary';
import AssetsList from './components/AssetsList';
import RecentTransactions from './components/RecentTransactions';
import RetirementWidget from './components/RetirementWidget';
import DebtWidget from './components/DebtWidget';
import { Link } from '@inertiajs/react';

interface RetirementSummary {
    progress_pct: number;
    projected_retirement_age: number;
    target_retirement_age: number;
    on_track: boolean;
    required_corpus: number;
    projected_corpus: number;
}

interface Props {
    summary: DashboardSummary;
    assets: Asset[];
    recent_transactions: { data: Transaction[] };
    fixed_expenses_summary: FixedExpensesSummary;
    accounts_summary: AccountsSummary;
    retirement_summary: RetirementSummary | null;
    debt_summary: DebtSummary | null;
}

export default function Dashboard({ summary, assets, recent_transactions, fixed_expenses_summary, accounts_summary, retirement_summary, debt_summary }: Props) {
    return (
        <AppLayout title="Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                    label="Total Activos"
                    amount={summary.total_assets}
                    trend="neutral"
                    iconBg="bg-blue-50"
                    icon={
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <SummaryCard
                    label="Ingresos del Mes"
                    amount={summary.monthly_income}
                    trend="positive"
                    iconBg="bg-green-50"
                    icon={
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                    }
                />
                <SummaryCard
                    label="Gastos del Mes"
                    amount={summary.monthly_expenses}
                    trend="negative"
                    iconBg="bg-red-50"
                    icon={
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                    }
                />
                <SummaryCard
                    label="Saldo Neto"
                    amount={summary.net_balance}
                    trend={summary.net_balance >= 0 ? 'positive' : 'negative'}
                    iconBg="bg-purple-50"
                    icon={
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
            </div>

            <AccountsSummaryWidget summary={accounts_summary} />

            {debt_summary && (
                <DebtWidget summary={debt_summary} />
            )}

            {retirement_summary && (
                <RetirementWidget summary={retirement_summary} />
            )}

            {fixed_expenses_summary.total > 0 && (
                <div className="mb-4">
                    <FixedExpensesWidget summary={fixed_expenses_summary} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader
                        title="Activos"
                        action={
                            <Link href="/assets">
                                <Button variant="ghost" size="sm">Gestionar</Button>
                            </Link>
                        }
                    />
                    <AssetsList assets={assets} />
                </Card>

                <Card>
                    <CardHeader
                        title="Últimas Transacciones"
                        action={
                            <Link href="/transactions">
                                <Button variant="ghost" size="sm">Ver todas</Button>
                            </Link>
                        }
                    />
                    <RecentTransactions transactions={recent_transactions.data} />
                </Card>
            </div>
        </AppLayout>
    );
}

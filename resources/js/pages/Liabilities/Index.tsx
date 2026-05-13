import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Card from '@/components/UI/Card';
import { LiabilityCard, LiabilityTotals } from '@/types';
import { cop, pct, fmtDate, fmtDateShort, typeLabels, typeColors } from './utils';
import LiabilityForm from './components/LiabilityForm';
import RegisterPaymentModal from './components/RegisterPaymentModal';

interface Account { id: string; name: string; type: string; }

interface Props {
    liabilities: LiabilityCard[];
    totals: LiabilityTotals;
    accounts: Account[];
}

export default function LiabilitiesIndex({ liabilities, totals, accounts }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [registerFor, setRegisterFor] = useState<LiabilityCard | null>(null);

    const active = liabilities.filter(l => l.status === 'active');
    const inactive = liabilities.filter(l => l.status !== 'active');

    function confirmDelete(l: LiabilityCard) {
        if (confirm(`¿Eliminar "${l.name}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/liabilities/${l.id}`);
        }
    }

    return (
        <AppLayout title="Pasivos y Deudas">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                    label="Deuda Total"
                    value={cop(totals.total_debt)}
                    icon={<DebtIcon />}
                    color="rose"
                />
                <SummaryCard
                    label="Compromiso Mensual"
                    value={cop(totals.monthly_commitment)}
                    icon={<CalIcon />}
                    color="amber"
                />
                <SummaryCard
                    label="Intereses Restantes"
                    value={cop(totals.total_remaining_interest)}
                    icon={<TrendIcon />}
                    color="orange"
                    subtitle="Si no cambia nada"
                />
                <SummaryCard
                    label="Libre de Deuda"
                    value={totals.debt_free_date ? fmtDateShort(totals.debt_free_date) : '—'}
                    icon={<FlagIcon />}
                    color="green"
                    subtitle="Última obligación"
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    Pasivos Activos
                    <span className="ml-2 text-sm font-normal text-gray-500">({active.length})</span>
                </h2>
                <Button onClick={() => setShowCreate(true)}>+ Nuevo Pasivo</Button>
            </div>

            {/* Active liabilities */}
            {active.length === 0 && (
                <Card className="text-center py-12">
                    <p className="text-gray-400 text-sm">Sin pasivos activos. ¡Excelente!</p>
                </Card>
            )}

            <div className="space-y-4 mb-8">
                {active.map(l => (
                    <LiabilityCardView
                        key={l.id}
                        liability={l}
                        onRegisterPayment={() => setRegisterFor(l)}
                        onDelete={() => confirmDelete(l)}
                    />
                ))}
            </div>

            {/* Inactive */}
            {inactive.length > 0 && (
                <>
                    <h2 className="text-base font-semibold text-gray-600 mb-3">Historial</h2>
                    <div className="space-y-3">
                        {inactive.map(l => (
                            <div key={l.id}
                                className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge variant={typeColors[l.type] as any}>{typeLabels[l.type]}</Badge>
                                    <span className="text-sm font-medium text-gray-700">{l.name}</span>
                                    <Badge variant={l.status === 'paid_off' ? 'green' : 'yellow'}>
                                        {l.status === 'paid_off' ? 'Pagado' : 'Refinanciado'}
                                    </Badge>
                                </div>
                                <span className="text-sm text-gray-400">{cop(l.original_amount)}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modals */}
            <LiabilityForm open={showCreate} onClose={() => setShowCreate(false)} accounts={accounts} />

            {registerFor && (
                <RegisterPaymentModal
                    open
                    onClose={() => setRegisterFor(null)}
                    liability={registerFor as any}
                    hasLinkedAccount={!!registerFor.linked_account}
                />
            )}
        </AppLayout>
    );
}

// ── Liability card ──────────────────────────────────────────────────────────

function LiabilityCardView({
    liability: l,
    onRegisterPayment,
    onDelete,
}: {
    liability: LiabilityCard;
    onRegisterPayment: () => void;
    onDelete: () => void;
}) {
    const [showEdit, setShowEdit] = useState(false);

    return (
        <Card>
            {/* Top row */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={typeColors[l.type] as any}>{typeLabels[l.type]}</Badge>
                    <h3 className="text-base font-semibold text-gray-900">{l.name}</h3>
                </div>
                <div className="flex gap-2">
                    <Link href={`/liabilities/${l.id}`}>
                        <Button variant="ghost" size="sm">Ver detalle</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={onDelete}>Eliminar</Button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Stat label="Saldo Actual" value={cop(l.outstanding_balance)} highlight />
                <Stat label="Cuota Mensual" value={`${cop(l.monthly_payment)} / día ${l.payment_day}`} />
                <Stat label="Tasa Anual" value={`${(l.annual_interest_rate * 100).toFixed(2)}%`} />
                <Stat label="Pagos" value={`${l.payments_made} / ${l.term_months}`} />
                <Stat label="Monto Original" value={cop(l.original_amount)} />
                <Stat label="Fecha Inicio" value={fmtDateShort(l.start_date)} />
                <Stat label="Fin Proyectado" value={l.projected_payoff_date ? fmtDateShort(l.projected_payoff_date) : '—'} />
                {l.linked_account && <Stat label="Cuenta Débito" value={l.linked_account.name} />}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{l.pct_paid.toFixed(1)}% pagado</span>
                    <span>{(100 - l.pct_paid).toFixed(1)}% restante</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(100, l.pct_paid)}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Button size="sm" onClick={onRegisterPayment}>Registrar Pago</Button>
                <Link href={`/liabilities/${l.id}#simulator`}>
                    <Button size="sm" variant="secondary">Simular</Button>
                </Link>
                <Link href={`/liabilities/${l.id}#amortization`}>
                    <Button size="sm" variant="ghost">Tabla Amortización</Button>
                </Link>
            </div>

            <LiabilityForm open={showEdit} onClose={() => setShowEdit(false)} liability={l} accounts={[]} />
        </Card>
    );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-rose-600 text-lg' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

function SummaryCard({ label, value, icon, color, subtitle }: {
    label: string; value: string; icon: React.ReactNode; color: string; subtitle?: string;
}) {
    const bg: Record<string, string> = {
        rose: 'bg-rose-50', amber: 'bg-amber-50', orange: 'bg-orange-50', green: 'bg-green-50',
    };
    const text: Record<string, string> = {
        rose: 'text-rose-600', amber: 'text-amber-600', orange: 'text-orange-600', green: 'text-emerald-600',
    };
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg[color]} flex items-center justify-center flex-shrink-0`}>
                <div className={text[color]}>{icon}</div>
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-lg font-bold ${text[color]}`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
        </div>
    );
}

function DebtIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function CalIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function TrendIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}
function FlagIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>;
}

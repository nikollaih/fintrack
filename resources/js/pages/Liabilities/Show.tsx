import { useMemo, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Card, { CardHeader } from '@/components/UI/Card';
import Input from '@/components/UI/Input';
import Modal from '@/components/UI/Modal';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    AmortizationRow, LiabilityFull, LiabilityPaymentRecord,
    LiabilityPosition, LiabilitySimulationRecord,
} from '@/types';
import { cop, pct, fmtDate, fmtDateShort, typeLabels, simulateExtra } from './utils';
import RegisterPaymentModal from './components/RegisterPaymentModal';

interface Account { id: string; name: string; type: string; }

interface Props {
    liability: LiabilityFull;
    schedule: AmortizationRow[];
    position: LiabilityPosition;
    payments: LiabilityPaymentRecord[];
    simulations: LiabilitySimulationRecord[];
    accounts: Account[];
    portfolio_return_rate: number | null;
}

const ROWS_PER_PAGE = 24;

export default function LiabilityShow({ liability: l, schedule, position, payments, simulations, accounts, portfolio_return_rate }: Props) {
    const [page, setPage] = useState(1);
    const [registerRow, setRegisterRow] = useState<AmortizationRow | null>(null);
    const [compareA, setCompareA] = useState<string | null>(null);
    const [compareB, setCompareB] = useState<string | null>(null);
    const [saveSimName, setSaveSimName] = useState('');
    const [showSaveSim, setShowSaveSim] = useState(false);

    // Extra payment simulator state
    const [extraMonthly, setExtraMonthly] = useState(0);
    const [lumpSum, setLumpSum] = useState(0);
    const [lumpSumDate, setLumpSumDate] = useState('');

    const today = new Date().toISOString().slice(0, 10);
    const paidCount = payments.length;

    // ── Chart data: stacked area of cumulative principal + interest ──────────
    const chartData = useMemo(() => {
        let cumPrincipal = position.total_principal_paid;
        let cumInterest  = position.total_interest_paid;
        return schedule.map(row => {
            cumPrincipal += row.principal;
            cumInterest  += row.interest;
            return {
                num: row.number,
                balance: row.ending_balance,
                cumPrincipal: Math.round(cumPrincipal),
                cumInterest:  Math.round(cumInterest),
            };
        });
    }, [schedule, position]);

    // ── Simulator ──────────────────────────────────────────────────────────
    const simResult = useMemo(() => {
        if (extraMonthly === 0 && lumpSum === 0) return null;
        return simulateExtra(
            schedule, position.actual_balance, paidCount,
            extraMonthly, lumpSum || undefined, lumpSumDate || undefined,
        );
    }, [extraMonthly, lumpSum, lumpSumDate, schedule, position.actual_balance, paidCount]);

    const origTotalInterest = useMemo(
        () => schedule.slice(paidCount).reduce((s, r) => s + r.interest, 0),
        [schedule, paidCount],
    );

    const origPayoff = schedule.length > 0 ? schedule[schedule.length - 1].date : '';

    // ── Amortization pagination ─────────────────────────────────────────────
    const totalPages = Math.ceil(schedule.length / ROWS_PER_PAGE);
    const pageRows   = schedule.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    // ── Compare simulations ─────────────────────────────────────────────────
    const simA = simulations.find(s => s.id === compareA);
    const simB = simulations.find(s => s.id === compareB);

    // ── Save simulation form ────────────────────────────────────────────────
    const { post: postSim, processing: simProcessing } = useForm({});

    function saveSim(e: React.FormEvent) {
        e.preventDefault();
        router.post(`/liabilities/${l.id}/simulations`, {
            name:                  saveSimName,
            extra_monthly_payment: extraMonthly,
            lump_sum_amount:       lumpSum || null,
            lump_sum_date:         lumpSumDate || null,
        }, { onSuccess: () => { setShowSaveSim(false); setSaveSimName(''); } });
    }

    // ── Mortgage equity ─────────────────────────────────────────────────────
    const equity   = l.estimated_property_value
        ? l.estimated_property_value - position.actual_balance
        : null;
    const ltv      = l.estimated_property_value && l.estimated_property_value > 0
        ? (position.actual_balance / l.estimated_property_value) * 100
        : null;

    // ── Equity chart data ───────────────────────────────────────────────────
    const equityChart = useMemo(() => {
        if (!l.estimated_property_value) return [];
        return schedule.filter((_, i) => i % 6 === 0).map(row => ({
            date: row.date.slice(0, 7),
            balance: Math.round(row.ending_balance),
            property: Math.round(l.estimated_property_value!),
            equity: Math.round(l.estimated_property_value! - row.ending_balance),
        }));
    }, [schedule, l.estimated_property_value]);

    // ── Opportunity cost (TCO) ─────────────────────────────────────────────
    const downPayment      = l.original_amount > 0 ? l.original_amount * 0.3 : 0; // assume 30% down
    const totalInterestPaid = schedule.reduce((s, r) => s + r.interest, 0);
    const retRate          = portfolio_return_rate ?? 0.12;
    const yearsTotal       = l.term_months / 12;
    const opportunityCost  = downPayment * (Math.pow(1 + retRate, yearsTotal) - 1);

    return (
        <AppLayout title={l.name}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Link href="/liabilities" className="hover:text-primary-600">Pasivos</Link>
                <span>/</span>
                <span className="text-gray-800 font-medium">{l.name}</span>
            </div>

            {/* ── Section 1: Summary ───────────────────────────────────────── */}
            <Card className="mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Badge variant={l.type === 'mortgage' ? 'blue' : 'purple'}>
                            {typeLabels[l.type]}
                        </Badge>
                        <h2 className="text-xl font-bold text-gray-900">{l.name}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Saldo Actual</p>
                        <p className="text-2xl font-bold text-rose-600">{cop(position.actual_balance)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Monto Original</p>
                        <p className="text-lg font-semibold text-gray-700">{cop(l.original_amount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Cuota Mensual</p>
                        <p className="text-lg font-semibold text-gray-700">{cop(l.monthly_payment)}</p>
                        <p className="text-xs text-gray-400">Día {l.payment_day} de cada mes</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Tasa Anual</p>
                        <p className="text-lg font-semibold text-gray-700">{(l.annual_interest_rate * 100).toFixed(2)}%</p>
                        <p className="text-xs text-gray-400">{l.type === 'cooperative_loan' ? 'Efectiva Anual' : 'Nominal Anual'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Pagos Realizados</p>
                        <p className="text-lg font-semibold text-gray-700">{paidCount} / {l.term_months}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">% Pagado</p>
                        <p className="text-lg font-semibold text-emerald-600">{position.pct_paid.toFixed(1)}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Intereses Pagados</p>
                        <p className="text-lg font-semibold text-gray-700">{cop(position.total_interest_paid)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Fin Proyectado</p>
                        <p className="text-lg font-semibold text-gray-700">
                            {position.projected_payoff_date ? fmtDateShort(position.projected_payoff_date) : '—'}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Capital pagado: {cop(position.total_principal_paid)}</span>
                        <span>Restante: {cop(position.actual_balance)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                            className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-emerald-400"
                            style={{ width: `${Math.min(100, position.pct_paid)}%` }}
                        />
                    </div>
                </div>
            </Card>

            {/* ── Section 2: Payment progress chart ────────────────────────── */}
            <Card className="mb-6">
                <CardHeader title="Composición de Pagos" subtitle="Capital vs. Intereses pagados en el tiempo" />
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gPrincipal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="gInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="num" tick={{ fontSize: 10 }} label={{ value: 'N° Cuota', position: 'insideBottom', dy: 10, fontSize: 10 }} />
                        <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} width={60} />
                        <Tooltip formatter={(v: number) => cop(v)} labelFormatter={l => `Cuota ${l}`} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="cumPrincipal" name="Capital acum." stroke="#6366f1" fill="url(#gPrincipal)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="cumInterest" name="Interés acum." stroke="#f59e0b" fill="url(#gInterest)" strokeWidth={1.5} />
                        <Line type="monotone" dataKey="balance" name="Saldo Restante" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            {/* ── Section 3: Amortization table ────────────────────────────── */}
            <Card className="mb-6" id="amortization">
                <CardHeader
                    title="Tabla de Amortización"
                    subtitle={`${schedule.length} cuotas · mostrando ${(page - 1) * ROWS_PER_PAGE + 1}–${Math.min(page * ROWS_PER_PAGE, schedule.length)}`}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                                <th className="py-2 px-3 text-left">N°</th>
                                <th className="py-2 px-3 text-left">Fecha</th>
                                <th className="py-2 px-3 text-right">Saldo Inicial</th>
                                <th className="py-2 px-3 text-right">Cuota</th>
                                <th className="py-2 px-3 text-right">Capital</th>
                                <th className="py-2 px-3 text-right">Interés</th>
                                <th className="py-2 px-3 text-right">Saldo Final</th>
                                <th className="py-2 px-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map(row => {
                                const payment = payments.find(p => p.payment_number === row.number);
                                const isPast  = row.date <= today;
                                const isCurrent = row.number === paidCount + 1;

                                return (
                                    <tr
                                        key={row.number}
                                        onClick={() => isPast && !payment && setRegisterRow(row)}
                                        className={`border-b border-gray-50 transition-colors
                                            ${isCurrent ? 'bg-primary-50' : ''}
                                            ${isPast && !payment ? 'hover:bg-amber-50 cursor-pointer' : ''}
                                            ${payment ? 'bg-emerald-50' : ''}
                                        `}
                                    >
                                        <td className="py-1.5 px-3 font-mono text-xs text-gray-500">{row.number}</td>
                                        <td className="py-1.5 px-3 text-xs">{fmtDateShort(row.date)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-xs">{cop(row.beginning_balance)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-xs font-medium">{cop(row.payment)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-xs text-primary-600">{cop(row.principal)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-xs text-amber-600">{cop(row.interest)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-xs">{cop(row.ending_balance)}</td>
                                        <td className="py-1.5 px-3 text-center">
                                            {payment ? (
                                                <span className="text-xs text-emerald-600 font-medium">✓ Pagado</span>
                                            ) : isPast ? (
                                                <span className="text-xs text-amber-600">Pendiente</span>
                                            ) : isCurrent ? (
                                                <span className="text-xs text-primary-600 font-medium">Próxima</span>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-semibold">
                                <td colSpan={4} className="py-2 px-3">Totales</td>
                                <td className="py-2 px-3 text-right text-primary-600">
                                    {cop(schedule.reduce((s, r) => s + r.principal, 0))}
                                </td>
                                <td className="py-2 px-3 text-right text-amber-600">
                                    {cop(schedule.reduce((s, r) => s + r.interest, 0))}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Ant</Button>
                        <span className="px-3 py-1 text-sm text-gray-600">Pág {page} de {totalPages}</span>
                        <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sig ›</Button>
                    </div>
                )}
            </Card>

            {/* ── Section 4: Extra payment simulator ───────────────────────── */}
            <Card className="mb-6" id="simulator">
                <CardHeader title="Simulador de Abonos Extras" subtitle="Ve cuánto tiempo y dinero ahorras pagando más" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Abono extra mensual (COP)</label>
                        <Input type="number" value={extraMonthly || ''} min="0" step="10000"
                            onChange={e => setExtraMonthly(Number(e.target.value))}
                            placeholder="Ej. 200.000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pago único (lump sum, COP)</label>
                        <Input type="number" value={lumpSum || ''} min="0" step="100000"
                            onChange={e => setLumpSum(Number(e.target.value))}
                            placeholder="Ej. 2.000.000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del pago único</label>
                        <Input type="date" value={lumpSumDate}
                            onChange={e => setLumpSumDate(e.target.value)} />
                    </div>
                </div>

                {simResult ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <SimCompare label="Fin Original" orig={fmtDateShort(origPayoff)} nuevo={fmtDateShort(simResult.newPayoff)} />
                            <SimCompare label="Total Intereses" orig={cop(origTotalInterest)} nuevo={cop(simResult.totalInterest)} />
                            <SimCompare
                                label="Intereses Ahorrados"
                                orig=""
                                nuevo={cop(simResult.origInterest - simResult.totalInterest)}
                                highlight
                            />
                            <SimCompare label="Meses Ahorrados" orig="" nuevo={`${simResult.monthsSaved} meses`} highlight />
                        </div>

                        {/* Before/after balance chart */}
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="number" allowDuplicatedCategory={false} tick={{ fontSize: 10 }} />
                                <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} width={60} />
                                <Tooltip formatter={(v: number) => cop(v)} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line data={schedule.slice(paidCount)} type="monotone" dataKey="ending_balance"
                                    name="Sin abonos" stroke="#94a3b8" strokeWidth={2} dot={false} />
                                <Line data={simResult.newSched} type="monotone" dataKey="ending_balance"
                                    name="Con abonos" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="mt-4 flex gap-3">
                            <Button onClick={() => setShowSaveSim(true)} variant="secondary" size="sm">
                                Guardar Simulación
                            </Button>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">
                        Ingresa un abono extra o pago único para ver el impacto.
                    </p>
                )}
            </Card>

            {/* ── Section 5: Saved simulations ─────────────────────────────── */}
            {simulations.length > 0 && (
                <Card className="mb-6">
                    <CardHeader title="Simulaciones Guardadas" />
                    <div className="space-y-3 mb-4">
                        {simulations.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Ahorra {s.resulting_months_saved} meses · {cop(s.resulting_total_interest)} total intereses
                                        · Fin: {fmtDateShort(s.resulting_payoff_date)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCompareA(a => a === s.id ? null : s.id)}
                                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${compareA === s.id ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                                    >A</button>
                                    <button
                                        onClick={() => setCompareB(b => b === s.id ? null : s.id)}
                                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${compareB === s.id ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                                    >B</button>
                                    <button
                                        onClick={() => router.delete(`/liabilities/${l.id}/simulations/${s.id}`)}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {simA && simB && (
                        <div className="grid grid-cols-2 gap-6 p-4 bg-white rounded-xl border-2 border-primary-200">
                            <CompareCol label="A" sim={simA} />
                            <CompareCol label="B" sim={simB} />
                        </div>
                    )}
                </Card>
            )}

            {/* ── Section 6 (Mortgage): Equity tracker ────────────────────── */}
            {l.type === 'mortgage' && (
                <Card className="mb-6">
                    <CardHeader title="Patrimonio (Equity)" subtitle="Valor del inmueble menos saldo de la hipoteca" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <Stat label="Valor Estimado Inmueble" value={l.estimated_property_value ? cop(l.estimated_property_value) : '—'} />
                        <Stat label="Saldo Hipoteca" value={cop(position.actual_balance)} />
                        <Stat label="Patrimonio (Equity)" value={equity != null ? cop(equity) : '—'} highlight={equity != null && equity > 0} />
                        <Stat label="Loan-to-Value (LTV)" value={ltv != null ? `${ltv.toFixed(1)}%` : '—'} />
                    </div>
                    {equityChart.length > 0 && (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={equityChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} width={60} />
                                <Tooltip formatter={(v: number) => cop(v)} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="property" name="Valor inmueble" stroke="#6366f1" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="balance" name="Saldo deuda" stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="equity" name="Patrimonio" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            )}

            {/* ── Section 7 (Mortgage): Total cost of ownership ───────────── */}
            {l.type === 'mortgage' && (
                <MortgageTCO
                    liability={l}
                    totalInterestPaid={totalInterestPaid}
                    downPayment={downPayment}
                    opportunityCost={opportunityCost}
                    portfolioReturnRate={retRate}
                    termMonths={l.term_months}
                />
            )}

            {/* Modals */}
            {registerRow && (
                <RegisterPaymentModal
                    open
                    onClose={() => setRegisterRow(null)}
                    liability={l}
                    scheduledRow={registerRow}
                    hasLinkedAccount={!!l.linked_account}
                />
            )}

            <Modal open={showSaveSim} onClose={() => setShowSaveSim(false)} title="Guardar Simulación" size="sm">
                <form onSubmit={saveSim} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la simulación</label>
                        <Input value={saveSimName} onChange={e => setSaveSimName(e.target.value)}
                            placeholder="Ej. Abono extra 200k/mes" required />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowSaveSim(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-600' : 'text-gray-800'}`}>{value}</p>
        </div>
    );
}

function SimCompare({ label, orig, nuevo, highlight }: { label: string; orig: string; nuevo: string; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            {orig && <p className="text-xs text-gray-400 line-through">{orig}</p>}
            <p className={`text-sm font-bold ${highlight ? 'text-emerald-600' : 'text-gray-800'}`}>{nuevo}</p>
        </div>
    );
}

function CompareCol({ label, sim }: { label: string; sim: LiabilitySimulationRecord }) {
    return (
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Simulación {label}: {sim.name}</p>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Abono mensual</span><span className="font-medium">{cop(sim.extra_monthly_payment)}</span></div>
                {sim.lump_sum_amount && <div className="flex justify-between"><span className="text-gray-500">Lump sum</span><span className="font-medium">{cop(sim.lump_sum_amount)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Fin del crédito</span><span className="font-medium">{fmtDateShort(sim.resulting_payoff_date)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total intereses</span><span className="font-medium">{cop(sim.resulting_total_interest)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Meses ahorrados</span><span className="font-bold">{sim.resulting_months_saved}</span></div>
            </div>
        </div>
    );
}

function MortgageTCO({ liability: l, totalInterestPaid, downPayment, opportunityCost, portfolioReturnRate, termMonths }: {
    liability: LiabilityFull;
    totalInterestPaid: number;
    downPayment: number;
    opportunityCost: number;
    portfolioReturnRate: number;
    termMonths: number;
}) {
    const [monthlyRent, setMonthlyRent] = useState(0);

    const totalCostBuy     = totalInterestPaid + opportunityCost;
    const totalCostRent    = monthlyRent * termMonths;
    const breakEvenYears   = monthlyRent > 0
        ? Math.ceil((l.original_amount + totalInterestPaid) / (monthlyRent * 12 - (l.estimated_property_value ? l.estimated_property_value * 0.01 : 0)))
        : null;

    return (
        <Card className="mb-6">
            <CardHeader title="Costo Total de Propiedad vs. Arrendamiento" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Stat label="Total Intereses (vida del crédito)" value={cop(totalInterestPaid)} />
                <Stat label="Costo Oportunidad Cuota Inicial" value={cop(opportunityCost)} />
                <Stat label="Costo Total Real (Compra)" value={cop(totalCostBuy)} />
                <div>
                    <p className="text-xs text-gray-500 mb-1">Arriendo mensual comparar</p>
                    <Input type="number" value={monthlyRent || ''} min="0" step="50000"
                        onChange={e => setMonthlyRent(Number(e.target.value))}
                        placeholder="Ej. 800.000" />
                </div>
            </div>
            {monthlyRent > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <Stat label="Costo Total Arrendamiento" value={cop(totalCostRent)} />
                    <Stat
                        label="Punto de Equilibrio"
                        value={breakEvenYears != null ? `≈ ${breakEvenYears} años` : '—'}
                        highlight={breakEvenYears != null && breakEvenYears < termMonths / 12}
                    />
                </div>
            )}
        </Card>
    );
}

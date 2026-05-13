import { useMemo, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Bar,
} from 'recharts';
import AppLayout from '@/layouts/AppLayout';
import Card, { CardHeader } from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import {
    RetirementPlan,
    RetirementCalculations,
    RetirementPortfolio,
    RetirementSnapshotRecord,
} from '@/types';
import { formatCOP, formatPercent } from '@/utils/currency';

// ── TypeScript helper for slider calculations ──────────────────────
function mr(annualRate: number): number {
    return Math.pow(1 + annualRate, 1 / 12) - 1;
}
function fv(pv: number, contrib: number, monthlyRate: number, months: number): number {
    if (months <= 0) return pv;
    if (Math.abs(monthlyRate) < 1e-9) return pv + contrib * months;
    const f = Math.pow(1 + monthlyRate, months);
    return pv * f + contrib * (f - 1) / monthlyRate;
}
function requiredCorpusCalc(
    monthlyExpToday: number,
    yearsToRet: number,
    retYears: number,
    inflation: number,
    retReturn: number,
): number {
    const mi = mr(inflation);
    const mret = mr(retReturn);
    const E = monthlyExpToday * Math.pow(1 + inflation, yearsToRet);
    const n = retYears * 12;
    if (Math.abs(mret - mi) < 1e-4) return E * n;
    return (E / (mret - mi)) * (1 - Math.pow((1 + mi) / (1 + mret), n));
}
function passiveIncome(corpus: number, annualRetRate: number): number {
    return corpus * mr(annualRetRate);
}
function projectedRetAge(
    plan: RetirementPlan, portfolioValue: number, contrib: number,
): number {
    const mRate = mr(plan.expected_portfolio_return_rate);
    let p = portfolioValue;
    for (let month = 1; month <= (99 - plan.current_age) * 12; month++) {
        p = p * (1 + mRate) + contrib;
        const age = plan.current_age + month / 12;
        const yearsLeft = Math.max(1, plan.life_expectancy - age);
        const req = requiredCorpusCalc(
            plan.expected_monthly_expense_at_retirement,
            age - plan.current_age,
            yearsLeft,
            plan.expected_annual_inflation_rate,
            plan.expected_retirement_return_rate,
        );
        if (p >= req) return Math.floor(age);
    }
    return 99;
}

// ── Formatting helpers ─────────────────────────────────────────────
function fmtM(v: number): string {
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return formatCOP(v);
}
function ageColor(projected: number, target: number): string {
    const diff = projected - target;
    if (diff <= 0) return 'text-green-600';
    if (diff <= 5) return 'text-amber-600';
    return 'text-red-600';
}

// ── Sub-components ─────────────────────────────────────────────────

interface MetricCardProps {
    label: string;
    value: string;
    valueClass?: string;
    sub?: string;
    note?: string;
}
function MetricCard({ label, value, valueClass = 'text-gray-900', sub, note }: MetricCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold leading-tight ${valueClass}`}>{value}</p>
            {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
            {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
        </div>
    );
}

interface Props {
    plan: RetirementPlan | null;
    portfolio: RetirementPortfolio;
    calculations: RetirementCalculations | null;
    snapshots: RetirementSnapshotRecord[];
    debt_monthly_commitment: number;
    debt_free_date: string | null;
}

const DEFAULTS = {
    current_age: 30,
    target_retirement_age: 60,
    expected_monthly_expense_at_retirement: 3000000,
    life_expectancy: 85,
    expected_annual_inflation_rate: 0.06,
    expected_portfolio_return_rate: 0.10,
    expected_retirement_return_rate: 0.07,
    monthly_contribution: 500000,
    include_agro_income: false,
    agro_monthly_equivalent: null as null,
    notes: null as null,
};

export default function RetirementPlannerIndex({ plan, portfolio, calculations, snapshots, debt_monthly_commitment, debt_free_date }: Props) {
    const [editMode, setEditMode] = useState(!plan);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [sliderContrib, setSliderContrib] = useState(
        plan ? plan.total_monthly_contribution : DEFAULTS.monthly_contribution,
    );

    const { data, setData, post, processing, errors } = useForm(
        plan ?? DEFAULTS
    );

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post('/retirement-planner', { onSuccess: () => setEditMode(false) });
    };

    // ── Slider calculations (useMemo, no server hit) ───────────────
    const sliderCalc = useMemo(() => {
        if (!plan || !calculations) return null;
        const months = plan.years_to_retirement * 12;
        const mRate  = mr(plan.expected_portfolio_return_rate);
        const proj   = fv(portfolio.total, sliderContrib, mRate, months);
        const gap    = proj - calculations.required_corpus;
        const retAge = projectedRetAge(plan, portfolio.total, sliderContrib);
        const pi     = passiveIncome(proj, plan.expected_retirement_return_rate);
        return { proj, gap, retAge, pi };
    }, [sliderContrib, plan, portfolio.total, calculations]);

    const progressPct = calculations
        ? Math.min(100, Math.max(0, (portfolio.total / calculations.required_corpus) * 100))
        : 0;

    return (
        <AppLayout title="Planeador de Retiro">

            {/* ── Debt commitment note ──────────────────────────────── */}
            {debt_monthly_commitment > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                        <p className="font-semibold text-amber-800">Compromiso de deuda activo</p>
                        <p className="text-amber-700 mt-0.5">
                            Actualmente destinas <strong>{fmtM(debt_monthly_commitment)}/mes</strong> a cuotas de deuda.
                            {debt_free_date && (
                                <> Cuando termines de pagar ({new Date(debt_free_date + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}),
                                esos recursos quedarán libres para invertir en tu portafolio de retiro.</>
                            )}
                            {' '}<a href="/liabilities" className="underline font-medium">Ver pasivos →</a>
                        </p>
                    </div>
                </div>
            )}

            {/* ── § 1 · GOAL SETUP ───────────────────────────────────── */}
            <Card className="mb-6">
                <CardHeader
                    title={plan && !editMode ? 'Mi plan de retiro' : 'Configurar plan de retiro'}
                    action={plan && !editMode
                        ? <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}>Editar</Button>
                        : undefined
                    }
                />

                {plan && !editMode ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-gray-400 text-xs">Edad actual</p><p className="font-semibold">{plan.current_age} años</p></div>
                        <div><p className="text-gray-400 text-xs">Meta de retiro</p><p className="font-semibold">{plan.target_retirement_age} años</p></div>
                        <div><p className="text-gray-400 text-xs">Gasto mensual deseado</p><p className="font-semibold">{formatCOP(plan.expected_monthly_expense_at_retirement)}</p></div>
                        <div><p className="text-gray-400 text-xs">Contribución mensual</p><p className="font-semibold">{formatCOP(plan.monthly_contribution)}</p></div>
                        <div><p className="text-gray-400 text-xs">Esperanza de vida</p><p className="font-semibold">{plan.life_expectancy} años</p></div>
                        <div><p className="text-gray-400 text-xs">Inflación EA</p><p className="font-semibold">{formatPercent(plan.expected_annual_inflation_rate)}</p></div>
                        <div><p className="text-gray-400 text-xs">Rendimiento acumulación</p><p className="font-semibold">{formatPercent(plan.expected_portfolio_return_rate)}</p></div>
                        <div><p className="text-gray-400 text-xs">Rendimiento retiro</p><p className="font-semibold">{formatPercent(plan.expected_retirement_return_rate)}</p></div>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Input label="Edad actual" type="number" min={18} max={80} value={data.current_age} onChange={e => setData('current_age', +e.target.value)} error={errors.current_age} required />
                            <Input label="Edad de retiro meta" type="number" min={40} max={90} value={data.target_retirement_age} onChange={e => setData('target_retirement_age', +e.target.value)} error={errors.target_retirement_age} required />
                            <Input label="Esperanza de vida" type="number" min={70} max={100} value={data.life_expectancy} onChange={e => setData('life_expectancy', +e.target.value)} error={errors.life_expectancy} required />
                            <Input label="Gasto mensual deseado en retiro (COP)" type="number" step={50000} value={data.expected_monthly_expense_at_retirement} onChange={e => setData('expected_monthly_expense_at_retirement', +e.target.value)} error={errors.expected_monthly_expense_at_retirement} required />
                            <Input label="Contribución mensual (COP)" type="number" step={50000} min={0} value={data.monthly_contribution} onChange={e => setData('monthly_contribution', +e.target.value)} error={errors.monthly_contribution} required />
                        </div>

                        <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-xs text-primary-600 hover:underline">
                            {showAdvanced ? '▲ Ocultar' : '▼ Mostrar'} parámetros avanzados
                        </button>

                        {showAdvanced && (
                            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                <Input label="Inflación anual EA (ej. 0.06)" type="number" step={0.005} min={0.01} max={0.30} value={data.expected_annual_inflation_rate} onChange={e => setData('expected_annual_inflation_rate', +e.target.value)} error={errors.expected_annual_inflation_rate} required />
                                <Input label="Rendimiento acumulación EA (ej. 0.10)" type="number" step={0.005} min={0.01} max={0.40} value={data.expected_portfolio_return_rate} onChange={e => setData('expected_portfolio_return_rate', +e.target.value)} error={errors.expected_portfolio_return_rate} required />
                                <Input label="Rendimiento en retiro EA (ej. 0.07)" type="number" step={0.005} min={0.01} max={0.30} value={data.expected_retirement_return_rate} onChange={e => setData('expected_retirement_return_rate', +e.target.value)} error={errors.expected_retirement_return_rate} required />
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" loading={processing}>Guardar plan y calcular</Button>
                            {plan && <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Cancelar</Button>}
                        </div>
                    </form>
                )}
            </Card>

            {!calculations && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">Configura tu plan de retiro para ver las proyecciones.</p>
                </div>
            )}

            {calculations && plan && (
                <>
                {/* ── § 2 · STATUS DASHBOARD ─────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        label={`Lo que necesitas a los ${plan.target_retirement_age} años`}
                        value={fmtM(calculations.required_corpus)}
                        sub={`${formatCOP(calculations.monthly_expense_at_retirement)}/mes en retiro`}
                        note={`En pesos de hoy: ${fmtM(calculations.required_corpus_real)}`}
                    />
                    <MetricCard
                        label="Lo que tienes hoy"
                        value={fmtM(portfolio.total)}
                        valueClass="text-primary-700"
                        sub={`${progressPct.toFixed(1)}% del objetivo`}
                    />
                    <MetricCard
                        label="Brecha proyectada al retiro"
                        value={fmtM(Math.abs(calculations.gap_amount))}
                        valueClass={calculations.on_track ? 'text-green-600' : 'text-red-600'}
                        sub={calculations.on_track ? `✓ Superávit (${calculations.gap_pct.toFixed(1)}%)` : `✗ Déficit (${Math.abs(calculations.gap_pct).toFixed(1)}%)`}
                    />
                    <MetricCard
                        label="Retiro proyectado a tu ritmo actual"
                        value={`${calculations.projected_retirement_age} años`}
                        valueClass={ageColor(calculations.projected_retirement_age, plan.target_retirement_age)}
                        sub={calculations.projected_retirement_age <= plan.target_retirement_age
                            ? `✓ ${plan.target_retirement_age - calculations.projected_retirement_age}a antes de la meta`
                            : `${calculations.projected_retirement_age - plan.target_retirement_age}a después de la meta`}
                    />
                </div>

                {/* ── Progress bar ─────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Portafolio actual vs corpus requerido</span>
                        <span className="font-semibold">{progressPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-green-500' : progressPct >= 60 ? 'bg-amber-500' : 'bg-primary-600'}`}
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                    </div>
                </div>

                {/* ── § 3 · PROJECTION CHART ───────────────────────────── */}
                <Card className="mb-6">
                    <CardHeader
                        title="Trayectoria: portafolio vs corpus requerido"
                        subtitle={`De los ${plan.current_age} a los ${plan.life_expectancy} años`}
                    />
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={calculations.chart_data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: 'Edad', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                            <YAxis tickFormatter={v => fmtM(v)} tick={{ fontSize: 9 }} width={65} />
                            <Tooltip
                                formatter={(v: number, name: string) => [formatCOP(v), name === 'portfolio' ? 'Portafolio' : name === 'required' ? 'Corpus requerido (si retiras ahora)' : 'Objetivo al retiro']}
                                labelFormatter={(l: number) => `Edad: ${l}`}
                            />
                            <Legend formatter={v => v === 'portfolio' ? 'Portafolio proyectado' : v === 'required' ? 'Corpus si retiro ahora' : 'Objetivo al retiro'} />
                            <ReferenceLine x={plan.target_retirement_age} stroke="#6366f1" strokeDasharray="6 3" label={{ value: `Meta: ${plan.target_retirement_age}`, position: 'top', fontSize: 9, fill: '#6366f1' }} />
                            <Area type="monotone" dataKey="required" fill="#fee2e2" stroke="#ef4444" strokeWidth={1} fillOpacity={0.3} />
                            <Area type="monotone" dataKey="portfolio" fill="#dbeafe" stroke="#2563eb" strokeWidth={2} fillOpacity={0.4} />
                            <Line type="monotone" dataKey="target" stroke="#059669" strokeDasharray="4 2" strokeWidth={1.5} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        Azul = portafolio proyectado · Rojo = corpus necesario si te retiras en esa edad · Línea verde = objetivo al retiro
                    </p>
                </Card>

                {/* ── § 4 · SCENARIO COMPARISON ────────────────────────── */}
                <Card className="mb-6">
                    <CardHeader title="Comparación de escenarios" subtitle="Mismo plan, distinto rendimiento de portafolio" />
                    <div className="grid grid-cols-3 gap-4">
                        {(['conservative', 'moderate', 'optimistic'] as const).map(key => {
                            const s = calculations.scenarios[key];
                            const labels = { conservative: 'Conservador (7% EA)', moderate: 'Moderado (10% EA) ★', optimistic: 'Optimista (13% EA)' };
                            const isBase = key === 'moderate';
                            return (
                                <div key={key} className={`rounded-xl border p-4 ${isBase ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                                    <p className={`text-xs font-bold mb-3 ${isBase ? 'text-primary-700' : 'text-gray-600'}`}>{labels[key]}</p>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="text-gray-400 text-xs">Corpus proyectado</span><p className={`font-bold ${s.meets_goal ? 'text-green-700' : 'text-red-700'}`}>{fmtM(s.projected_corpus)}</p></div>
                                        <div><span className="text-gray-400 text-xs">¿Cumple objetivo?</span><p className={`font-semibold ${s.meets_goal ? 'text-green-600' : 'text-red-600'}`}>{s.meets_goal ? '✓ Sí' : '✗ No'}</p></div>
                                        <div><span className="text-gray-400 text-xs">Edad de retiro</span><p className="font-semibold">{s.projected_retirement_age} años</p></div>
                                        <div><span className="text-gray-400 text-xs">Renta pasiva mensual (perpetua)</span><p className="font-semibold text-primary-700">{formatCOP(s.passive_income_perp)}</p></div>
                                        <div><span className="text-gray-400 text-xs">Contribución requerida para la meta</span><p className="font-semibold">{formatCOP(s.required_contribution)}/mes</p></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* ── § 5 · CONTRIBUTION SLIDER ────────────────────────── */}
                <Card className="mb-6">
                    <CardHeader title="Calculadora de contribución" subtitle="Ajusta para ver el impacto en tiempo real" />
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Contribución mensual</span>
                            <span className="font-bold text-primary-700">{formatCOP(sliderContrib)}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={5000000}
                            step={50000}
                            value={sliderContrib}
                            onChange={e => setSliderContrib(+e.target.value)}
                            className="w-full accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>$0</span><span>$5.000.000</span></div>
                    </div>
                    {sliderCalc && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-400">Corpus proyectado</p>
                                <p className="font-bold text-lg">{fmtM(sliderCalc.proj)}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-400">Edad de retiro</p>
                                <p className={`font-bold text-lg ${ageColor(sliderCalc.retAge, plan.target_retirement_age)}`}>{sliderCalc.retAge} años</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-400">Brecha vs objetivo</p>
                                <p className={`font-bold text-lg ${sliderCalc.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {sliderCalc.gap >= 0 ? '+' : ''}{fmtM(sliderCalc.gap)}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-400">Renta mensual (perpetua)</p>
                                <p className="font-bold text-lg text-primary-700">{formatCOP(sliderCalc.pi)}</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* ── § 6 · ASSET PROJECTION TABLE ────────────────────── */}
                <Card className="mb-6">
                    <CardHeader
                        title="Activos que contribuyen al retiro"
                        subtitle={`Portafolio actual: ${formatCOP(portfolio.total)} · Proyectado a los ${plan.target_retirement_age} años con ${formatPercent(plan.expected_portfolio_return_rate)} EA`}
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="px-3 py-2">Activo</th>
                                    <th className="px-3 py-2 text-right">Saldo actual</th>
                                    <th className="px-3 py-2 text-right">Proyectado al retiro</th>
                                    <th className="px-3 py-2 text-right">% del corpus</th>
                                    <th className="px-3 py-2 text-right">% del total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {calculations.asset_projections.map((row, i) => (
                                    <tr key={i} className={row.type === 'total' ? 'bg-primary-50 font-bold' : 'hover:bg-gray-50'}>
                                        <td className="px-3 py-2">
                                            {row.name}
                                            {row.type !== 'total' && row.type !== 'contributions' && (
                                                <span className="ml-2 text-xs text-gray-400">{row.type}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">{row.current_balance > 0 ? formatCOP(row.current_balance) : '—'}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-primary-700">{formatCOP(row.projected_at_retirement)}</td>
                                        <td className="px-3 py-2 text-right">{row.pct_of_corpus}%</td>
                                        <td className="px-3 py-2 text-right">{row.pct_of_total}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* ── § 7 · MONTHLY PASSIVE INCOME BREAKDOWN ──────────── */}
                <Card className="mb-6">
                    <CardHeader title="Renta mensual en retiro" subtitle={`Con corpus proyectado de ${fmtM(calculations.projected_corpus)} al ${formatPercent(plan.expected_retirement_return_rate)} EA en retiro`} />
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Solo intereses (perpetuo)', sub: 'Capital intacto para heredar', value: calculations.monthly_passive_income_perp },
                            { label: 'Retiro en 25 años', sub: 'Capital se agota a los ' + (plan.target_retirement_age + 25), value: calculations.monthly_passive_income_25y },
                            { label: 'Retiro en 30 años', sub: 'Capital se agota a los ' + (plan.target_retirement_age + 30), value: calculations.monthly_passive_income_30y },
                        ].map((item, i) => (
                            <div key={i} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                <p className="text-2xl font-bold text-green-700">{formatCOP(item.value)}</p>
                                <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        Gasto deseado en retiro (pesos de hoy): {formatCOP(plan.expected_monthly_expense_at_retirement)}/mes →
                        en pesos del retiro: {formatCOP(calculations.monthly_expense_at_retirement)}/mes
                    </p>
                </Card>

                {/* ── § 8 · AGRO IMPACT ────────────────────────────────── */}
                {calculations.agro_impact && (
                    <Card className="mb-6" className="mb-6 border-green-200 bg-green-50">
                        <CardHeader title="Impacto del ingreso agro en tu retiro" />
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Sin ingreso agro</p>
                                <p className="text-xl font-bold text-amber-600">{calculations.agro_impact.without_retirement_age} años</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Con ingreso agro ({formatCOP(calculations.agro_impact.agro_monthly_equivalent)}/mes)</p>
                                <p className="text-xl font-bold text-green-700">{calculations.agro_impact.improved_retirement_age} años</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Años de adelanto</p>
                                <p className="text-xl font-bold text-green-700">{calculations.agro_impact.years_earlier} años antes</p>
                            </div>
                        </div>
                        <p className="text-sm text-green-800 mt-3">
                            🌱 Tu producción agrícola te permite retirarte <strong>{calculations.agro_impact.years_earlier} año(s) antes</strong> y
                            proyecta un corpus de <strong>{fmtM(calculations.agro_impact.improved_corpus)}</strong>.
                        </p>
                    </Card>
                )}

                {/* ── § 9 · ACTION PLAN ────────────────────────────────── */}
                <Card className="mb-6">
                    <CardHeader title="Plan de acción" subtitle="Recomendaciones específicas basadas en tu situación actual" />
                    <div className="space-y-3">
                        {calculations.action_plan.map((action, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-400">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                <p className="text-sm text-gray-700">{action}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* ── § 10 · HISTORICAL SNAPSHOTS ──────────────────────── */}
                {snapshots.length > 1 && (
                    <Card className="mb-6">
                        <CardHeader title="Evolución histórica de la brecha" subtitle="Diferencia entre corpus requerido y portafolio real, mes a mes" />
                        <ResponsiveContainer width="100%" height={200}>
                            <ComposedChart data={snapshots} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="snapshot_date" tick={{ fontSize: 9 }} />
                                <YAxis tickFormatter={v => fmtM(v)} tick={{ fontSize: 9 }} width={65} />
                                <Tooltip formatter={(v: number, n: string) => [formatCOP(v), n === 'total_portfolio_value' ? 'Portafolio' : 'Corpus requerido']} />
                                <Legend />
                                <Area type="monotone" dataKey="required_corpus" fill="#fee2e2" stroke="#ef4444" fillOpacity={0.3} strokeWidth={1.5} name="Corpus requerido" />
                                <Area type="monotone" dataKey="total_portfolio_value" fill="#dbeafe" stroke="#2563eb" fillOpacity={0.4} strokeWidth={2} name="Portafolio real" />
                                <ReferenceLine y={0} stroke="#374151" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Card>
                )}
                {snapshots.length <= 1 && (
                    <Card className="mb-6">
                        <CardHeader title="Evolución histórica" />
                        <p className="text-sm text-gray-400 text-center py-4">
                            El historial se construye automáticamente el primer día de cada mes. Vuelve el próximo mes para ver tu evolución.
                        </p>
                    </Card>
                )}

                {/* ── Portfolio detail ─────────────────────────────────── */}
                <Card>
                    <CardHeader title="Activos incluidos en el cálculo" subtitle="Saldos en tiempo real del sistema" />
                    <div className="space-y-2">
                        {portfolio.assets.map(a => (
                            <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{a.name}</span>
                                    <span className="ml-2 text-xs text-gray-400">{a.type}</span>
                                    {a.rate_ea && <span className="ml-2 text-xs text-primary-600">{formatPercent(a.rate_ea)} EA</span>}
                                </div>
                                <span className="text-sm font-semibold">{formatCOP(a.balance)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-semibold text-sm">Total portafolio</span>
                            <span className="font-bold text-primary-700">{formatCOP(portfolio.total)}</span>
                        </div>
                    </div>
                </Card>
                </>
            )}
        </AppLayout>
    );
}

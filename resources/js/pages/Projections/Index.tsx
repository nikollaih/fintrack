import { useEffect, useState, useCallback } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Line,
    ComposedChart,
} from 'recharts';
import AppLayout from '@/layouts/AppLayout';
import Card, { CardHeader } from '@/components/UI/Card';
import { PortfolioProjectionPoint } from '@/types';
import { formatCOP } from '@/utils/currency';

interface AssetMeta {
    id: string;
    name: string;
    type: string;
}

interface Props {
    assets: AssetMeta[];
}

function getXsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function formatYAxis(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

const ASSET_COLORS = [
    '#2563eb', '#10b981', '#f59e0b', '#8b5cf6',
    '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
];

const todayStr = new Date().toISOString().split('T')[0];

export default function ProjectionsIndex({ assets }: Props) {
    const [months, setMonths] = useState(12);
    const [data, setData] = useState<PortfolioProjectionPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const toDate = new Date();
    toDate.setMonth(toDate.getMonth() + months);
    const toDateStr = toDate.toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/projections?to_date=${toDateStr}&points=80`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                }
            );
            if (res.ok) {
                const json = await res.json();
                setData(json.chart_data ?? []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [toDateStr]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalNow = data.find((d) => d.date === todayStr)?.total ?? data[data.length - 1]?.total ?? 0;

    return (
        <AppLayout title="Proyecciones">
            {/* Summary */}
            <div className="mb-6 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white flex items-center justify-between">
                <div>
                    <p className="text-sm text-indigo-100 font-medium">Portafolio actual</p>
                    <p className="text-3xl font-bold mt-1">{formatCOP(totalNow)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-indigo-100">Horizonte:</label>
                    <select
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                        className="text-sm border border-indigo-400 bg-indigo-700 text-white rounded px-3 py-1.5"
                    >
                        <option value={3}>3 meses</option>
                        <option value={6}>6 meses</option>
                        <option value={12}>1 año</option>
                        <option value={24}>2 años</option>
                        <option value={60}>5 años</option>
                    </select>
                </div>
            </div>

            {assets.length === 0 ? (
                <Card>
                    <p className="text-center text-gray-400 py-10">Sin activos registrados.</p>
                </Card>
            ) : (
                <Card>
                    <CardHeader
                        title="Proyección del portafolio"
                        subtitle="Saldo acumulado por activo con interés compuesto EA"
                    />

                    {loading ? (
                        <div className="h-72 flex items-center justify-center text-gray-400">
                            Calculando proyección...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    tickFormatter={(d: string) => {
                                        const date = new Date(d + 'T00:00:00');
                                        return date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    tickFormatter={formatYAxis}
                                    width={65}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        const asset = assets.find((a) => a.id === name);
                                        return [formatCOP(value), asset?.name ?? name];
                                    }}
                                    labelFormatter={(label: string) => {
                                        const date = new Date(label + 'T00:00:00');
                                        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
                                    }}
                                />
                                <Legend
                                    formatter={(value) => {
                                        if (value === 'total') return 'Total portafolio';
                                        const asset = assets.find((a) => a.id === value);
                                        return asset?.name ?? value;
                                    }}
                                />
                                <ReferenceLine
                                    x={todayStr}
                                    stroke="#6366f1"
                                    strokeDasharray="4 2"
                                    label={{ value: 'Hoy', fontSize: 10, fill: '#6366f1' }}
                                />

                                {/* Stacked areas per asset */}
                                {assets.map((asset, index) => (
                                    <Area
                                        key={asset.id}
                                        type="monotone"
                                        dataKey={asset.id}
                                        stackId="portfolio"
                                        stroke={ASSET_COLORS[index % ASSET_COLORS.length]}
                                        fill={ASSET_COLORS[index % ASSET_COLORS.length]}
                                        fillOpacity={0.3}
                                        dot={false}
                                    />
                                ))}

                                {/* Total line on top */}
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#1e1b4b"
                                    strokeWidth={2.5}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}

                    {/* Asset legend with current values */}
                    {data.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {assets.map((asset, index) => {
                                const current = data.find((d) => !d.is_projection);
                                const last = data.filter((d) => !d.is_projection).pop();
                                const value = (last?.[asset.id] as number) ?? 0;
                                return (
                                    <div key={asset.id} className="flex items-center gap-2 text-sm">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length] }}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{asset.name}</p>
                                            <p className="text-xs text-gray-500">{formatCOP(value)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}
        </AppLayout>
    );
}

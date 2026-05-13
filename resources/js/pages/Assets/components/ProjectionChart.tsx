import { useEffect, useState, useCallback } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { ProjectionPoint } from '@/types';
import { formatCOP } from '@/utils/currency';

interface ProjectionChartProps {
    assetId: string;
    defaultMonths?: number;
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

const todayStr = new Date().toISOString().split('T')[0];

export default function ProjectionChart({ assetId, defaultMonths = 12 }: ProjectionChartProps) {
    const [months, setMonths] = useState(defaultMonths);
    const [data, setData] = useState<ProjectionPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const toDate = new Date();
    toDate.setMonth(toDate.getMonth() + months);
    const toDateStr = toDate.toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/assets/${assetId}/projection?to_date=${toDateStr}&points=80`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                }
            );
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [assetId, toDateStr]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Split into historical and projected series
    const historical = data.map((d) => ({
        date: d.date,
        historical: !d.is_projection ? d.balance : null,
        projected: null as number | null,
    }));

    const combined = data.map((d) => ({
        date: d.date,
        historical: !d.is_projection ? d.balance : null,
        projected: d.is_projection ? d.balance : null,
        // Connector: last historical point also shows projected start
    }));

    // Find the boundary: last historical point
    const lastHistIdx = data.reduce((last, d, i) => (!d.is_projection ? i : last), -1);
    if (lastHistIdx >= 0 && lastHistIdx + 1 < combined.length) {
        combined[lastHistIdx].projected = combined[lastHistIdx].historical;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-700">Proyección de saldo</p>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Horizonte:</label>
                    <select
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                        <option value={3}>3 meses</option>
                        <option value={6}>6 meses</option>
                        <option value={12}>1 año</option>
                        <option value={24}>2 años</option>
                        <option value={60}>5 años</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    Calculando...
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={combined} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                            width={60}
                        />
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                formatCOP(value),
                                name === 'historical' ? 'Histórico' : 'Proyectado',
                            ]}
                            labelFormatter={(label: string) => {
                                const date = new Date(label + 'T00:00:00');
                                return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
                            }}
                        />
                        <Legend
                            formatter={(value) => value === 'historical' ? 'Histórico' : 'Proyectado'}
                        />
                        <ReferenceLine x={todayStr} stroke="#6366f1" strokeDasharray="4 2" label={{ value: 'Hoy', fontSize: 10, fill: '#6366f1' }} />
                        <Line
                            type="monotone"
                            dataKey="historical"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="projected"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            strokeDasharray="6 3"
                            dot={false}
                            connectNulls={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

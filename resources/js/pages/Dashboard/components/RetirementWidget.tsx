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
    summary: RetirementSummary;
}

function fmt(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${Math.round(value).toLocaleString()}`;
}

export default function RetirementWidget({ summary }: Props) {
    const { progress_pct, projected_retirement_age, target_retirement_age, on_track, required_corpus, projected_corpus } = summary;
    const barColor = on_track ? 'bg-emerald-500' : progress_pct >= 50 ? 'bg-amber-400' : 'bg-rose-500';
    const labelColor = on_track ? 'text-emerald-600' : progress_pct >= 50 ? 'text-amber-600' : 'text-rose-600';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Planeador de Retiro</span>
                </div>
                <Link
                    href="/retirement-planner"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                    Ver planner →
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Progreso</p>
                    <p className={`text-lg font-bold ${labelColor}`}>{progress_pct}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Retiro proyectado</p>
                    <p className="text-lg font-bold text-gray-800">{projected_retirement_age} años</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Meta</p>
                    <p className="text-lg font-bold text-gray-800">{target_retirement_age} años</p>
                </div>
            </div>

            <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{fmt(projected_corpus)} proyectado</span>
                    <span>{fmt(required_corpus)} requerido</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(100, progress_pct)}%` }}
                    />
                </div>
            </div>

            <p className={`text-xs font-medium ${labelColor}`}>
                {on_track
                    ? `¡En camino! Retiro a los ${projected_retirement_age} años`
                    : projected_retirement_age <= target_retirement_age
                        ? `¡En camino! Retiro a los ${projected_retirement_age} años`
                        : `Retiro estimado ${projected_retirement_age - target_retirement_age} años después de la meta`}
            </p>
        </div>
    );
}

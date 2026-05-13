import { formatCOP } from '@/utils/currency';

export interface TimelineEntry {
    type: 'start' | 'movement' | 'today';
    date: string;
    description: string;
    amount: number | null;
    balance: number;
}

interface BalanceTimelineProps {
    timeline: TimelineEntry[];
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BalanceTimeline({ timeline }: BalanceTimelineProps) {
    if (timeline.length === 0) {
        return <p className="text-sm text-gray-400 py-4 text-center">Sin movimientos registrados.</p>;
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-0">
                {timeline.map((entry, index) => {
                    const isDeposit = entry.amount !== null && entry.amount > 0;
                    const isWithdrawal = entry.amount !== null && entry.amount < 0;

                    let dotColor = 'bg-gray-400';
                    let amountColor = 'text-gray-600';
                    let amountPrefix = '';

                    if (entry.type === 'start') {
                        dotColor = 'bg-primary-500';
                    } else if (entry.type === 'today') {
                        dotColor = 'bg-indigo-500';
                    } else if (isDeposit) {
                        dotColor = 'bg-green-500';
                        amountColor = 'text-green-700';
                        amountPrefix = '+';
                    } else if (isWithdrawal) {
                        dotColor = 'bg-red-500';
                        amountColor = 'text-red-700';
                    }

                    return (
                        <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                            {/* Dot */}
                            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 border-white ${dotColor} flex items-center justify-center shadow-sm`}>
                                {entry.type === 'start' && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {entry.type === 'today' && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {entry.type === 'movement' && isDeposit && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {entry.type === 'movement' && isWithdrawal && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.date)}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {entry.amount !== null && (
                                            <p className={`text-sm font-semibold ${amountColor}`}>
                                                {amountPrefix}{formatCOP(Math.abs(entry.amount))}
                                            </p>
                                        )}
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatCOP(entry.balance)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

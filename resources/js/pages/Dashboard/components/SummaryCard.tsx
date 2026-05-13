import { ReactNode } from 'react';
import { formatCOP } from '@/utils/currency';

interface SummaryCardProps {
    label: string;
    amount: number;
    icon: ReactNode;
    iconBg: string;
    trend?: 'positive' | 'negative' | 'neutral';
}

export default function SummaryCard({ label, amount, icon, iconBg, trend = 'neutral' }: SummaryCardProps) {
    const amountClass =
        trend === 'positive' ? 'text-green-700' :
        trend === 'negative' ? 'text-red-700' :
        'text-gray-900';

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${amountClass}`}>{formatCOP(amount)}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

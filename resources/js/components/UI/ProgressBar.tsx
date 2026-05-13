interface ProgressBarProps {
    value: number; // 0-100
    className?: string;
    color?: string;
    height?: string;
}

export default function ProgressBar({
    value,
    className = '',
    color = 'bg-primary-600',
    height = 'h-2',
}: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height} ${className}`}>
            <div
                className={`${color} ${height} rounded-full transition-all duration-500`}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

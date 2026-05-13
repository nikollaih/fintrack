import { CropCycle } from '@/types';

interface CycleTimelineProps {
    cycle: CropCycle;
}

const phases = [
    { key: 'planned', label: 'Planeado' },
    { key: 'active', label: 'Activo' },
    { key: 'harvested', label: 'Cosechado' },
];

const statusOrder: Record<string, number> = {
    planned: 0,
    active: 1,
    harvested: 2,
    failed: 3,
};

export default function CycleTimeline({ cycle }: CycleTimelineProps) {
    const current = statusOrder[cycle.status] ?? 0;
    const isFailed = cycle.status === 'failed';

    return (
        <div className="flex items-center gap-0">
            {phases.map((phase, i) => {
                const done = !isFailed && current > i;
                const active = !isFailed && current === i;

                return (
                    <div key={phase.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${isFailed ? 'bg-red-100 text-red-600' :
                                  done ? 'bg-green-500 text-white' :
                                  active ? 'bg-primary-600 text-white' :
                                  'bg-gray-200 text-gray-400'}`}
                            >
                                {done ? '✓' : i + 1}
                            </div>
                            <span className={`mt-1 text-xs font-medium
                                ${active ? 'text-primary-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
                                {phase.label}
                            </span>
                        </div>
                        {i < phases.length - 1 && (
                            <div className={`flex-1 h-1 mx-1 rounded-full ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}

            {isFailed && (
                <div className="ml-4 flex items-center gap-1.5 text-red-600 text-sm font-medium">
                    <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">✗</span>
                    Fallido
                </div>
            )}
        </div>
    );
}

import { Category } from '@/types';

interface CategoryChipProps {
    category?: Category | null;
    fallback?: string | null;
}

export default function CategoryChip({ category, fallback }: CategoryChipProps) {
    if (category) {
        return (
            <span className="inline-flex items-center gap-1.5">
                <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-gray-800">{category.name}</span>
            </span>
        );
    }
    if (fallback) {
        return <span className="text-sm text-gray-500">{fallback}</span>;
    }
    return <span className="text-sm text-gray-300">—</span>;
}

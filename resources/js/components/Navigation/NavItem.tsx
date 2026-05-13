import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';

interface NavItemProps {
    href: string;
    active: boolean;
    icon: ReactNode;
    label: string;
    collapsed?: boolean;
    badge?: number;
}

export default function NavItem({ href, active, icon, label, collapsed, badge }: NavItemProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            {!collapsed && (
                <>
                    <span className="flex-1">{label}</span>
                    {badge != null && badge > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
}

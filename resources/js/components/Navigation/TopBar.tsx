import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';

interface TopBarProps {
    onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const { auth } = usePage<{ auth: { user: { name: string; email: string } } }>().props;
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-14 px-4 lg:px-6">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="flex-1" />

                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-700">
                                {auth.user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="hidden sm:block text-sm font-medium text-gray-700">
                            {auth.user.name}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-1">
                                <div className="px-3 py-2 border-b border-gray-100">
                                    <p className="text-xs font-medium text-gray-900 truncate">{auth.user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{auth.user.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

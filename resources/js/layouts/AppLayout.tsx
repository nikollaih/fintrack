import { ReactNode, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/components/Navigation/Sidebar';
import TopBar from '@/components/Navigation/TopBar';
import { ToastProvider, useToast } from '@/components/UI/Toast';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
}

// Reads flash messages from Inertia shared props and fires toasts
function FlashToaster() {
    const { flash } = usePage<{ flash: Record<string, string | null> }>().props;
    const { showToast } = useToast();

    useEffect(() => {
        if (flash?.success) showToast(flash.success, 'success');
        if (flash?.warning) showToast(flash.warning, 'info');
        if (flash?.error)   showToast(flash.error,   'error');
    }, [flash]);

    return null;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
        <Head title={title ?? ''} />
        <ToastProvider>
            <FlashToaster />
            <div className="flex h-screen bg-gray-50">
                <Sidebar open={sidebarOpen} />

                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />

                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
                            {title && (
                                <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
                            )}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ToastProvider>
        </>
    );
}

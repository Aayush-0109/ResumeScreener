import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    LogOut,
    Menu,
    X,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { useAuthStore } from '../../state/authStore';

export const AppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
        { name: 'Resumes', href: '/resumes', icon: FileText },
        { name: 'Match', href: '/match', icon: Zap },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            { }
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            { }
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Zap className="h-6 w-6 fill-current" />
                        <span>Siftly</span>
                    </div>
                    <button
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100vh-4rem)] justify-between p-4">
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="space-y-4">
                        <div className="px-3 py-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            className="w-full flex items-center justify-start px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-md transition-colors"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            { }
            <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between lg:hidden">
                    <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
                        <Zap className="h-5 w-5 text-primary fill-current" />
                        <span>Siftly</span>
                    </div>
                    <button
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

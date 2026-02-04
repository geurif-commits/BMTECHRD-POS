import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Utensils,
    ChefHat,
    Wine,
    CreditCard,
    LogOut,
    Menu,
    X,
    User as UserIcon,
    Package,
    Users,
    Settings,
    LayoutGrid,
    BarChart3,
    Wallet,
    Shield,
    Lock
} from 'lucide-react';
import LockScreen from '../components/common/LockScreen';
import { useStore } from '../stores/useStore';
import clsx from 'clsx';

export default function DashboardLayout() {
    const { user, setUser, business, deviceId } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [locked, setLocked] = useState<boolean>(() => localStorage.getItem('appLocked') === 'true');

    useEffect(() => {
        const onStorage = () => setLocked(localStorage.getItem('appLocked') === 'true');
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const menuItems = [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
            roles: ['OWNER', 'ADMIN']
        },
        {
            label: 'Mesas / Pedidos',
            path: '/waiter',
            icon: Utensils,
            roles: ['CAMARERO', 'ADMIN', 'SUPERVISOR']
        },
        {
            label: 'Cocina',
            path: '/kitchen',
            icon: ChefHat,
            roles: ['COCINA', 'ADMIN', 'SUPERVISOR']
        },
        {
            label: 'Bar',
            path: '/bar',
            icon: Wine,
            roles: ['BARTENDER', 'ADMIN', 'SUPERVISOR']
        },
        {
            label: 'Caja',
            path: '/cashier',
            icon: CreditCard,
            roles: ['CAJA', 'ADMIN', 'SUPERVISOR']
        },
        // Separator
        { separator: true },
        // Admin Section
        {
            label: 'Mesas',
            path: '/admin/tables',
            icon: LayoutGrid,
            roles: ['ADMIN', 'OWNER', 'SUPERVISOR']
        },
        {
            label: 'Productos',
            path: '/admin/products',
            icon: Package,
            roles: ['ADMIN', 'OWNER', 'SUPERVISOR']
        },
        {
            label: 'Reportes Avanzados',
            path: '/admin/reports',
            icon: BarChart3,
            roles: ['ADMIN', 'OWNER']
        },
        {
            label: 'Inventario',
            path: '/admin/inventory-reports',
            icon: Package,
            roles: ['ADMIN', 'OWNER', 'SUPERVISOR']
        },
        {
            label: 'Cuadre de Caja',
            path: '/admin/cash',
            icon: Wallet,
            roles: ['ADMIN', 'OWNER', 'CAJA']
        },
        {
            label: 'Usuarios',
            path: '/admin/users',
            icon: Users,
            roles: ['ADMIN', 'OWNER']
        },
        {
            label: 'Configuración',
            path: '/admin/settings',
            icon: Settings,
            roles: ['ADMIN', 'OWNER']
        },
        {
            label: 'Panel Global (Admin)',
            path: '/superadmin',
            icon: Shield,
            roles: ['ADMIN', 'OWNER']
        }
    ];

    // Filtramos por rol, pero si es ADMIN ve todo
    const allowedItems = menuItems.filter(item => {
        // Always include separators
        if ('separator' in item && item.separator) return true;
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        return item.roles?.includes(user.role);
    });

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:transform-none shadow-xl flex flex-col",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent uppercase">
                            {business?.name || 'BMTECHRD'}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wider">POS SYSTEM</p>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)} 
                        className="lg:hidden text-slate-400 hover:text-white"
                        title="Cerrar menú lateral"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {allowedItems.map((item, index) => {
                        // Render separator
                        if ('separator' in item && item.separator) {
                            return (
                                <div key={`separator-${index}`} className="my-3 border-t border-slate-800" />
                            );
                        }

                        const isActive = location.pathname.startsWith(item.path || '');
                        const Icon = item.icon!;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path!}
                                onClick={() => setSidebarOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
                                <span className="font-medium relative z-10">{item.label}</span>
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                            <UserIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-200 font-medium truncate text-sm">{user?.name || 'Usuario'}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-slate-500 text-xs truncate capitalize">{user?.role?.toLowerCase()}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>

                    <button
                        onClick={() => { localStorage.setItem('appLocked', 'true'); setLocked(true); }}
                        className="w-full mt-2 flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-700/10 hover:text-slate-200 transition-colors text-sm font-medium"
                    >
                        <Lock size={18} />
                        <span>Bloquear pantalla</span>
                    </button>

                    {deviceId && (
                        <div className="mt-4 px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50 text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Terminal ID: {deviceId}</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
                {/* Header (Mobile) */}
                <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between z-30 shadow-sm shrink-0">
                    <button 
                        onClick={() => setSidebarOpen(true)} 
                        className="text-slate-500 hover:text-primary-600 transition-colors"
                        title="Abrir menú lateral"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-slate-800 uppercase tracking-tight">
                        {business?.name || 'BMTECHRD POS'}
                    </span>
                    <div className="w-8" />
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 relative scroll-smooth">
                    <Outlet />
                    <LockScreen isLocked={locked} onUnlock={() => setLocked(false)} />
                </div>
            </main>
        </div>
    );
}

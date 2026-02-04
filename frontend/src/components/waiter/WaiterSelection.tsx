import React from 'react';
import { motion } from 'framer-motion';
import { User, Circle } from 'lucide-react';
import clsx from 'clsx';

interface Waiter {
    id: string;
    name: string;
    avatar?: string;
    hasOpenOrders: boolean;
}

interface WaiterSelectionProps {
    waiters: Waiter[];
    onSelect: (waiter: Waiter) => void;
}

export const WaiterSelection: React.FC<WaiterSelectionProps> = ({ waiters, onSelect }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">
                    Panel de Camareros
                </h1>
                <p className="text-slate-500 text-lg">
                    Selecciona tu usuario para comenzar a tomar pedidos
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-6xl w-full">
                {waiters.map((waiter) => (
                    <motion.button
                        key={waiter.id}
                        whileHover={{ y: -8, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(waiter)}
                        className="flex flex-col items-center group relative"
                    >
                        {/* Waiter Icon/Avatar */}
                        <div className={clsx(
                            "w-24 h-24 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300 shadow-xl",
                            waiter.hasOpenOrders
                                ? "bg-gradient-to-br from-primary-500 to-blue-600 text-white ring-4 ring-primary-100 ring-offset-2"
                                : "bg-white text-slate-400 group-hover:bg-slate-100 border border-slate-200"
                        )}>
                            {waiter.avatar ? (
                                <img src={waiter.avatar} alt={waiter.name} className="w-full h-full object-cover rounded-3xl" />
                            ) : (
                                <User size={48} strokeWidth={1.5} />
                            )}

                            {/* Active Indicator */}
                            {waiter.hasOpenOrders && (
                                <div className="absolute top-0 right-0 p-1">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="bg-green-400 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center"
                                    >
                                        <Circle size={8} fill="currentColor" className="text-green-800" />
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* Waiter Name */}
                        <h3 className={clsx(
                            "font-bold text-lg transition-colors group-hover:text-primary-600",
                            waiter.hasOpenOrders ? "text-slate-900" : "text-slate-600"
                        )}>
                            {waiter.name}
                        </h3>

                        {/* Badge for open tables */}
                        {waiter.hasOpenOrders && (
                            <span className="text-[10px] mt-1 font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                Mesas Abiertas
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            {waiters.length === 0 && (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <User size={64} className="text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-400">No hay camareros configurados</h2>
                    <p className="text-slate-400 mt-1">Configurados en el panel de Administración</p>
                </div>
            )}
        </div>
    );
};

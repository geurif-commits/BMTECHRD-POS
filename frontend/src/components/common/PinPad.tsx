import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete } from 'lucide-react';
import clsx from 'clsx';

interface PinPadProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => void;
    title?: string;
    loading?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
    isOpen,
    onClose,
    onVerify,
    title = "Verificación de Seguridad",
    loading = false
}) => {
    const [pin, setPin] = useState('');

    // Handle keyboard input (numbers, numpad, backspace, enter)
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            const key = e.key;
            if (/^[0-9]$/.test(key)) {
                e.preventDefault();
                handleKeyPress(key);
            } else if (key === 'Backspace' || key === 'Delete') {
                e.preventDefault();
                handleDelete();
            } else if (key === 'Enter') {
                e.preventDefault();
                if (pin.length === 4) onVerify(pin);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, pin]);

    const handleKeyPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                onVerify(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-sm w-full border border-slate-100"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            title="Cerrar PIN pad"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center">
                        {/* PIN Display */}
                        <div className="flex gap-4 mb-10">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border-2",
                                        pin.length > i
                                            ? "bg-primary-600 border-primary-600 shadow-lg shadow-primary-200"
                                            : "bg-slate-50 border-slate-200"
                                    )}
                                >
                                    {pin.length > i && (
                                        <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Number Grid */}
                        <div className="grid grid-cols-3 gap-4 w-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <motion.button
                                    key={num}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleKeyPress(num.toString())}
                                    disabled={loading}
                                    className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-2xl font-bold flex items-center justify-center transition-all border border-slate-100 active:bg-primary-50 active:text-primary-600 active:border-primary-100"
                                >
                                    {num}
                                </motion.button>
                            ))}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClear}
                                className="h-16 rounded-2xl text-slate-400 hover:text-red-500 font-bold flex items-center justify-center transition-colors text-xs uppercase tracking-widest"
                            >
                                Limpiar
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleKeyPress('0')}
                                className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-2xl font-bold flex items-center justify-center transition-all border border-slate-100 active:bg-primary-50 active:text-primary-600 active:border-primary-100"
                            >
                                0
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDelete}
                                className="h-16 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                            >
                                <Delete size={24} />
                            </motion.button>
                        </div>

                        {loading && (
                            <div className="mt-6 flex items-center gap-2 text-primary-600">
                                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                <span className="font-bold text-sm">Verificando...</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

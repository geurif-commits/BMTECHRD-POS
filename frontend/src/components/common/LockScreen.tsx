import React, { useState, useEffect } from 'react';
import { PinPad } from './PinPad';
import api from '../../stores/api';
import { useStore } from '../../stores/useStore';
import { motion } from 'framer-motion';

export const LockScreen: React.FC<{ isLocked: boolean; onUnlock: () => void }> = ({ isLocked, onUnlock }) => {
  const [showPad, setShowPad] = useState(isLocked);
  const [loading, setLoading] = useState(false);
  const { user } = useStore();

  const handleVerify = async (pin: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.post('/users/verify-pin', { userId: user.id, pin });
      // unlock
      localStorage.setItem('appLocked', 'false');
      setShowPad(false);
      onUnlock();
    } catch (err) {
      // Pin incorrecto -> keep pad open
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowPad(isLocked);
  }, [isLocked]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full p-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Sistema Bloqueado</h2>
          <p className="text-sm text-slate-500 mb-4">Ingrese su PIN para desbloquear</p>
          <PinPad isOpen={showPad} onClose={() => {}} onVerify={handleVerify} title="Desbloquear" loading={loading} />
        </div>
      </motion.div>
    </div>
  );
};

export default LockScreen;

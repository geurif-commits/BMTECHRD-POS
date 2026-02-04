import React from 'react';
import { motion } from 'framer-motion';
import type { Table as TableType } from '../../stores/useStore';
import { Square } from 'lucide-react';
import clsx from 'clsx';

interface TablesGridProps {
  tables: TableType[];
  onTableSelect: (table: TableType) => void;
  selectedTableId?: string;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'FREE':
      return {
        container: 'bg-white border-2 border-slate-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20',
        icon: 'text-green-500',
        bg: 'bg-green-50'
      };
    case 'OCCUPIED':
      return {
        container: 'bg-white border-2 border-slate-200 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20',
        icon: 'text-red-500',
        bg: 'bg-red-50'
      };
    case 'RESERVED':
      return {
        container: 'bg-white border-2 border-slate-200 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20',
        icon: 'text-yellow-500',
        bg: 'bg-yellow-50'
      };
    default:
      return {
        container: 'bg-white border-2 border-slate-200',
        icon: 'text-slate-400',
        bg: 'bg-slate-50'
      };
  }
};

export const TablesGrid: React.FC<TablesGridProps> = ({
  tables,
  onTableSelect,
  selectedTableId
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {tables.map((table) => {
        const styles = getStatusStyles(table.status);
        const isSelected = selectedTableId === table.id;

        return (
          <motion.button
            key={table.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTableSelect(table)}
            className={clsx(
              "relative flex flex-col items-center justify-center p-4 h-32 rounded-xl transition-all duration-300 shadow-md",
              styles.container,
              isSelected && "ring-2 ring-primary-500 ring-offset-2 border-primary-500"
            )}
          >
            {/* Background Circle */}
            <div className={clsx("absolute inset-0 rounded-xl opacity-20", styles.bg)} />

            {/* Icon and Number */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
              {/* Table Icon */}
              <div className={clsx("p-3 rounded-full", styles.bg)}>
                <Square size={28} className={styles.icon} />
              </div>
              
              {/* Table Number */}
              <span className="text-3xl font-bold text-slate-800 leading-none">
                {table.number}
              </span>
            </div>

            {/* Waiter Name if Occupied */}
            {table.status === 'OCCUPIED' && table.reservedBy && (
              <div className="absolute top-2 right-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-full font-semibold shadow-lg z-10 whitespace-nowrap">
                {table.reservedBy.name}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

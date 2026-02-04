import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  categoryId?: string;
  category?: { id: string; name: string };
  image?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  products?: Product[] | unknown[];
}

interface ProductsGridProps {
  products: Product[];
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddProduct: (product: Product) => void;
}

export function ProductsGrid({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddProduct
}: ProductsGridProps) {
  const [expandedType, setExpandedType] = useState<'FOOD' | 'DRINK' | null>(null);

  // Reset expanded type when selected category changes
  useEffect(() => {
    setExpandedType(null);
  }, [selectedCategoryId]);

  // Separate categories by type
  const foodCategories = categories.filter(c => c.type === 'FOOD');
  const drinkCategories = categories.filter(c => c.type === 'DRINK');

  // Filter products based on selected category
  const filtered = selectedCategoryId
    ? products.filter((p) => {
        return p.categoryId === selectedCategoryId || p.category?.id === selectedCategoryId;
      })
    : products;

  const handleMainSelect = (type: 'FOOD' | 'DRINK' | null) => {
    if (type === null) {
      onSelectCategory(null);
      setExpandedType(null);
    } else if (expandedType === type) {
      setExpandedType(null);
      onSelectCategory(null);
    } else {
      setExpandedType(type);
      onSelectCategory(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Main Category Buttons */}
      <div className="p-3 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
        {/* Todos */}
        <button
          type="button"
          onClick={() => handleMainSelect(null)}
          className={clsx(
            "px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm border",
            selectedCategoryId === null && expandedType === null
              ? "bg-primary-600 text-white border-primary-600 shadow-primary-500/20"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          Todos
        </button>

        {/* Alimentos */}
        <button
          type="button"
          onClick={() => handleMainSelect('FOOD')}
          className={clsx(
            "px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm border flex items-center gap-1",
            expandedType === 'FOOD'
              ? "bg-primary-600 text-white border-primary-600 shadow-primary-500/20"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          Alimentos
          <ChevronDown size={16} className={clsx("transition-transform", expandedType === 'FOOD' && "rotate-180")} />
        </button>

        {/* Bebidas */}
        <button
          type="button"
          onClick={() => handleMainSelect('DRINK')}
          className={clsx(
            "px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm border flex items-center gap-1",
            expandedType === 'DRINK'
              ? "bg-primary-600 text-white border-primary-600 shadow-primary-500/20"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          Bebidas
          <ChevronDown size={16} className={clsx("transition-transform", expandedType === 'DRINK' && "rotate-180")} />
        </button>
      </div>

      {/* Subcategories Bar - Shows when type is expanded */}
      <AnimatePresence>
        {expandedType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50/80 border-b border-slate-200 overflow-hidden"
          >
            <div className="p-3 flex gap-2 overflow-x-auto custom-scrollbar flex-wrap">
              {(expandedType === 'FOOD' ? foodCategories : drinkCategories).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                    selectedCategoryId === cat.id
                      ? "bg-primary-600 text-white shadow-primary-500/20 shadow-lg"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:bg-primary-50"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
        {products.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p className="text-sm">Cargando productos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p className="text-sm">No hay productos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <motion.button
                key={product.id}
                type="button"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddProduct(product)}
                className="group bg-white rounded-xl border-2 border-slate-100 p-0 text-left hover:border-primary-400 hover:shadow-2xl hover:shadow-primary-500/15 transition-all flex flex-col h-40 overflow-hidden"
              >
                {/* Image Section */}
                <div className="h-24 w-full relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag size={24} strokeWidth={1} />
                    </div>
                  )}
                  {/* Price Badge */}
                  <div className="absolute bottom-1 right-1">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-xs px-2 py-0.5 rounded shadow-lg shadow-primary-500/40 backdrop-blur-sm">
                      ${(Number(product.price) || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Text Section */}
                <div className="p-2 flex flex-col justify-center flex-1 bg-white">
                  <p className="font-semibold text-slate-800 text-xs line-clamp-2 leading-snug">
                    {product.name}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Grid, List, ChefHat, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    cost?: number;
    type: 'FOOD' | 'DRINK';
    categoryId: string;
    category?: { name: string };
    isActive: boolean;
    hasStock: boolean;
    isIngredient: boolean;
    image?: string;
}

interface Category {
    id: string;
    name: string;
    type: 'FOOD' | 'DRINK';
    color?: string;
}

export function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        cost: '',
        type: 'FOOD' as 'FOOD' | 'DRINK',
        categoryId: '',
        hasStock: false,
        isIngredient: false,
        isActive: true,
        image: ''
    });

    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [recipeData, setRecipeData] = useState<Array<{ ingredientId: string; quantity: number }>>([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (showRecipeModal && selectedProduct) {
            fetchRecipe();
        }
    }, [showRecipeModal, selectedProduct]);

    const fetchRecipe = async () => {
        try {
            const { data } = await api.get(`/products/${selectedProduct?.id}/recipe`);
            setRecipeData(data.data.map((r: any) => ({ ingredientId: r.ingredientId, quantity: Number(r.quantity) })));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/products'),
                api.get('/products/categories')
            ]);
            setProducts(productsRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
        } catch (error) {
            toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                cost: formData.cost ? parseFloat(formData.cost) : undefined
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, payload);
                toast.success('Producto actualizado');
            } else {
                await api.post('/products', payload);
                toast.success('Producto creado');
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar producto');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Producto eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar producto');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            cost: '',
            type: 'FOOD',
            categoryId: '',
            hasStock: false,
            isIngredient: false,
            isActive: true,
            image: ''
        });
        setEditingProduct(null);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            cost: product.cost?.toString() || '',
            type: product.type,
            categoryId: product.categoryId,
            hasStock: product.hasStock,
            isIngredient: product.isIngredient,
            isActive: product.isActive,
            image: product.image || ''
        });
        setShowModal(true);
    };

    const filteredProducts = Array.isArray(products) ? products.filter(p =>
        p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-primary-500" /> Productos
                    </h1>
                    <p className="text-slate-500 text-sm">Gestiona tu menú y productos</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                >
                    <Plus size={20} />
                    <span>Nuevo Producto</span>
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            'p-2 rounded-lg transition-colors',
                            viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600'
                        )}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            'p-2 rounded-lg transition-colors',
                            viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600'
                        )}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            <div className={clsx(
                'flex-1 overflow-auto custom-scrollbar',
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'
            )}>
                {filteredProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={clsx(
                            'bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-all shadow-sm hover:shadow-md',
                            viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-4'
                        )}
                    >
                        {viewMode === 'grid' ? (
                            <>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={clsx(
                                        'px-2 py-1 text-xs font-semibold rounded-lg',
                                        product.type === 'FOOD' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    )}>
                                        {product.type === 'FOOD' ? 'Comida' : 'Bebida'}
                                    </span>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setSelectedProduct(product); setShowRecipeModal(true); }} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Receta">
                                            <ChefHat size={16} />
                                        </button>
                                        <button onClick={() => openEditModal(product)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">{product.name}</h3>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{product.description || 'Sin descripción'}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-primary-600">${(Number(product.price) || 0).toFixed(2)}</span>
                                    <span className={clsx(
                                        'text-xs px-2 py-1 rounded-full',
                                        product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    )}>
                                        {product.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900">{product.name}</h3>
                                    <p className="text-sm text-slate-500">{product.category?.name}</p>
                                </div>
                                <span className="text-lg font-bold text-primary-600">${(Number(product.price) || 0).toFixed(2)}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(product)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Costo</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'FOOD' | 'DRINK' })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="FOOD">Comida</option>
                                        <option value="DRINK">Bebida</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                    <select
                                        required
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.filter(c => c.type === formData.type).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen</label>
                                    <input
                                        type="url"
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    {formData.image && (
                                        <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="hasStock"
                                        checked={formData.hasStock}
                                        onChange={(e) => setFormData({ ...formData, hasStock: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="hasStock" className="text-sm font-medium text-slate-700">Controlar inventario</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isIngredient"
                                        checked={formData.isIngredient}
                                        onChange={(e) => setFormData({ ...formData, isIngredient: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="isIngredient" className="text-sm font-medium text-slate-700">Es un Insumo / Ingrediente</label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                                    >
                                        {editingProduct ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showRecipeModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Receta - {selectedProduct.name}</h2>
                                <button
                                    onClick={() => { setShowRecipeModal(false); setSelectedProduct(null); }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {recipeData.length === 0 ? (
                                <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <Info size={16} />
                                    <span>Este producto no tiene receta registrada.</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recipeData.map((r) => {
                                        const ingredient = products.find(p => p.id === r.ingredientId);
                                        return (
                                            <div key={r.ingredientId} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                                <span className="text-slate-700 font-medium">{ingredient?.name || r.ingredientId}</span>
                                                <span className="text-slate-500 font-mono text-sm">{r.quantity}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowRecipeModal(false); setSelectedProduct(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

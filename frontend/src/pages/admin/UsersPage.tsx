import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Users, Key, UserCheck, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../stores/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    pin: string;
    isActive: boolean;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
}

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: '',
        pin: '',
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/users/roles')
            ]);
            setUsers(usersRes.data.data || []);
            setRoles(rolesRes.data.data || []);
        } catch (error) {
            console.error('Error fetching users/roles:', error);
            toast.error('Error al cargar datos de usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const payload: any = { ...formData };
                if (!payload.password) {
                    delete payload.password;
                }
                await api.put(`/users/${editingUser.id}`, payload);
                toast.success('Usuario actualizado');
            } else {
                await api.post('/users', formData);
                toast.success('Usuario creado');
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            toast.success('Usuario eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    const generateRandomPin = () => {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        setFormData({ ...formData, pin });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            roleId: '',
            pin: '',
            isActive: true
        });
        setEditingUser(null);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            roleId: roles.find(r => r.name === user.role)?.id || '',
            pin: user.pin,
            isActive: user.isActive
        });
        setShowModal(true);
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            'ADMIN': 'bg-purple-100 text-purple-700',
            'OWNER': 'bg-blue-100 text-blue-700',
            'SUPERVISOR': 'bg-green-100 text-green-700',
            'CAMARERO': 'bg-yellow-100 text-yellow-700',
            'COCINERO': 'bg-orange-100 text-orange-700',
            'BARTENDER': 'bg-cyan-100 text-cyan-700',
            'CAJERO': 'bg-pink-100 text-pink-700'
        };
        return colors[role] || 'bg-slate-100 text-slate-700';
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <Users className="text-primary-500" /> Usuarios
                    </h1>
                    <p className="text-slate-500 text-sm">Gestiona el personal del sistema</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                >
                    <Plus size={20} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                        <motion.div
                            key={user.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-all shadow-sm hover:shadow-md p-4"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                        <Users size={24} className="text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{user.name}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <UserIcon size={14} />
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        title="Editar usuario"
                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        title="Eliminar usuario"
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={clsx('px-2 py-1 text-xs font-semibold rounded-lg', getRoleBadge(user.role))}>
                                    {user.role}
                                </span>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Key size={14} />
                                    <span className="font-mono font-bold">{user.pin}</span>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className={clsx(
                                    'text-xs px-2 py-1 rounded-full flex items-center gap-1',
                                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                )}>
                                    <UserCheck size={12} />
                                    {user.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
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
                            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar' : 'Nuevo'} Usuario</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        title="Nombre completo"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                                    <input
                                        type="text"
                                        required
                                        title="Usuario o email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="ej: admin, camarero1 o email@ejemplo.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Contraseña {editingUser && '(dejar en blanco para no cambiar)'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        title="Contraseña"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                    <select
                                        required
                                        title="Rol"
                                        value={formData.roleId}
                                        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">Seleccionar rol...</option>
                                        {roles.length > 0 ? roles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.name} {role.description ? `- ${role.description}` : ''}
                                            </option>
                                        )) : (
                                            <option disabled>Cargando roles...</option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">PIN (4 dígitos)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            pattern="[0-9]{4}"
                                            maxLength={4}
                                            value={formData.pin}
                                            onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-center text-lg"
                                            placeholder="0000"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateRandomPin}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
                                        >
                                            Generar
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Usuario Activo</label>
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
                                        {editingUser ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

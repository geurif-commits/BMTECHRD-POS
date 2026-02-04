import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '../types/roles';

interface User {
  id: string;
  name: string;
  businessCode?: number;
  email: string;
  role: UserRole;
  businessId: string;
  pin: string;
  token: string;
}

interface Business {
  id: string;
  businessCode?: number;
  name: string;
  address?: string;
  phone?: string;
  rnc?: string;
  email?: string;
  currency?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountType?: string;
}


export interface Table {
  id: string;
  number: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
  capacity?: number;
  name?: string;
  reservedAt?: string;
  reservedById?: string;
  reservedBy?: {
    id: string;
    name: string;
    pin?: string;
  };
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  status: string;
}

interface CartItem extends OrderItem {
  tempId: string;
}

interface StoreState {
  user: User | null;
  tables: Table[];
  cart: CartItem[];
  selectedTable: Table | null;
  socket: any | null;
  business: Business | null;
  deviceId: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTables: (tables: Table[]) => void;
  setSelectedTable: (table: Table | null) => void;
  addToCart: (item: Omit<CartItem, 'tempId'>) => void;
  removeFromCart: (tempId: string) => void;
  updateCartItem: (tempId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  setSocket: (socket: any) => void;
  setBusiness: (business: Business | null) => void;
  setDeviceId: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      tables: [],
      cart: [],
      selectedTable: null,
      socket: null,
      business: null,
      deviceId: null,

      setUser: (user) => set({ user }),
      setTables: (tables) => set({ tables }),
      setSelectedTable: (table) => set({ selectedTable: table }),

      addToCart: (item) => set((state) => {
        // Check if item with same productId already exists
        const existingItem = state.cart.find(cartItem => cartItem.productId === item.productId);
        
        if (existingItem) {
          // If exists, increment quantity
          return {
            cart: state.cart.map(cartItem =>
              cartItem.productId === item.productId
                ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
                : cartItem
            )
          };
        }
        
        // If not exists, add new item
        return {
          cart: [...state.cart, { ...item, tempId: Date.now().toString() }]
        };
      }),

      removeFromCart: (tempId) => set((state) => ({
        cart: state.cart.filter(item => item.tempId !== tempId)
      })),

      updateCartItem: (tempId, updates) => set((state) => ({
        cart: state.cart.map(item =>
          item.tempId === tempId ? { ...item, ...updates } : item
        )
      })),

      clearCart: () => set({ cart: [] }),
      setSocket: (socket) => set({ socket }),
      setBusiness: (business) => set({ business }),
      setDeviceId: (id) => set({ deviceId: id })
    }),
    {
      name: 'bmt-pos-storage',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        deviceId: state.deviceId
      })
    }
  )
);


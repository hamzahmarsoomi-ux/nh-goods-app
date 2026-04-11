import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_base64?: string;
}

interface CartState {
  items: CartItem[];
  
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    set((state) => {
      const existingIndex = state.items.findIndex(i => i.product_id === item.product_id);
      
      let newItems;
      if (existingIndex >= 0) {
        newItems = [...state.items];
        newItems[existingIndex].quantity += 1;
      } else {
        newItems = [...state.items, { ...item, quantity: 1 }];
      }
      
      AsyncStorage.setItem('cart', JSON.stringify(newItems));
      return { items: newItems };
    });
  },
  
  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter(i => i.product_id !== productId);
      AsyncStorage.setItem('cart', JSON.stringify(newItems));
      return { items: newItems };
    });
  },
  
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const newItems = state.items.filter(i => i.product_id !== productId);
        AsyncStorage.setItem('cart', JSON.stringify(newItems));
        return { items: newItems };
      }
      
      const newItems = state.items.map(i => 
        i.product_id === productId ? { ...i, quantity } : i
      );
      AsyncStorage.setItem('cart', JSON.stringify(newItems));
      return { items: newItems };
    });
  },
  
  clearCart: () => {
    AsyncStorage.removeItem('cart');
    set({ items: [] });
  },
  
  loadCart: async () => {
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      if (cartStr) {
        set({ items: JSON.parse(cartStr) });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  },
  
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  }
}));

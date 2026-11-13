import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export interface CartItem {
  productId: string;
  quantity: number;
  product: {
    _id: string;
    title: string;
    slug: string;
    pricePaise: number;
    compareAtPricePaise?: number;
    stock: number;
    images: { key: string; url: string; order: number }[];
    status: string;
    vendor?: {
      _id: string;
      storeName: string;
      slug: string;
    };
  };
  lineTotalPaise: number;
}

interface CartContextType {
  items: CartItem[];
  subtotalPaise: number;
  itemCount: number;
  vendorCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotalPaise, setSubtotalPaise] = useState<number>(0);
  const [itemCount, setItemCount] = useState<number>(0);
  const [vendorCount, setVendorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSubtotalPaise(0);
      setItemCount(0);
      setVendorCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      const data = res.data?.data;
      if (data) {
        setItems(data.items || []);
        setSubtotalPaise(data.subtotalPaise || 0);
        setItemCount(data.itemCount || 0);
        setVendorCount(data.vendorCount || 0);
      }
    } catch (error) {
      console.warn('Failed to refresh cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (
    productId: string,
    quantity: number = 1
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return false;
    }

    try {
      const res = await api.post(`/cart/items/${productId}`, { quantity });
      const data = res.data?.data;
      if (data) {
        setItems(data.items || []);
        setSubtotalPaise(data.subtotalPaise || 0);
        setItemCount(data.itemCount || 0);
        setVendorCount(data.vendorCount || 0);
      }
      toast.success('Added to cart!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not add item');
      return false;
    }
  };

  const updateQuantity = async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    try {
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      const data = res.data?.data;
      if (data) {
        setItems(data.items || []);
        setSubtotalPaise(data.subtotalPaise || 0);
        setItemCount(data.itemCount || 0);
        setVendorCount(data.vendorCount || 0);
      }
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not update quantity');
      return false;
    }
  };

  const removeItem = async (productId: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      const data = res.data?.data;
      if (data) {
        setItems(data.items || []);
        setSubtotalPaise(data.subtotalPaise || 0);
        setItemCount(data.itemCount || 0);
        setVendorCount(data.vendorCount || 0);
      }
      toast.success('Item removed from cart');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not remove item');
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    try {
      await api.delete('/cart');
      setItems([]);
      setSubtotalPaise(0);
      setItemCount(0);
      setVendorCount(0);
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not clear cart');
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotalPaise,
        itemCount,
        vendorCount,
        isLoading,
        refreshCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

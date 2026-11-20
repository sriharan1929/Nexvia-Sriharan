import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface WishlistItem {
  productId: string;
  title: string;
  slug: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  image?: string;
  vendorName?: string;
  ratingAverage?: number;
  ratingCount?: number;
  stock?: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'badavyapar_wishlist_v1';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to sync wishlist to storage:', err);
    }
  }, [items]);

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  const addToWishlist = (item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      toast.success('Added to Wishlist', {
        style: {
          border: '1px solid #FF3F6C',
          padding: '12px 16px',
          color: '#282C3F',
          fontSize: '13px',
          fontWeight: '600',
        },
      });
      return [...prev, item];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    toast('Removed from Wishlist', {
      style: {
        border: '1px solid #E9E9ED',
        padding: '12px 16px',
        color: '#535766',
        fontSize: '13px',
        fontWeight: '600',
      },
    });
  };

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.productId)) {
      removeFromWishlist(item.productId);
    } else {
      addToWishlist(item);
    }
  };

  const clearWishlist = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount: items.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

export default WishlistContext;


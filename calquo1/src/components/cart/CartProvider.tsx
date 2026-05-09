import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CartSummary, CartContextType } from './CartTypes';
import { StockItem } from '../stock/StockCard';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { getEffectivePrice } from '../stock/EnhancedStockTypes';

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const userKey = user?.email || user?.id || user?.gstNumber;

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    if (userKey) {
      setIsLoaded(false);
      const savedCart = localStorage.getItem(`cart-${userKey}`);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCartItems(parsed);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      setIsLoaded(true);
    } else {
      setCartItems([]);
      setIsLoaded(false);
    }
  }, [userKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (userKey && isLoaded) {
      localStorage.setItem(`cart-${userKey}`, JSON.stringify(cartItems));
    }
  }, [cartItems, userKey, isLoaded]);

  // Calculate cart summary
  const cartSummary: CartSummary = {
    totalItems: cartItems.length,
    totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    itemCount: cartItems.length
  };

  const addToCart = (
    stockItem: StockItem,
    quantity: number,
    isItemSet?: boolean,
    numberOfSets?: number,
    setPrice?: number,
    setDetails?: any
  ) => {
    // Check if user is retailer or trader
    if (user?.role !== 'retailer' && user?.role !== 'trader') {
      toast.error('Only retailers and traders can add items to cart');
      return;
    }

    // Check if item is already in cart
    const existingItemIndex = cartItems.findIndex(item =>
      item.stockItem.id === stockItem.id && item.isItemSet === isItemSet
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      setCartItems(prev => prev.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + quantity;
          const effectivePrice = getEffectivePrice(stockItem as any, user?.role, user?.profile?.retailerType);
          const unitPrice = isItemSet ? (setPrice || 0) : (effectivePrice || stockItem.price || 0);

          return {
            ...item,
            quantity: newQuantity,
            totalPrice: unitPrice * newQuantity
          };
        }
        return item;
      }));
      toast.success(`Updated ${isItemSet ? 'set' : 'item'} quantity in cart!`);
    } else {
      // Add new item to cart
      const effectivePrice = getEffectivePrice(stockItem as any, user?.role, user?.profile?.retailerType);
      const unitPrice = isItemSet ? (setPrice || 0) : (effectivePrice || stockItem.price || 0);

      const cartItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stockItem,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        addedDate: new Date().toISOString(),
        isItemSet,
        numberOfSets,
        setPrice,
        setDetails
      };

      setCartItems(prev => [cartItem, ...prev]);
      toast.success(`Added ${isItemSet ? 'set' : 'item'} to cart!`);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.id === cartItemId) {
        return {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const isInCart = (stockItemId: string): boolean => {
    return cartItems.some(item =>
      item.stockItem.id === stockItemId ||
      (item.stockItem as any).stockId === stockItemId ||
      item.stockItem.id.startsWith(`${stockItemId}-`)
    );
  };

  const getCartItemQuantity = (stockItemId: string): number => {
    const items = cartItems.filter(item =>
      item.stockItem.id === stockItemId ||
      (item.stockItem as any).stockId === stockItemId ||
      item.stockItem.id.startsWith(`${stockItemId}-`)
    );
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const contextValue: CartContextType = {
    cartItems,
    cartSummary,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItemQuantity
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

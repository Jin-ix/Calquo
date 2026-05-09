import { StockItem } from '../stock/StockCard';

export interface CartItem {
  id: string;
  stockItem: StockItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedDate: string;
  // For item sets
  isItemSet?: boolean;
  numberOfSets?: number;
  setPrice?: number;
  setDetails?: any;
}

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  itemCount: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  addToCart: (stockItem: StockItem, quantity: number, isItemSet?: boolean, numberOfSets?: number, setPrice?: number, setDetails?: any) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (stockItemId: string) => boolean;
  getCartItemQuantity: (stockItemId: string) => number;
}

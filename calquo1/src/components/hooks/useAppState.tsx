import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { StockItem } from '../stock/StockCard';
import { OrderRequest } from '../orders/OrderDialog';
import { PurchaseRequest } from '../purchase/PurchaseRequestsTable';
import { ItemSet, SetOrderRequest, SetPurchaseRequest } from '../stock/ItemSetTypes';
import { Rating } from '../rating/RatingSystem';
import { LogisticsAgent, DeliveryCity, OrderLogistics } from '../logistics/LogisticsTypes';
import { toast } from 'sonner';

// Mock data imports (these would normally come from your data layer)
const mockStocks: StockItem[] = [
  {
    id: '1',
    name: 'Premium Cotton T-Shirt',
    category: 'T-Shirts',
    size: 'M',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Male',
      sizeType: 'alphabet',
      size: 'M',
      displayName: 'Adult - Male - Alpha - M'
    },
    color: 'Blue',
    quantity: 150,
    price: 299,
    singleShopPrice: 299,
    multiShopPrice: 279,
    supplier: 'FashionCorp Manufacturing',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: '2024-01-15',
    minOrderQuantity: 10,
    description: 'High-quality cotton t-shirt with premium finish',
    fabricType: 'Cotton',
    fabricDescription: '100% pure cotton with soft combed finish.',
    images: [
      'https://images.unsplash.com/photo-1629196914380-bc80bf1b0009?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjB0LXNoaXJ0JTIwYmx1ZSUyMGFwcGFyZWx8ZW58MXx8fHwxNzU3MTM3MjM5fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    offerPrice: 249,
    offerType: 'time',
    offerTimeWeeks: 2,
    offerValidUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    offerCreatedDate: new Date().toISOString(),
    isTrending: true,
    trendingText: 'Festival Season Bestseller',
    trendingSetDate: new Date().toISOString(),
    deliveryTime: '5-10 days'
  },
  {
    id: '2',
    name: 'Denim Jacket',
    category: 'Jackets',
    size: 'L',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Unisex',
      sizeType: 'alphabet',
      size: 'L',
      displayName: 'Adult - Unisex - Alpha - L'
    },
    color: 'Black',
    quantity: 75,
    price: 899,
    singleShopPrice: 899,
    multiShopPrice: 849,
    supplier: 'Global Warehouse Solutions',
    supplierType: 'trader',
    location: 'Delhi, India',
    dateAdded: '2024-01-20',
    minOrderQuantity: 5,
    description: 'Classic denim jacket with modern cut',
    fabricType: 'Denim',
    fabricDescription: 'Heavy-weight 14oz cotton denim with stretch blend.',
    images: [
      'https://images.unsplash.com/photo-1657349038547-b18a07fb4329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGphY2tldCUyMGJsYWNrJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTcxMzcyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    deliveryTime: '10-20 days',
    tradersOnly: true
  },
  {
    id: '3',
    name: 'Summer Dress',
    category: 'Dresses',
    size: 'S',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Female',
      sizeType: 'alphabet',
      size: 'S',
      displayName: 'Adult - Female - Alpha - S'
    },
    color: 'White',
    quantity: 200,
    price: 549,
    singleShopPrice: 549,
    multiShopPrice: 499,
    supplier: 'StyleMax Industries',
    supplierType: 'manufacturer',
    location: 'Bangalore, Karnataka',
    dateAdded: '2024-01-18',
    minOrderQuantity: 8,
    description: 'Light and airy summer dress perfect for hot weather',
    fabricType: 'Cotton Blend',
    fabricDescription: 'Lightweight cotton-polyester blend with wrinkle-resistant finish.',
    images: [
      'https://images.unsplash.com/photo-1688269423811-36cfd52855a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHN1bW1lciUyMGRyZXNzJTIwd29tYW58ZW58MXx8fHwxNzU3MTM3MjU4fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    offerPrice: 429,
    offerType: 'quantity',
    offerMinQuantity: 20,
    offerCreatedDate: new Date().toISOString(),
    isTrending: true,
    trendingText: 'Hot Summer Pick',
    trendingSetDate: new Date().toISOString(),
    deliveryTime: '5-10 days'
  }
];

const mockLogisticsAgents: LogisticsAgent[] = [
  {
    id: 'LGA-001',
    name: 'SwiftLogistics Express',
    gstNumber: '27AABCS9603R1ZX',
    mobileNumber: '9876543210',
    serviceArea: {
      type: 'all-india'
    },
    isActive: true,
    dateAdded: '2024-01-10T00:00:00Z',
    totalDeliveries: 1250,
    rating: 4.8,
    specialServices: ['Same Day Delivery', 'Express Delivery', 'Real-time Tracking', 'COD Available']
  }
];

const mockDeliveryCities: DeliveryCity[] = [
  {
    id: 'CITY-001',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    pincode: '171001',
    isActive: true,
    dateAdded: '2024-01-10T00:00:00Z'
  }
];

const mockItemSets: ItemSet[] = [
  {
    id: 'SET-001',
    name: 'Premium T-Shirt Combo Pack',
    category: 'T-Shirts',
    color: 'Navy Blue',
    description: 'Complete size range of premium navy t-shirts for retail stores',
    supplier: 'FashionCorp Manufacturing',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: '2024-01-15',
    sizeQuantities: [
      {
        sizeDetails: {
          ageCategory: 'Adult',
          genderCategory: 'Male',
          sizeType: 'alphabet',
          size: 'M',
          displayName: 'Adult - Male - Alpha - M'
        },
        quantity: 8,
        available: 75
      }
    ],
    setPrice: 1899,
    singleShopSetPrice: 1899,
    multiShopSetPrice: 1699,
    minOrderSets: 2,
    totalPiecesInSet: 14,
    images: [
      'https://images.unsplash.com/photo-1629196914380-bc80bf1b0009?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjB0LXNoaXJ0JTIwYmx1ZSUyMGFwcGFyZWx8ZW58MXx8fHwxNzU3MTM3MjM5fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ]
  }
];

export function useAppState() {
  const { user } = useAuth();
  
  // Core state
  const [activeView, setActiveView] = useState('home');
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['home']);
  
  // Data state
  const [stocks, setStocks] = useState<StockItem[]>(mockStocks);
  const [itemSets, setItemSets] = useState<ItemSet[]>(mockItemSets);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [preferredSuppliers, setPreferredSuppliers] = useState<string[]>([]);
  
  // Item set state
  const [itemSetOrders, setItemSetOrders] = useState<SetOrderRequest[]>([]);
  const [itemSetPurchaseRequests, setItemSetPurchaseRequests] = useState<SetPurchaseRequest[]>([]);
  
  // Logistics state
  const [logisticsAgents, setLogisticsAgents] = useState<LogisticsAgent[]>(mockLogisticsAgents);
  const [cities, setCities] = useState<DeliveryCity[]>(mockDeliveryCities);
  
  // Dialog state
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState<{
    orderNumber: string;
    itemName: string;
    quantity: number;
    buyerName: string;
    unitPrice: number;
    totalAmount: number;
    status: string;
  } | null>(null);
  
  const [showLogisticsSelection, setShowLogisticsSelection] = useState(false);
  const [pendingOrderForLogistics, setPendingOrderForLogistics] = useState<Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'> | null>(null);
  
  // Legacy logistics state
  const [showLogisticsSelector, setShowLogisticsSelector] = useState(false);
  const [selectedRequestForLogistics, setSelectedRequestForLogistics] = useState<PurchaseRequest | null>(null);



  // Handle PWA shortcuts and set initial view
  useEffect(() => {
    if (!user) return;
    
    try {
      const pwaShortcut = sessionStorage.getItem('pwa-shortcut');
      if (pwaShortcut) {
        sessionStorage.removeItem('pwa-shortcut');
        switch (pwaShortcut) {
          case 'browse-stock':
            setActiveView('browse-stock');
            break;
          case 'orders':
            setActiveView('orders');
            break;
          case 'add-stock':
            if (user.role === 'manufacturer' || user.role === 'warehouse') {
              setActiveView('add-stock');
            } else {
              setActiveView('browse-stock');
            }
            break;
          default:
            setActiveView('home');
        }
      } else {
        setActiveView('home');
      }
      
      setTimeout(() => setIsAppReady(true), 100);
    } catch (error) {
      console.warn('Error setting up initial view:', error);
      setActiveView('home');
      setIsAppReady(true);
    }
  }, [user?.role]);

  // Safety timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAppReady && !hasTimedOut) {
        console.warn('App initialization timed out, forcing ready state');
        setHasTimedOut(true);
        setIsAppReady(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isAppReady, hasTimedOut]);

  return {
    // State
    activeView,
    setActiveView,
    isAppReady,
    hasTimedOut,
    navigationHistory,
    setNavigationHistory,
    stocks,
    setStocks,
    itemSets,
    setItemSets,
    orders,
    setOrders,
    purchaseRequests,
    setPurchaseRequests,
    ratings,
    setRatings,
    preferredSuppliers,
    setPreferredSuppliers,
    itemSetOrders,
    setItemSetOrders,
    itemSetPurchaseRequests,
    setItemSetPurchaseRequests,
    logisticsAgents,
    setLogisticsAgents,
    cities,
    setCities,
    showOrderConfirmation,
    setShowOrderConfirmation,
    confirmationOrderDetails,
    setConfirmationOrderDetails,
    showLogisticsSelection,
    setShowLogisticsSelection,
    pendingOrderForLogistics,
    setPendingOrderForLogistics,
    showLogisticsSelector,
    setShowLogisticsSelector,
    selectedRequestForLogistics,
    setSelectedRequestForLogistics
  };
}

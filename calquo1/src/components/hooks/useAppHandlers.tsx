import { useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { StockItem } from '../stock/StockCard';
import { OrderRequest } from '../orders/OrderDialog';
import { PurchaseRequest } from '../purchase/PurchaseRequestsTable';
import { ItemSet, SetOrderRequest, SetPurchaseRequest } from '../stock/ItemSetTypes';
import { Rating } from '../rating/RatingSystem';
import { LogisticsAgent, DeliveryCity, OrderLogistics } from '../logistics/LogisticsTypes';
import { toast } from 'sonner';
import { useStock } from '../context/StockContext';

interface AppHandlersProps {
  user: any;
  stocks: StockItem[];
  setStocks: (stocks: StockItem[] | ((prev: StockItem[]) => StockItem[])) => void;
  itemSets: ItemSet[];
  setItemSets: (itemSets: ItemSet[] | ((prev: ItemSet[]) => ItemSet[])) => void;
  orders: OrderRequest[];
  setOrders: (orders: OrderRequest[] | ((prev: OrderRequest[]) => OrderRequest[])) => void;
  purchaseRequests: PurchaseRequest[];
  setPurchaseRequests: (purchaseRequests: PurchaseRequest[] | ((prev: PurchaseRequest[]) => PurchaseRequest[])) => void;
  ratings: Rating[];
  setRatings: (ratings: Rating[] | ((prev: Rating[]) => Rating[])) => void;
  suppliers: any[];

  itemSetOrders: SetOrderRequest[];
  setItemSetOrders: (itemSetOrders: SetOrderRequest[] | ((prev: SetOrderRequest[]) => SetOrderRequest[])) => void;
  itemSetPurchaseRequests: SetPurchaseRequest[];
  setItemSetPurchaseRequests: (itemSetPurchaseRequests: SetPurchaseRequest[] | ((prev: SetPurchaseRequest[]) => SetPurchaseRequest[])) => void;
  logisticsAgents: LogisticsAgent[];
  setLogisticsAgents: (logisticsAgents: LogisticsAgent[] | ((prev: LogisticsAgent[]) => LogisticsAgent[])) => void;
  cities: DeliveryCity[];
  setCities: (cities: DeliveryCity[] | ((prev: DeliveryCity[]) => DeliveryCity[])) => void;
  setActiveView: (view: string) => void;
  setConfirmationOrderDetails: (details: any) => void;
  setShowOrderConfirmation: (show: boolean) => void;
  setPendingOrderForLogistics: (order: any) => void;
  setShowLogisticsSelection: (show: boolean) => void;
  setSelectedRequestForLogistics: (request: PurchaseRequest | null) => void;
  setShowLogisticsSelector: (show: boolean) => void;
}

// Suppliers data is now managed through the database
// const realSuppliers = [
  // Major Manufacturers
  {
    id: 'MFR001',
    name: 'Arvind Limited',
    type: 'manufacturer',
    location: 'Ahmedabad, Gujarat',
    rating: 4.8,
    totalProducts: 850,
    description: 'One of India\'s largest textile companies, specializing in denim, knits, woven fabrics, and garments. Leading manufacturer for global brands.',
    specialties: ['Denim Manufacturing', 'Cotton Textiles', 'Technical Textiles', 'Fabric Production'],
    joinedDate: '2018-01-15',
    verified: true,
    contactEmail: 'business@arvind.com',
    contactPhone: '+91 79 6620 3000'
  },
  {
    id: 'MFR002',
    name: 'Welspun India Ltd',
    type: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    rating: 4.7,
    totalProducts: 750,
    description: 'Global leader in home textiles, terry towels, bed sheets, rugs, and flooring solutions with manufacturing across India.',
    specialties: ['Home Textiles', 'Terry Towels', 'Bed Linen', 'Carpets & Rugs'],
    joinedDate: '2018-03-10',
    verified: true,
    contactEmail: 'info@welspun.com',
    contactPhone: '+91 22 6613 3000'
  },
  {
    id: 'MFR003',
    name: 'Vardhman Textiles',
    type: 'manufacturer',
    location: 'Ludhiana, Punjab',
    rating: 4.6,
    totalProducts: 680,
    description: 'Leading vertically integrated textile company manufacturing yarns, fabrics, and garments with focus on cotton and blended textiles.',
    specialties: ['Cotton Yarn', 'Blended Fabrics', 'Acrylic Yarn', 'Garment Manufacturing'],
    joinedDate: '2018-06-20',
    verified: true,
    contactEmail: 'corporate@vardhman.com',
    contactPhone: '+91 161 503 4000'
  },
  {
    id: 'MFR004',
    name: 'Trident Limited',
    type: 'manufacturer',
    location: 'Ludhiana, Punjab',
    rating: 4.5,
    totalProducts: 620,
    description: 'Major manufacturer of yarn, towels, bed linen, and wheat with integrated operations from farm to finished products.',
    specialties: ['Cotton Yarn', 'Terry Towels', 'Bed Sheets', 'Bath Linen'],
    joinedDate: '2019-02-15',
    verified: true,
    contactEmail: 'textile@tridentindia.com',
    contactPhone: '+91 161 506 1200'
  },
  {
    id: 'MFR005',
    name: 'Indo Count Industries',
    type: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    rating: 4.7,
    totalProducts: 580,
    description: 'Premium manufacturer of bed linen, bath linen, kitchen linen, and utility fabrics for global retail chains.',
    specialties: ['Bed Linen', 'Bath Towels', 'Kitchen Textiles', 'Luxury Fabrics'],
    joinedDate: '2019-05-08',
    verified: true,
    contactEmail: 'sales@indocount.com',
    contactPhone: '+91 22 6716 3800'
  },
  {
    id: 'MFR006',
    name: 'Bombay Dyeing',
    type: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    rating: 4.4,
    totalProducts: 520,
    description: 'Iconic Indian textile brand manufacturing bed linen, bath linen, fabrics, and ready-to-wear garments.',
    specialties: ['Bed Sheets', 'Bath Towels', 'Curtains', 'Fashion Fabrics'],
    joinedDate: '2019-08-12',
    verified: true,
    contactEmail: 'info@bombaydyeing.com',
    contactPhone: '+91 22 6665 8282'
  },
  {
    id: 'MFR007',
    name: 'Raymond Limited',
    type: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    rating: 4.8,
    totalProducts: 690,
    description: 'Premium textile and apparel manufacturer specializing in suiting, shirting, denim, and luxury fabrics.',
    specialties: ['Suiting Fabrics', 'Shirting', 'Denim', 'Luxury Textiles'],
    joinedDate: '2018-11-25',
    verified: true,
    contactEmail: 'corporate@raymond.in',
    contactPhone: '+91 22 6175 7000'
  },
  {
    id: 'MFR008',
    name: 'Grasim Industries',
    type: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    rating: 4.6,
    totalProducts: 780,
    description: 'Aditya Birla Group textile company manufacturing viscose staple fiber, fabrics, and garments with global presence.',
    specialties: ['Viscose Fiber', 'Fashion Fabrics', 'Technical Textiles', 'Linen'],
    joinedDate: '2019-01-18',
    verified: true,
    contactEmail: 'textiles@adityabirla.com',
    contactPhone: '+91 22 6652 5000'
  },

  // Regional Manufacturers
  {
    id: 'MFR009',
    name: 'KPR Mill Limited',
    type: 'manufacturer',
    location: 'Coimbatore, Tamil Nadu',
    rating: 4.5,
    totalProducts: 480,
    description: 'Integrated textile manufacturer specializing in cotton yarn, knitted garments, and fabric processing.',
    specialties: ['Cotton Yarn', 'Knit Garments', 'T-Shirts', 'Sportswear'],
    joinedDate: '2019-07-22',
    verified: true,
    contactEmail: 'export@kprmill.com',
    contactPhone: '+91 422 261 1000'
  },
  {
    id: 'MFR010',
    name: 'Loyal Textile Mills',
    type: 'manufacturer',
    location: 'Coimbatore, Tamil Nadu',
    rating: 4.3,
    totalProducts: 380,
    description: 'Spinning mill manufacturing high-quality cotton and synthetic yarn for knitting and weaving industries.',
    specialties: ['Cotton Yarn', 'Polyester Yarn', 'Blended Yarn', 'Compact Yarn'],
    joinedDate: '2020-03-14',
    verified: true,
    contactEmail: 'sales@loyaltextiles.com',
    contactPhone: '+91 422 258 9000'
  },
  {
    id: 'MFR011',
    name: 'Nahar Industrial Enterprises',
    type: 'manufacturer',
    location: 'Ludhiana, Punjab',
    rating: 4.4,
    totalProducts: 420,
    description: 'Manufacturer of cotton yarn, synthetic yarn, and technical textiles with advanced spinning technology.',
    specialties: ['Cotton Spinning', 'Synthetic Yarn', 'Combed Yarn', 'Melange Yarn'],
    joinedDate: '2020-06-30',
    verified: true,
    contactEmail: 'info@naharindustrial.com',
    contactPhone: '+91 161 271 8000'
  },
  {
    id: 'MFR012',
    name: 'Banswara Syntex',
    type: 'manufacturer',
    location: 'Banswara, Rajasthan',
    rating: 4.2,
    totalProducts: 350,
    description: 'Textile manufacturer specializing in synthetic yarn, fabrics, and home textiles with modern facilities.',
    specialties: ['Synthetic Yarn', 'Polyester Fabrics', 'Home Textiles', 'Technical Textiles'],
    joinedDate: '2020-09-15',
    verified: true,
    contactEmail: 'corporate@banswarasyntex.com',
    contactPhone: '+91 2962 252 500'
  },

  // Established Traders
  {
    id: 'TRD001',
    name: 'Mahavir Spinning Mills',
    type: 'trader',
    location: 'Delhi, Delhi',
    rating: 4.3,
    totalProducts: 650,
    description: 'Leading textile trading house dealing in all types of yarns, fabrics, and garments with pan-India network.',
    specialties: ['Yarn Trading', 'Fabric Distribution', 'Garment Supply', 'Bulk Orders'],
    joinedDate: '2019-04-12',
    verified: true,
    contactEmail: 'trade@mahavirspinning.com',
    contactPhone: '+91 11 4567 8900'
  },
  {
    id: 'TRD002',
    name: 'Gujarat Cooperative Cotton',
    type: 'trader',
    location: 'Ahmedabad, Gujarat',
    rating: 4.5,
    totalProducts: 720,
    description: 'Cooperative trading organization dealing in cotton, cotton yarn, and cotton textiles with farmer partnerships.',
    specialties: ['Cotton Trading', 'Cotton Yarn', 'Raw Cotton', 'Cooperative Supply'],
    joinedDate: '2019-09-28',
    verified: true,
    contactEmail: 'info@gujaratcotton.coop',
    contactPhone: '+91 79 2658 7000'
  },
  {
    id: 'TRD003',
    name: 'Textile Park Enterprises',
    type: 'trader',
    location: 'Surat, Gujarat',
    rating: 4.2,
    totalProducts: 580,
    description: 'Multi-product textile trading company specializing in synthetic fabrics, polyester yarn, and garment accessories.',
    specialties: ['Synthetic Fabrics', 'Polyester Products', 'Garment Accessories', 'Fashion Textiles'],
    joinedDate: '2020-01-20',
    verified: true,
    contactEmail: 'business@textilepark.com',
    contactPhone: '+91 261 234 5678'
  },
  {
    id: 'TRD004',
    name: 'Kolkata Jute Corporation',
    type: 'trader',
    location: 'Kolkata, West Bengal',
    rating: 4.0,
    totalProducts: 320,
    description: 'Specialized trading house for jute products, natural fiber textiles, and eco-friendly packaging materials.',
    specialties: ['Jute Products', 'Natural Fibers', 'Eco Textiles', 'Packaging Materials'],
    joinedDate: '2020-07-10',
    verified: true,
    contactEmail: 'trade@kolkatajute.com',
    contactPhone: '+91 33 2475 6000'
  },
  {
    id: 'TRD005',
    name: 'South India Textile Hub',
    type: 'trader',
    location: 'Chennai, Tamil Nadu',
    rating: 4.4,
    totalProducts: 490,
    description: 'Regional trading hub connecting South Indian manufacturers with buyers across India and export markets.',
    specialties: ['Cotton Textiles', 'Handloom Products', 'Export Quality', 'Regional Specialties'],
    joinedDate: '2020-11-05',
    verified: true,
    contactEmail: 'hub@southindiatextile.com',
    contactPhone: '+91 44 2834 5000'
  },
  {
    id: 'TRD006',
    name: 'Mumbai Fabric Mart',
    type: 'trader',
    location: 'Mumbai, Maharashtra',
    rating: 4.1,
    totalProducts: 760,
    description: 'Large-scale fabric trading company dealing in all types of fabrics, from basic cotton to luxury silk.',
    specialties: ['Fabric Trading', 'Luxury Textiles', 'Wholesale Supply', 'Fashion Fabrics'],
    joinedDate: '2021-02-18',
    verified: true,
    contactEmail: 'info@mumbaifabricmart.com',
    contactPhone: '+91 22 2417 8000'
  },

  // Emerging Players
  {
    id: 'MFR013',
    name: 'Green Textile Solutions',
    type: 'manufacturer',
    location: 'Bangalore, Karnataka',
    rating: 4.6,
    totalProducts: 280,
    description: 'Sustainable textile manufacturer focusing on organic cotton, bamboo fiber, and eco-friendly dyeing processes.',
    specialties: ['Organic Cotton', 'Bamboo Textiles', 'Eco-Friendly Dyeing', 'Sustainable Fashion'],
    joinedDate: '2021-05-12',
    verified: true,
    contactEmail: 'green@greentextile.com',
    contactPhone: '+91 80 4567 8900'
  },
  {
    id: 'MFR014',
    name: 'Tech Fab Industries',
    type: 'manufacturer',
    location: 'Pune, Maharashtra',
    rating: 4.5,
    totalProducts: 240,
    description: 'Modern textile manufacturer specializing in technical textiles, performance fabrics, and smart textiles.',
    specialties: ['Technical Textiles', 'Performance Fabrics', 'Smart Textiles', 'Functional Clothing'],
    joinedDate: '2021-08-25',
    verified: true,
    contactEmail: 'tech@techfab.in',
    contactPhone: '+91 20 2712 3000'
  },
  {
    id: 'TRD007',
    name: 'Digital Textile Connect',
    type: 'trader',
    location: 'Noida, Uttar Pradesh',
    rating: 4.3,
    totalProducts: 450,
    description: 'Digital-first textile trading platform connecting manufacturers with retailers through technology-enabled supply chain.',
    specialties: ['Digital Trading', 'Supply Chain Management', 'Quick Response', 'Tech Enabled'],
    joinedDate: '2021-12-08',
    verified: true,
    contactEmail: 'connect@digitaltextile.com',
    contactPhone: '+91 120 456 7890'
  }
]; */

export function useAppHandlers(props: AppHandlersProps) {
  const { user } = useAuth();
  const { addStock } = useStock();
  const {
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
    suppliers,

    itemSetOrders,
    setItemSetOrders,
    itemSetPurchaseRequests,
    setItemSetPurchaseRequests,
    logisticsAgents,
    setLogisticsAgents,
    cities,
    setCities,
    setActiveView,
    setConfirmationOrderDetails,
    setShowOrderConfirmation,
    setPendingOrderForLogistics,
    setShowLogisticsSelection,
    setSelectedRequestForLogistics,
    setShowLogisticsSelector
  } = props;

  const handleAddStock = useCallback(async (newStock: Omit<StockItem, 'id' | 'dateAdded'>) => {
    try {
      console.log('📦 Saving stock via StockProvider in AppMain');
      await addStock(newStock);
    } catch (error) {
      console.error('Error in handleAddStock:', error);
    }
    
    setActiveView('my-stock');
  }, [addStock, setActiveView]);

  const handleAddItemSet = useCallback((newItemSet: Omit<ItemSet, 'id' | 'dateAdded'>) => {
    const itemSet: ItemSet = {
      ...newItemSet,
      id: `SET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      dateAdded: new Date().toISOString()
    };
    setItemSets(prev => [itemSet, ...prev]);
    setActiveView('my-item-sets');
    toast.success('Item set created successfully!');
  }, [setItemSets, setActiveView]);

  const handlePlaceOrder = useCallback((orderData: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>) => {
    if (user?.role === 'retailer') {
      setPendingOrderForLogistics(orderData);
      setShowLogisticsSelection(true);
      return;
    }
    processOrderWithLogistics(orderData, undefined);
  }, [user?.role, setPendingOrderForLogistics, setShowLogisticsSelection]);

  const processOrderWithLogistics = useCallback((
    orderData: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>,
    logistics?: OrderLogistics
  ) => {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    const order: OrderRequest = {
      ...orderData,
      id: orderNumber,
      orderDate: new Date().toISOString(),
      status: 'pending',
      paymentStatus: 'pending',
      ...(logistics && {
        deliveryCity: logistics.deliveryCity,
        deliveryAddress: logistics.deliveryAddress,
        preferredLogisticsAgent: logistics.preferredAgentId,
        specialInstructions: logistics.specialInstructions
      })
    };
    setOrders(prev => [order, ...prev]);

    const purchaseRequest: PurchaseRequest = {
      id: `PR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      stockItemId: orderData.stockItemId,
      stockItemName: orderData.itemName,
      quantity: orderData.quantity,
      unitPrice: orderData.unitPrice,
      totalAmount: orderData.totalAmount,
      buyerCompany: orderData.buyerCompany,
      buyerGstNumber: user?.gstNumber || '',
      sellerCompany: orderData.supplierName,
      sellerGstNumber: suppliers?.find(s => s.name === orderData.supplierName)?.contactEmail || '',
      status: 'PR-Created',
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      statusHistory: [
        {
          status: 'PR-Created',
          updatedBy: user?.company || 'Unknown',
          updatedDate: new Date().toISOString(),
          remarks: `Initial purchase request created for ${orderData.quantity} units of ${orderData.itemName}. Total amount: ₹${orderData.totalAmount.toLocaleString()}. ${logistics ? `Delivery to: ${logistics.deliveryCity}` : ''}`
        }
      ],
      ...(logistics && {
        deliveryCity: logistics.deliveryCity,
        deliveryAddress: logistics.deliveryAddress,
        preferredLogisticsAgent: logistics.preferredAgentId,
        specialInstructions: logistics.specialInstructions
      })
    };

    setPurchaseRequests(prev => [purchaseRequest, ...prev]);
    
    setConfirmationOrderDetails({
      orderNumber: order.id,
      itemName: orderData.stockName || orderData.itemName || 'Unknown Item',
      quantity: orderData.quantity,
      buyerName: orderData.buyerCompany,
      unitPrice: orderData.pricePerUnit || orderData.unitPrice || 0,
      totalAmount: orderData.totalAmount,
      status: order.status
    });
    setShowOrderConfirmation(true);
    
    toast.success('Order placed successfully! Purchase request created.');
  }, [user, setOrders, setPurchaseRequests, setConfirmationOrderDetails, setShowOrderConfirmation]);

  const handleLogisticsConfirm = useCallback((logistics: OrderLogistics) => {
    const pendingOrder = props.pendingOrderForLogistics;
    if (pendingOrder) {
      processOrderWithLogistics(pendingOrder, logistics);
      setPendingOrderForLogistics(null);
    }
    setShowLogisticsSelection(false);
  }, [props.pendingOrderForLogistics, processOrderWithLogistics, setPendingOrderForLogistics, setShowLogisticsSelection]);



  const handleRemoveOffer = useCallback((stockId: string) => {
    setStocks(prev => prev.map(stock => 
      stock.id === stockId ? {
        ...stock,
        offerPrice: undefined,
        offerType: undefined,
        offerTimeWeeks: undefined,
        offerMinQuantity: undefined,
        offerValidUntil: undefined,
        offerCreatedDate: undefined
      } : stock
    ));
    toast.success('Special offer removed successfully!');
  }, [setStocks]);

  const handleUpdateTrending = useCallback((stockId: string, isTrending: boolean, trendingText?: string) => {
    setStocks(prev => prev.map(stock => 
      stock.id === stockId ? {
        ...stock,
        isTrending,
        trendingText: isTrending ? trendingText : undefined,
        trendingSetDate: isTrending ? new Date().toISOString() : undefined
      } : stock
    ));
  }, [setStocks]);

  const handleRatingSubmit = useCallback((ratingData: Omit<Rating, 'id' | 'createdDate'>) => {
    const newRating: Rating = {
      ...ratingData,
      id: `R-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdDate: new Date().toISOString()
    };

    setRatings(prev => {
      const filtered = prev.filter(r => 
        !(r.userId === ratingData.userId && r.targetId === ratingData.targetId && r.targetType === ratingData.targetType)
      );
      return [...filtered, newRating];
    });

    toast.success('Rating submitted successfully!');
  }, [setRatings]);

  return {
    handleAddStock,
    handleAddItemSet,
    handlePlaceOrder,
    processOrderWithLogistics,
    handleLogisticsConfirm,

    handleRemoveOffer,
    handleUpdateTrending,
    handleRatingSubmit
  };
}

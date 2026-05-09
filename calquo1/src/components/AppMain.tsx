import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Removed: PreferredSuppliersManager component no longer exists
import { HomePage } from './home/HomePage';
import { StockItem } from './stock/StockCard';
import { EnhancedStockItem } from './stock/EnhancedStockTypes';
import { EnhancedStockView } from './views/EnhancedStockView';
import { EnhancedBrowseStockPage } from './stock/EnhancedBrowseStockPage';
import { EditStockForm } from './stock/EditStockForm';
import { OrderRequest } from './context/OrderProvider';
import { useOrders } from './context/OrderProvider';
import { useStock } from './context/StockContext';
import { useCart } from './cart/CartProvider';
import { useNotifications, NotificationPanel } from './notifications/NotificationSystem';

import { toast } from 'sonner';
import { suppliersAPI } from '../utils/api';

// Component imports
import { Dashboard } from './dashboard/Dashboard';
import { AnalyticsDashboard } from './dashboard/AnalyticsDashboard';
import { SettingsPanel } from './layout/SettingsPanel';
import { ProfileEditor } from './profile/ProfileEditor';
import { StockView } from './views/StockView';
import { AddStockWizard } from './stock/AddStockWizard';
import { SuppliersDirectory } from './suppliers/SuppliersDirectory';
import { OrdersTable } from './orders/OrdersTable';
import { OrderConfirmationDialog } from './orders/OrderConfirmationDialog';
import { AdminOrdersManagement } from './orders/AdminOrdersManagement';
import { UnifiedOrderManagement } from './orders/UnifiedOrderManagement';
import { PurchaseRequestsTable, PurchaseRequest } from './purchase/PurchaseRequestsTable';
import { PurchasePage } from './purchase/PurchasePage';
import { FinancialAgentDashboard } from './dashboard/FinancialAgentDashboard';
import { MyOrdersView } from './orders/MyOrdersView';
import { FinancialApprovals } from './dashboard/FinancialApprovals';
import { FinancialClients } from './dashboard/FinancialClients';
import { FinancialPayments } from './dashboard/FinancialPayments';

// LogisticsDashboard import removed - component not found
import { AdminDashboard } from './dashboard/AdminDashboard';
import { LogisticsAgentDashboard } from './dashboard/LogisticsAgentDashboard';
import { RetailerDashboard } from './dashboard/RetailerDashboard';
import { ManufacturerDashboard } from './dashboard/ManufacturerDashboard';
import { TraderDashboard } from './dashboard/TraderDashboard';
import { LogisticsPartnerSelector } from './logistics/LogisticsPartnerSelector';
import { PaymentWithAgentOption } from './payments/PaymentWithAgentOption';
import { Header } from './layout/Header';
import { TopNavigation } from './layout/TopNavigation';
import { NavigationHint } from './layout/NavigationHint';
import { BackButton, BreadcrumbBackButton } from './layout/BackButton';
import { FloatingHomeButton } from './layout/FloatingHomeButton';
import { Button } from './ui/button';
import { Home } from 'lucide-react';

import { FloatingApparels } from './background/FloatingApparels';
import { PWAManager, PWAFeatures } from './pwa/PWAManager';
import { MobileHeader } from './layout/MobileHeader';
import { MobileBottomNavigation } from './layout/MobileBottomNavigation';
import { AnnouncementBanner } from './layout/AnnouncementBanner';
// Removed withTimeout import - using simpler data loading approach

// Item Set imports
import { ItemSet, SetOrderRequest, SetPurchaseRequest } from './stock/ItemSetTypes';
import { AddItemSetForm } from './stock/AddItemSetForm';
import { ItemSetView } from './views/ItemSetView';
import { TrendingItemsManager } from './admin/TrendingItemsManager';
import { CategoryManagerStandalone } from './admin/CategoryManagerStandalone';
import { CartView } from './cart/CartView';

// Rating imports
import { Rating } from './rating/RatingSystem';


// Enhanced component imports
import { SupplierDetailPage } from './suppliers/SupplierDetailPage';
import { ModernBuyerFocusedProductDetail } from './stock/ModernBuyerFocusedProductDetail';
import { OrdersWithRatings } from './orders/OrdersWithRatings';
import { EnhancedPurchaseReturn } from './returns/EnhancedPurchaseReturn';
import { VirtualTryOn } from './vton/VirtualTryOn';


// Logistics imports
import { LogisticsAgent, DeliveryCity, OrderLogistics } from './logistics/LogisticsTypes';
import { LogisticsSelectionDialog } from './orders/LogisticsSelectionDialog';

// Purchase Return imports
import { PurchaseReturn } from './returns/PurchaseReturn';

import { NewPickupsPage } from './logistics/NewPickupsPage';
import { TodaysPickupsPage } from './logistics/TodaysPickupsPage';
import { InTransitPage } from './logistics/InTransitPage';

// Enhanced Demo Stock Data - More realistic B2B apparel inventory
const mockStocks: StockItem[] = [
  {
    id: '1',
    name: 'Export Quality Cotton T-Shirt',
    category: 'T-Shirts',
    size: 'M',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Unisex',
      sizeType: 'alphabet',
      size: 'M',
      displayName: 'Adult - Unisex - Alpha - M'
    },
    color: 'Navy Blue',
    quantity: 500,
    price: 195,
    singleShopPrice: 225,
    multiShopPrice: 180,
    supplier: 'Tirupur Cotton Mills',
    supplierType: 'manufacturer',
    location: 'Tirupur, Tamil Nadu',
    dateAdded: '2024-12-15',
    minOrderQuantity: 50,
    description: 'Premium export quality cotton t-shirts with bio-wash finish. Pre-shrunk fabric.',
    fabricType: 'Cotton',
    fabricDescription: '100% combed cotton, 180 GSM, bio-washed for softness and durability.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
    ],
    offerPrice: 165,
    offerType: 'quantity',
    offerMinQuantity: 100,
    offerCreatedDate: new Date().toISOString(),
    isTrending: true,
    trendingText: 'Export Quality Bestseller',
    trendingSetDate: new Date().toISOString(),
    deliveryTime: '10-20 days'
  },
  {
    id: '2',
    name: 'Corporate Formal Shirt',
    category: 'Shirts',
    size: 'L',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Male',
      sizeType: 'alphabet',
      size: 'L',
      displayName: 'Adult - Male - Alpha - L'
    },
    color: 'Sky Blue',
    quantity: 750,
    price: 385,
    singleShopPrice: 420,
    multiShopPrice: 350,
    supplier: 'Elite Shirts Bangalore',
    supplierType: 'manufacturer',
    location: 'Bangalore, Karnataka',
    dateAdded: '2024-12-10',
    minOrderQuantity: 25,
    description: 'Premium corporate formal shirts with non-iron finish. Perfect for bulk office orders.',
    fabricType: 'Cotton-Polyester',
    fabricDescription: '65% cotton, 35% polyester with wrinkle-free treatment and easy care.',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaGlydCUyMGFwcGFyZWwlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODc3MTc0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    deliveryTime: '5-10 days'
  },
  {
    id: '3',
    name: 'Premium Denim Jeans',
    category: 'Jeans',
    size: '32',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Unisex',
      sizeType: 'numerical',
      size: '32',
      displayName: 'Adult - Unisex - Numeric - 32'
    },
    color: 'Indigo Blue',
    quantity: 300,
    price: 895,
    singleShopPrice: 995,
    multiShopPrice: 795,
    supplier: 'Gujarat Denim Hub',
    supplierType: 'manufacturer',
    location: 'Ahmedabad, Gujarat',
    dateAdded: '2024-12-08',
    minOrderQuantity: 20,
    description: 'High-quality denim jeans with superior fit and finish. Multiple washes available.',
    fabricType: 'Denim',
    fabricDescription: '99% cotton, 1% elastane, 14oz denim with stone wash and sand blast finish.',
    images: [
      'https://images.unsplash.com/photo-1685875018148-6ac6d41b7c4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbiUyMGFwcGFyZWx8ZW58MXx8fHwxNzU4NzcxNzQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    isTrending: true,
    trendingText: 'Trending Denim Collection',
    trendingSetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryTime: '10-20 days'
  },
  {
    id: '4',
    name: 'Designer Kurti Collection',
    category: 'Dresses',
    size: 'M',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Female',
      sizeType: 'alphabet',
      size: 'M',
      displayName: 'Adult - Female - Alpha - M'
    },
    color: 'Multi Color Print',
    quantity: 200,
    price: 695,
    singleShopPrice: 750,
    multiShopPrice: 625,
    supplier: 'Jaipur Ethnic Wear',
    supplierType: 'manufacturer',
    location: 'Jaipur, Rajasthan',
    dateAdded: '2024-12-05',
    minOrderQuantity: 15,
    description: 'Traditional designer kurtis with contemporary prints. Suitable for casual and office wear.',
    fabricType: 'Rayon',
    fabricDescription: '100% rayon with digital print and machine wash safe.',
    images: [
      'https://images.unsplash.com/photo-1711516141938-cc5917435dcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3b21lbiUyMGRyZXNzJTIwZmFzaGlvbiUyMGFwcGFyZWx8ZW58MXx8fHwxNzU4NzcxNzQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    deliveryTime: '10-20 days'
  },
  {
    id: '5',
    name: 'Winter Blazer Collection',
    category: 'Jackets',
    size: 'L',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Male',
      sizeType: 'alphabet',
      size: 'L',
      displayName: 'Adult - Male - Alpha - L'
    },
    color: 'Charcoal Grey',
    quantity: 120,
    price: 1595,
    singleShopPrice: 1750,
    multiShopPrice: 1450,
    supplier: 'Mumbai Formal Wear',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: '2024-12-01',
    minOrderQuantity: 10,
    description: 'Premium winter blazers for corporate and formal occasions. Tailored fit guaranteed.',
    fabricType: 'Wool Blend',
    fabricDescription: '70% wool, 30% polyester with satin lining and shoulder padding.',
    images: [
      'https://images.unsplash.com/photo-1613432539593-bb769c287e08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN3aW50ZXIlMjBqYWNrZXQlMjBhcHBhcmVsJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTg3NzE3NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    isTrending: true,
    trendingText: 'Winter Collection 2024',
    trendingSetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryTime: '10-20 days'
  },
  {
    id: '6',
    name: 'Casual Chino Trousers',
    category: 'Pants',
    size: '32',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Male',
      sizeType: 'numerical',
      size: '32',
      displayName: 'Adult - Male - Numeric - 32'
    },
    color: 'Khaki',
    quantity: 400,
    price: 595,
    singleShopPrice: 650,
    multiShopPrice: 525,
    supplier: 'Chennai Garments Co.',
    supplierType: 'manufacturer',
    location: 'Chennai, Tamil Nadu',
    dateAdded: '2024-11-28',
    minOrderQuantity: 30,
    description: 'Comfortable casual chino trousers. Perfect for smart-casual workplace dress codes.',
    fabricType: 'Cotton Twill',
    fabricDescription: '100% cotton twill with pre-shrunk treatment and fade resistant colors.',
    images: [
      'https://images.unsplash.com/photo-1601278085511-992ec3000c8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN8YXN1YWwlMjBwYW50cyUyMHRyb3VzZXJzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTg3NzE3NTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    deliveryTime: '5-10 days'
  },
  {
    id: '7',
    name: 'Premium Polo Shirts',
    category: 'T-Shirts',
    size: 'L',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Male',
      sizeType: 'alphabet',
      size: 'L',
      displayName: 'Adult - Male - Alpha - L'
    },
    color: 'White',
    quantity: 600,
    price: 345,
    singleShopPrice: 395,
    multiShopPrice: 310,
    supplier: 'Pune Knits Limited',
    supplierType: 'manufacturer',
    location: 'Pune, Maharashtra',
    dateAdded: '2024-11-25',
    minOrderQuantity: 40,
    description: 'Premium quality polo shirts with moisture-wicking properties. Ideal for hospitality sector.',
    fabricType: 'Cotton Pique',
    fabricDescription: '100% cotton pique knit with anti-bacterial treatment and color fastness.',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaGlydCUyMGFwcGFyZWwlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODc3MTc0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    offerPrice: 285,
    offerType: 'quantity',
    offerMinQuantity: 100,
    offerCreatedDate: new Date().toISOString(),
    deliveryTime: '5-10 days'
  },
  {
    id: '8',
    name: 'Sports Track Suits',
    category: 'Activewear',
    size: 'L',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Unisex',
      sizeType: 'alphabet',
      size: 'L',
      displayName: 'Adult - Unisex - Alpha - L'
    },
    color: 'Navy Blue & White',
    quantity: 250,
    price: 795,
    singleShopPrice: 895,
    multiShopPrice: 695,
    supplier: 'Ludhiana Sports Wear',
    supplierType: 'manufacturer',
    location: 'Ludhiana, Punjab',
    dateAdded: '2024-11-20',
    minOrderQuantity: 25,
    description: 'High-quality track suits for schools, colleges, and sports teams. Bulk orders welcomed.',
    fabricType: 'Polyester',
    fabricDescription: '100% polyester with moisture-wicking technology and reinforced stitching.',
    images: [
      'https://images.unsplash.com/photo-1645207803533-e2cfe1382f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN8YWN0aXZld2VhciUyMHNwb3J0cyUyMGNsb3RoaW5nfGVufDF8fHx8MTc1ODc3MTc2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    deliveryTime: '10-20 days'
  },
  {
    id: '9',
    name: 'Summer Cotton Shorts',
    category: 'Shorts',
    size: 'M',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Male',
      sizeType: 'alphabet',
      size: 'M',
      displayName: 'Adult - Male - Alpha - M'
    },
    color: 'Assorted Colors',
    quantity: 800,
    price: 295,
    singleShopPrice: 325,
    multiShopPrice: 265,
    supplier: 'Coimbatore Cotton Mills',
    supplierType: 'manufacturer',
    location: 'Coimbatore, Tamil Nadu',
    dateAdded: '2024-11-15',
    minOrderQuantity: 60,
    description: 'Lightweight cotton shorts perfect for summer season. Available in multiple colors.',
    fabricType: 'Cotton',
    fabricDescription: '100% combed cotton with enzyme wash for extra softness.',
    images: [
      'https://images.unsplash.com/photo-1616358278213-cd479e47c222?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHxa&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    offerPrice: 245,
    offerType: 'time',
    offerTimeWeeks: 2,
    offerValidUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    offerCreatedDate: new Date().toISOString(),
    deliveryTime: '5-10 days'
  },
  {
    id: '10',
    name: 'Corporate Sarees',
    category: 'Dresses',
    size: 'Free Size',
    sizeDetails: {
      ageCategory: 'Adult',
      genderCategory: 'Female',
      sizeType: 'alphabet',
      size: 'Free Size',
      displayName: 'Adult - Female - Free Size'
    },
    color: 'Elegant Prints',
    quantity: 150,
    price: 1295,
    singleShopPrice: 1450,
    multiShopPrice: 1150,
    supplier: 'Surat Textile House',
    supplierType: 'manufacturer',
    location: 'Surat, Gujarat',
    dateAdded: '2024-11-10',
    minOrderQuantity: 12,
    description: 'Premium corporate sarees suitable for office wear and formal occasions.',
    fabricType: 'Crepe Silk',
    fabricDescription: 'High-quality crepe silk with digital prints and matching blouse piece.',
    images: [
      'https://images.unsplash.com/photo-1711516141938-cc5917435dcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3b21lbiUyMGRyZXNzJTIwZmFzaGlvbiUyMGFwcGFyZWx8ZW58MXx8fCwxNzU4NzcxNzQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    isTrending: true,
    trendingText: 'Professional Collection',
    trendingSetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryTime: '10-20 days'
  }
];

// Comprehensive Enhanced Stock Data - Testing all Browse Stock features
const mockEnhancedStocks: EnhancedStockItem[] = [
  // 1. SET OF SIZES Example - Premium Cotton T-Shirt Collection
  {
    id: 'enhanced-stock-1',
    name: 'Premium Cotton T-Shirt Collection',
    category: 'T-Shirts',
    description: 'High-quality cotton t-shirts with excellent durability and comfort. Made from 100% organic cotton.',
    supplier: 'FashionCorp Manufacturing',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),

    // Add mainImages for compatibility with StockCardWithGallery
    mainImages: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
      'https://images.unsplash.com/photo-1583743814966-8936f37f824d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXZ5JTIwYmx1ZSUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
    ],

    itemSetType: 'single_color',
    colors: [
      {
        id: 'color-1',
        name: 'Classic Black',
        colorCode: '#000000',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
          'https://images.unsplash.com/photo-1583743814966-8936f37f824d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXZ5JTIwYmx1ZSUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-1', name: 'S', displayName: 'Small (36")' },
      { id: 'size-2', name: 'M', displayName: 'Medium (38")' },
      { id: 'size-3', name: 'L', displayName: 'Large (40")' },
      { id: 'size-4', name: 'XL', displayName: 'Extra Large (42")' },
      { id: 'size-5', name: 'XXL', displayName: 'Double XL (44")' }
    ],
    combinations: [
      { id: 'combo-1', colorId: 'color-1', sizeId: 'size-1', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'combo-2', colorId: 'color-1', sizeId: 'size-2', quantity: 75, availableQuantity: 75, images: [] },
      { id: 'combo-3', colorId: 'color-1', sizeId: 'size-3', quantity: 100, availableQuantity: 100, images: [] },
      { id: 'combo-4', colorId: 'color-1', sizeId: 'size-4', quantity: 60, availableQuantity: 60, images: [] },
      { id: 'combo-5', colorId: 'color-1', sizeId: 'size-5', quantity: 25, availableQuantity: 25, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 299,
    singleShopPrice: 349,
    multiShopPrice: 279,
    minOrderQuantity: 10,

    fabricType: 'Cotton',
    fabricDescription: '100% premium organic cotton, pre-shrunk, soft and breathable fabric with anti-microbial treatment',
    deliveryTime: '5-10 days'
  },

  // 2. SET OF PATTERN Example - Designer Saree Collection
  {
    id: 'enhanced-stock-2',
    name: 'Designer Saree Collection',
    category: 'Traditional',
    description: 'Elegant designer sarees with intricate patterns and premium fabrics. Perfect for special occasions.',
    supplier: 'Mumbai Ethnic Wear',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'set_of_pattern',
    colors: [
      {
        id: 'pattern-1',
        name: 'Golden Floral',
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXJlZSUyMGluZGlhbiUyMGZsb3JhbHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
          'https://images.unsplash.com/photo-1583391733956-6c78276477e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc2FyZWUlMjBlbWJyb2lkZXJ5fGVufDF8fHx8MTc1NzEzNzQ0M3ww&ixlib=rb-4.1.0&q=80&w=400'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'pattern-2',
        name: 'Royal Blue Embroidery',
        images: [
          'https://images.unsplash.com/photo-1583391733956-6c78276477e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc2FyZWUlMjBlbWJyb2lkZXJ5fGVufDF8fHx8MTc1NzEzNzQ0M3ww&ixlib=rb-4.1.0&q=80&w=400',
          'https://images.unsplash.com/photo-1717049887308-75488551cb33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0aSUyMGV0aG5pY3xlbnwxfHx8fDE3NTg3OTk3OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'pattern-3',
        name: 'Red Paisley',
        images: [
          'https://images.unsplash.com/photo-1717049887308-75488551cb33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0aSUyMGV0aG5pY3xlbnwxfHx8fDE3NTg3OTk3OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'saree-1', name: 'Standard', displayName: 'Standard (5.5m + 0.8m blouse)' }
    ],
    combinations: [
      { id: 'saree-combo-1', colorId: 'pattern-1', sizeId: 'saree-1', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'saree-combo-2', colorId: 'pattern-2', sizeId: 'saree-1', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'saree-combo-3', colorId: 'pattern-3', sizeId: 'saree-1', quantity: 10, availableQuantity: 10, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 2499,
    singleShopPrice: 2799,
    multiShopPrice: 2299,
    minOrderQuantity: 3,

    fabricType: 'Silk',
    fabricDescription: 'Pure silk with zari work and traditional embroidery. Dry clean only.',
    deliveryTime: '10-20 days'
  },

  // 3. INDIVIDUAL FLEX Example - Formal Shirt Collection
  {
    id: 'enhanced-stock-3',
    name: 'Executive Formal Shirt Collection',
    category: 'Shirts',
    description: 'Premium formal shirts for corporate professionals. Available in multiple colors and sizes with flexible ordering.',
    supplier: 'Elite Formal Wear',
    supplierType: 'manufacturer',
    location: 'Delhi, Delhi',
    dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'individual_flex',
    colors: [
      {
        id: 'shirt-color-1',
        name: 'Crisp White',
        colorCode: '#FFFFFF',
        images: [
          'https://images.unsplash.com/photo-1758518729058-b158e71c5a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaGlydCUyMGJ1c2luZXNzJTIwbWVufGVufDF8fHx8MTc1ODc5OTc3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'shirt-color-2',
        name: 'Sky Blue',
        colorCode: '#87CEEB',
        images: [
          'https://images.unsplash.com/photo-1758518729058-b158e71c5a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaGlydCUyMGJ1c2luZXNzJTIwbWVufGVufDF8fHx8MTc1ODc5OTc3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'shirt-color-3',
        name: 'Light Pink',
        colorCode: '#FFB6C1',
        images: [
          'https://images.unsplash.com/photo-1758518729058-b158e71c5a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaGlydCUyMGJ1c2luZXNzJTIwbWVufGVufDF8fHx8MTc1ODc5OTc3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'shirt-size-1', name: '38', displayName: '38 (S)' },
      { id: 'shirt-size-2', name: '40', displayName: '40 (M)' },
      { id: 'shirt-size-3', name: '42', displayName: '42 (L)' },
      { id: 'shirt-size-4', name: '44', displayName: '44 (XL)' },
      { id: 'shirt-size-5', name: '46', displayName: '46 (XXL)' }
    ],
    combinations: [
      // White combinations
      { id: 'shirt-combo-1', colorId: 'shirt-color-1', sizeId: 'shirt-size-1', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'shirt-combo-2', colorId: 'shirt-color-1', sizeId: 'shirt-size-2', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'shirt-combo-3', colorId: 'shirt-color-1', sizeId: 'shirt-size-3', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'shirt-combo-4', colorId: 'shirt-color-1', sizeId: 'shirt-size-4', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'shirt-combo-5', colorId: 'shirt-color-1', sizeId: 'shirt-size-5', quantity: 15, availableQuantity: 15, images: [] },
      // Blue combinations
      { id: 'shirt-combo-6', colorId: 'shirt-color-2', sizeId: 'shirt-size-1', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'shirt-combo-7', colorId: 'shirt-color-2', sizeId: 'shirt-size-2', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'shirt-combo-8', colorId: 'shirt-color-2', sizeId: 'shirt-size-3', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'shirt-combo-9', colorId: 'shirt-color-2', sizeId: 'shirt-size-4', quantity: 20, availableQuantity: 20, images: [] },
      // Pink combinations
      { id: 'shirt-combo-10', colorId: 'shirt-color-3', sizeId: 'shirt-size-2', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'shirt-combo-11', colorId: 'shirt-color-3', sizeId: 'shirt-size-3', quantity: 22, availableQuantity: 22, images: [] },
      { id: 'shirt-combo-12', colorId: 'shirt-color-3', sizeId: 'shirt-size-4', quantity: 12, availableQuantity: 12, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 899,
    singleShopPrice: 999,
    multiShopPrice: 849,
    minOrderQuantity: 5,

    fabricType: 'Cotton Blend',
    fabricDescription: '60% cotton, 40% polyester blend for wrinkle resistance and comfort',
    deliveryTime: '5-10 days',

    // Special offer - Time based
    offerPrice: 749,
    offerType: 'time',
    offerTimeWeeks: 2,
    offerValidUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    offerCreatedDate: new Date().toISOString()
  },

  // 4. DENIM JEANS - Set of Sizes with Offer
  {
    id: 'enhanced-stock-4',
    name: 'Slim Fit Denim Jeans',
    category: 'Jeans',
    description: 'Premium quality slim fit denim jeans with stretch fabric for comfort and style.',
    supplier: 'Bangalore Denim Works',
    supplierType: 'manufacturer',
    location: 'Bangalore, Karnataka',
    dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'single_color',
    colors: [
      {
        id: 'denim-color-1',
        name: 'Dark Blue',
        colorCode: '#1E3A8A',
        images: [
          'https://images.unsplash.com/photo-1715865871494-6bba579c2dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTg2ODE0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXZ5JTIwYmx1ZSUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
          'https://images.unsplash.com/photo-1583743814966-8936f37f824d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'jeans-size-1', name: '28', displayName: '28" Waist' },
      { id: 'jeans-size-2', name: '30', displayName: '30" Waist' },
      { id: 'jeans-size-3', name: '32', displayName: '32" Waist' },
      { id: 'jeans-size-4', name: '34', displayName: '34" Waist' },
      { id: 'jeans-size-5', name: '36', displayName: '36" Waist' },
      { id: 'jeans-size-6', name: '38', displayName: '38" Waist' }
    ],
    combinations: [
      { id: 'jeans-combo-1', colorId: 'denim-color-1', sizeId: 'jeans-size-1', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'jeans-combo-2', colorId: 'denim-color-1', sizeId: 'jeans-size-2', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'jeans-combo-3', colorId: 'denim-color-1', sizeId: 'jeans-size-3', quantity: 60, availableQuantity: 60, images: [] },
      { id: 'jeans-combo-4', colorId: 'denim-color-1', sizeId: 'jeans-size-4', quantity: 45, availableQuantity: 45, images: [] },
      { id: 'jeans-combo-5', colorId: 'denim-color-1', sizeId: 'jeans-size-5', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'jeans-combo-6', colorId: 'denim-color-1', sizeId: 'jeans-size-6', quantity: 20, availableQuantity: 20, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 1299,
    singleShopPrice: 1499,
    multiShopPrice: 1199,
    minOrderQuantity: 8,

    fabricType: 'Denim',
    fabricDescription: '98% cotton, 2% elastane stretch denim with stone wash finish',
    deliveryTime: '5-10 days',

    // Quantity-based offer
    offerPrice: 1099,
    offerType: 'quantity',
    offerMinQuantity: 20,
    offerCreatedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },

  // 5. WOMEN'S DRESS - Set of Pattern
  {
    id: 'enhanced-stock-5',
    name: 'Elegant Party Dress Collection',
    category: 'Dresses',
    description: 'Stylish party dresses perfect for evening events and celebrations. Multiple patterns available.',
    supplier: 'Chennai Fashion House',
    supplierType: 'manufacturer',
    location: 'Chennai, Tamil Nadu',
    dateAdded: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'set_of_pattern',
    colors: [
      {
        id: 'dress-pattern-1',
        name: 'Floral Print',
        images: [
          'https://images.unsplash.com/photo-1700158777421-2fd9263cec53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTg3NjQ4NDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1637227314917-3c0f595c3596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2lydCUyMGZhc2hpb24lMjB3b21lbnxlbnwxfHx8fDE3NTg3OTk4MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'dress-pattern-2',
        name: 'Solid Black',
        images: [
          'https://images.unsplash.com/photo-1700158777421-2fd9263cec53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTg3NjQ4NDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'dress-pattern-3',
        name: 'Striped Navy',
        images: [
          'https://images.unsplash.com/photo-1637227314917-3c0f595c3596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2lydCUyMGZhc2hpb24lMjB3b21lbnxlbnwxfHx8fDE3NTg3OTk4MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'dress-size-1', name: 'XS', displayName: 'Extra Small' },
      { id: 'dress-size-2', name: 'S', displayName: 'Small' },
      { id: 'dress-size-3', name: 'M', displayName: 'Medium' },
      { id: 'dress-size-4', name: 'L', displayName: 'Large' },
      { id: 'dress-size-5', name: 'XL', displayName: 'Extra Large' }
    ],
    combinations: [
      { id: 'dress-combo-1', colorId: 'dress-pattern-1', sizeId: 'dress-size-1', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'dress-combo-2', colorId: 'dress-pattern-1', sizeId: 'dress-size-2', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'dress-combo-3', colorId: 'dress-pattern-1', sizeId: 'dress-size-3', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'dress-combo-4', colorId: 'dress-pattern-1', sizeId: 'dress-size-4', quantity: 10, availableQuantity: 10, images: [] },
      { id: 'dress-combo-5', colorId: 'dress-pattern-2', sizeId: 'dress-size-2', quantity: 10, availableQuantity: 10, images: [] },
      { id: 'dress-combo-6', colorId: 'dress-pattern-2', sizeId: 'dress-size-3', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'dress-combo-7', colorId: 'dress-pattern-2', sizeId: 'dress-size-4', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'dress-combo-8', colorId: 'dress-pattern-3', sizeId: 'dress-size-1', quantity: 6, availableQuantity: 6, images: [] },
      { id: 'dress-combo-9', colorId: 'dress-pattern-3', sizeId: 'dress-size-2', quantity: 9, availableQuantity: 9, images: [] },
      { id: 'dress-combo-10', colorId: 'dress-pattern-3', sizeId: 'dress-size-3', quantity: 11, availableQuantity: 11, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 1899,
    singleShopPrice: 2199,
    multiShopPrice: 1699,
    minOrderQuantity: 6,

    fabricType: 'Georgette',
    fabricDescription: 'Lightweight georgette fabric with comfortable lining, machine washable',
    deliveryTime: '10-20 days'
  },

  // 6. BLAZER - Individual Flex with High Price
  {
    id: 'enhanced-stock-6',
    name: 'Premium Business Blazer',
    category: 'Jackets',
    description: 'Sophisticated business blazers made from premium wool blend. Perfect for corporate meetings and formal events.',
    supplier: 'Elite Formal Wear',
    supplierType: 'manufacturer',
    location: 'Delhi, Delhi',
    dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'individual_flex',
    colors: [
      {
        id: 'blazer-color-1',
        name: 'Charcoal Grey',
        colorCode: '#36454F',
        images: [
          'https://images.unsplash.com/photo-1637641185564-9edb317d6f65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYWNrZXQlMjBibGF6ZXIlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODc5MjAwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1758518729058-b158e71c5a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBzaGlydCUyMGJ1c2luZXNzJTIwbWVufGVufDF8fHx8MTc1ODc5OTc3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'blazer-color-2',
        name: 'Navy Blue',
        colorCode: '#1E3A8A',
        images: [
          'https://images.unsplash.com/photo-1637641185564-9edb317d6f65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYWNrZXQlMjBibGF6ZXIlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODc5MjAwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'blazer-size-1', name: '38', displayName: '38" Chest' },
      { id: 'blazer-size-2', name: '40', displayName: '40" Chest' },
      { id: 'blazer-size-3', name: '42', displayName: '42" Chest' },
      { id: 'blazer-size-4', name: '44', displayName: '44" Chest' },
      { id: 'blazer-size-5', name: '46', displayName: '46" Chest' }
    ],
    combinations: [
      { id: 'blazer-combo-1', colorId: 'blazer-color-1', sizeId: 'blazer-size-1', quantity: 5, availableQuantity: 5, images: [] },
      { id: 'blazer-combo-2', colorId: 'blazer-color-1', sizeId: 'blazer-size-2', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'blazer-combo-3', colorId: 'blazer-color-1', sizeId: 'blazer-size-3', quantity: 10, availableQuantity: 10, images: [] },
      { id: 'blazer-combo-4', colorId: 'blazer-color-1', sizeId: 'blazer-size-4', quantity: 6, availableQuantity: 6, images: [] },
      { id: 'blazer-combo-5', colorId: 'blazer-color-2', sizeId: 'blazer-size-2', quantity: 6, availableQuantity: 6, images: [] },
      { id: 'blazer-combo-6', colorId: 'blazer-color-2', sizeId: 'blazer-size-3', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'blazer-combo-7', colorId: 'blazer-color-2', sizeId: 'blazer-size-4', quantity: 5, availableQuantity: 5, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 4999,
    singleShopPrice: 5499,
    multiShopPrice: 4699,
    minOrderQuantity: 3,

    fabricType: 'Wool Blend',
    fabricDescription: '70% wool, 30% polyester blend with satin lining. Dry clean recommended.',
    deliveryTime: '10-20 days',
    tradersOnly: true
  },

  // 7. ACTIVEWEAR - Set of Sizes with Offer
  {
    id: 'enhanced-stock-7',
    name: 'Performance Activewear Set',
    category: 'Activewear',
    description: 'High-performance sportswear designed for fitness enthusiasts. Moisture-wicking and breathable fabric.',
    supplier: 'Pune Sports Apparel',
    supplierType: 'manufacturer',
    location: 'Pune, Maharashtra',
    dateAdded: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'single_color',
    colors: [
      {
        id: 'active-color-1',
        name: 'Athletic Grey',
        colorCode: '#808080',
        images: [
          'https://images.unsplash.com/photo-1645207803533-e2cfe1382f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY3RpdmV3ZWFyJTIwc3BvcnRzd2VhcnxlbnwxfHx8fDE3NTg3OTk3ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHRzaGlydHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400',
          'https://images.unsplash.com/photo-1543789981-8b6d93d814a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2VhdGVyJTIwa25pdHdlYXIlMjB3aW50ZXJ8ZW58MXx8fHwxNzU4Nzk5Nzk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'active-size-1', name: 'XS', displayName: 'Extra Small' },
      { id: 'active-size-2', name: 'S', displayName: 'Small' },
      { id: 'active-size-3', name: 'M', displayName: 'Medium' },
      { id: 'active-size-4', name: 'L', displayName: 'Large' },
      { id: 'active-size-5', name: 'XL', displayName: 'Extra Large' }
    ],
    combinations: [
      { id: 'active-combo-1', colorId: 'active-color-1', sizeId: 'active-size-1', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'active-combo-2', colorId: 'active-color-1', sizeId: 'active-size-2', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'active-combo-3', colorId: 'active-color-1', sizeId: 'active-size-3', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'active-combo-4', colorId: 'active-color-1', sizeId: 'active-size-4', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'active-combo-5', colorId: 'active-color-1', sizeId: 'active-size-5', quantity: 20, availableQuantity: 20, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 799,
    singleShopPrice: 899,
    multiShopPrice: 749,
    minOrderQuantity: 12,

    fabricType: 'Polyester Blend',
    fabricDescription: 'Moisture-wicking polyester blend with anti-bacterial treatment. Machine washable.',
    deliveryTime: '5-10 days',

    // Time-based offer
    offerPrice: 649,
    offerType: 'time',
    offerTimeWeeks: 1,
    offerValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    offerCreatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },

  // 8. WINTER SWEATER - Set of Pattern
  {
    id: 'enhanced-stock-8',
    name: 'Cozy Winter Sweater Collection',
    category: 'Sweaters',
    description: 'Warm and comfortable winter sweaters with various knit patterns. Perfect for the cold season.',
    supplier: 'Kolkata Knitwear',
    supplierType: 'manufacturer',
    location: 'Kolkata, West Bengal',
    dateAdded: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'set_of_pattern',
    colors: [
      {
        id: 'sweater-pattern-1',
        name: 'Cable Knit Grey',
        images: [
          'https://images.unsplash.com/photo-1543789981-8b6d93d814a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2VhdGVyJTIwa25pdHdlYXIlMjB3aW50ZXJ8ZW58MXx8fHwxNzU4Nzk5Nzk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1637641185564-9edb317d6f65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYWNrZXQlMjBibGF6ZXIlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODc5MjAwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'sweater-pattern-2',
        name: 'Rib Knit Navy',
        images: [
          'https://images.unsplash.com/photo-1543789981-8b6d93d814a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2VhdGVyJTIwa25pdHdlYXIlMjB3aW50ZXJ8ZW58MXx8fHwxNzU4Nzk5Nzk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'sweater-size-1', name: 'S', displayName: 'Small' },
      { id: 'sweater-size-2', name: 'M', displayName: 'Medium' },
      { id: 'sweater-size-3', name: 'L', displayName: 'Large' },
      { id: 'sweater-size-4', name: 'XL', displayName: 'Extra Large' }
    ],
    combinations: [
      { id: 'sweater-combo-1', colorId: 'sweater-pattern-1', sizeId: 'sweater-size-1', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'sweater-combo-2', colorId: 'sweater-pattern-1', sizeId: 'sweater-size-2', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'sweater-combo-3', colorId: 'sweater-pattern-1', sizeId: 'sweater-size-3', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'sweater-combo-4', colorId: 'sweater-pattern-1', sizeId: 'sweater-size-4', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'sweater-combo-5', colorId: 'sweater-pattern-2', sizeId: 'sweater-size-1', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'sweater-combo-6', colorId: 'sweater-pattern-2', sizeId: 'sweater-size-2', quantity: 16, availableQuantity: 16, images: [] },
      { id: 'sweater-combo-7', colorId: 'sweater-pattern-2', sizeId: 'sweater-size-3', quantity: 14, availableQuantity: 14, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 1599,
    singleShopPrice: 1799,
    multiShopPrice: 1449,
    minOrderQuantity: 5,

    fabricType: 'Wool',
    fabricDescription: '100% pure wool with soft lining, hand wash recommended',
    deliveryTime: '10-20 days'
  },

  // 9. CASUAL SHORTS - Individual Flex
  {
    id: 'enhanced-stock-9',
    name: 'Summer Casual Shorts',
    category: 'Shorts',
    description: 'Comfortable casual shorts perfect for summer days. Lightweight and breathable fabric.',
    supplier: 'Hyderabad Casual Wear',
    supplierType: 'trader',
    location: 'Hyderabad, Telangana',
    dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'individual_flex',
    colors: [
      {
        id: 'shorts-color-1',
        name: 'Khaki',
        colorCode: '#C3B091',
        images: [
          'https://images.unsplash.com/photo-1745142640164-74774600af1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG9ydHMlMjBjYXN1YWwlMjBzdW1tZXJ8ZW58MXx8fHwxNzU4Nzk5ODA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1758534063951-1c78600f8129?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBwYW50cyUyMHRyb3VzZXJzfGVufDF8fHx8MTc1ODc5OTgxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'shorts-color-2',
        name: 'Navy Blue',
        colorCode: '#1E3A8A',
        images: [
          'https://images.unsplash.com/photo-1745142640164-74774600af1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG9ydHMlMjBjYXN1YWwlMjBzdW1tZXJ8ZW58MXx8fHwxNzU4Nzk5ODA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'shorts-color-3',
        name: 'Olive Green',
        colorCode: '#6B8E23',
        images: [
          'https://images.unsplash.com/photo-1758534063951-1c78600f8129?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBwYW50cyUyMHRyb3VzZXJzfGVufDF8fHx8MTc1ODc5OTgxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'shorts-size-1', name: '28', displayName: '28" Waist' },
      { id: 'shorts-size-2', name: '30', displayName: '30" Waist' },
      { id: 'shorts-size-3', name: '32', displayName: '32" Waist' },
      { id: 'shorts-size-4', name: '34', displayName: '34" Waist' },
      { id: 'shorts-size-5', name: '36', displayName: '36" Waist' }
    ],
    combinations: [
      { id: 'shorts-combo-1', colorId: 'shorts-color-1', sizeId: 'shorts-size-1', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'shorts-combo-2', colorId: 'shorts-color-1', sizeId: 'shorts-size-2', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'shorts-combo-3', colorId: 'shorts-color-1', sizeId: 'shorts-size-3', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'shorts-combo-4', colorId: 'shorts-color-2', sizeId: 'shorts-size-2', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'shorts-combo-5', colorId: 'shorts-color-2', sizeId: 'shorts-size-3', quantity: 28, availableQuantity: 28, images: [] },
      { id: 'shorts-combo-6', colorId: 'shorts-color-2', sizeId: 'shorts-size-4', quantity: 22, availableQuantity: 22, images: [] },
      { id: 'shorts-combo-7', colorId: 'shorts-color-3', sizeId: 'shorts-size-1', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'shorts-combo-8', colorId: 'shorts-color-3', sizeId: 'shorts-size-3', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'shorts-combo-9', colorId: 'shorts-color-3', sizeId: 'shorts-size-5', quantity: 18, availableQuantity: 18, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 599,
    singleShopPrice: 699,
    multiShopPrice: 549,
    minOrderQuantity: 15,

    fabricType: 'Cotton',
    fabricDescription: '100% cotton twill fabric, comfortable fit with side pockets',
    deliveryTime: '5-10 days'
  },

  // 10. FORMAL PANTS - Set of Sizes
  {
    id: 'enhanced-stock-10',
    name: 'Executive Formal Trousers',
    category: 'Pants',
    description: 'Professional formal trousers for corporate wear. Wrinkle-resistant and comfortable fit.',
    supplier: 'Ahmedabad Formals',
    supplierType: 'manufacturer',
    location: 'Ahmedabad, Gujarat',
    dateAdded: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'single_color',
    colors: [
      {
        id: 'trouser-color-1',
        name: 'Charcoal Black',
        colorCode: '#36454F',
        images: [
          'https://images.unsplash.com/photo-1758534063951-1c78600f8129?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBwYW50cyUyMHRyb3VzZXJzfGVufDF8fHx8MTc1ODc5OTgxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1637641185564-9edb317d6f65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYWNrZXQlMjBibGF6ZXIlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODc5MjAwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'trouser-size-1', name: '28', displayName: '28" Waist' },
      { id: 'trouser-size-2', name: '30', displayName: '30" Waist' },
      { id: 'trouser-size-3', name: '32', displayName: '32" Waist' },
      { id: 'trouser-size-4', name: '34', displayName: '34" Waist' },
      { id: 'trouser-size-5', name: '36', displayName: '36" Waist' },
      { id: 'trouser-size-6', name: '38', displayName: '38" Waist' },
      { id: 'trouser-size-7', name: '40', displayName: '40" Waist' }
    ],
    combinations: [
      { id: 'trouser-combo-1', colorId: 'trouser-color-1', sizeId: 'trouser-size-1', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'trouser-combo-2', colorId: 'trouser-color-1', sizeId: 'trouser-size-2', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'trouser-combo-3', colorId: 'trouser-color-1', sizeId: 'trouser-size-3', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'trouser-combo-4', colorId: 'trouser-color-1', sizeId: 'trouser-size-4', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'trouser-combo-5', colorId: 'trouser-color-1', sizeId: 'trouser-size-5', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'trouser-combo-6', colorId: 'trouser-color-1', sizeId: 'trouser-size-6', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'trouser-combo-7', colorId: 'trouser-color-1', sizeId: 'trouser-size-7', quantity: 12, availableQuantity: 12, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 1199,
    singleShopPrice: 1399,
    multiShopPrice: 1099,
    minOrderQuantity: 8,

    fabricType: 'Polyester Blend',
    fabricDescription: '65% polyester, 35% cotton blend with wrinkle-resistant finish',
    deliveryTime: '5-10 days'
  },

  // 11. ETHNIC KURTI - Set of Pattern with Long Delivery
  {
    id: 'enhanced-stock-11',
    name: 'Traditional Kurti Collection',
    category: 'Traditional',
    description: 'Beautiful ethnic kurtis with traditional embroidery and modern cuts. Perfect for festivals and casual wear.',
    supplier: 'Mumbai Ethnic Wear',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'set_of_pattern',
    colors: [
      {
        id: 'kurti-pattern-1',
        name: 'Block Print Blue',
        images: [
          'https://images.unsplash.com/photo-1717049887308-75488551cb33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0aSUyMGV0aG5pY3xlbnwxfHx8fDE3NTg3OTk3OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1583391733956-6c78276477e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc2FyZWUlMjBlbWJyb2lkZXJ5fGVufDF8fHx8MTc1NzEzNzQ0M3ww&ixlib=rb-4.1.0&q=80&w=400'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'kurti-pattern-2',
        name: 'Floral Pink',
        images: [
          'https://images.unsplash.com/photo-1717049887308-75488551cb33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0aSUyMGV0aG5pY3xlbnwxfHx8fDE3NTg3OTk3OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      },
      {
        id: 'kurti-pattern-3',
        name: 'Embroidered Green',
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXJlZSUyMGluZGlhbiUyMGZsb3JhbHxlbnwxfHx8fDE3NTcxMzc0NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
        ],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'kurti-size-1', name: 'XS', displayName: 'Extra Small' },
      { id: 'kurti-size-2', name: 'S', displayName: 'Small' },
      { id: 'kurti-size-3', name: 'M', displayName: 'Medium' },
      { id: 'kurti-size-4', name: 'L', displayName: 'Large' },
      { id: 'kurti-size-5', name: 'XL', displayName: 'Extra Large' },
      { id: 'kurti-size-6', name: 'XXL', displayName: 'Double XL' }
    ],
    combinations: [
      { id: 'kurti-combo-1', colorId: 'kurti-pattern-1', sizeId: 'kurti-size-1', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'kurti-combo-2', colorId: 'kurti-pattern-1', sizeId: 'kurti-size-2', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'kurti-combo-3', colorId: 'kurti-pattern-1', sizeId: 'kurti-size-3', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'kurti-combo-4', colorId: 'kurti-pattern-1', sizeId: 'kurti-size-4', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'kurti-combo-5', colorId: 'kurti-pattern-2', sizeId: 'kurti-size-2', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'kurti-combo-6', colorId: 'kurti-pattern-2', sizeId: 'kurti-size-3', quantity: 16, availableQuantity: 16, images: [] },
      { id: 'kurti-combo-7', colorId: 'kurti-pattern-2', sizeId: 'kurti-size-4', quantity: 14, availableQuantity: 14, images: [] },
      { id: 'kurti-combo-8', colorId: 'kurti-pattern-3', sizeId: 'kurti-size-1', quantity: 6, availableQuantity: 6, images: [] },
      { id: 'kurti-combo-9', colorId: 'kurti-pattern-3', sizeId: 'kurti-size-3', quantity: 10, availableQuantity: 10, images: [] },
      { id: 'kurti-combo-10', colorId: 'kurti-pattern-3', sizeId: 'kurti-size-5', quantity: 8, availableQuantity: 8, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 899,
    singleShopPrice: 1099,
    multiShopPrice: 799,
    minOrderQuantity: 10,

    fabricType: 'Cotton',
    fabricDescription: '100% cotton with hand block printing and embroidery work',
    deliveryTime: 'more than 1 month'
  },

  // 12. WOMEN'S SKIRT - Individual Flex with Warehouse Supplier
  {
    id: 'enhanced-stock-12',
    name: 'Versatile Office Skirt Collection',
    category: 'Skirts',
    description: 'Professional skirts suitable for office wear. Available in multiple styles and colors.',
    supplier: 'Delhi Fashion Warehouse',
    supplierType: 'warehouse',
    location: 'Delhi, Delhi',
    dateAdded: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),

    itemSetType: 'individual_flex',
    colors: [
      {
        id: 'skirt-color-1',
        name: 'Navy Blue',
        colorCode: '#1E3A8A',
        images: [
          'https://images.unsplash.com/photo-1637227314917-3c0f595c3596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2lydCUyMGZhc2hpb24lMjB3b21lbnxlbnwxfHx8fDE3NTg3OTk4MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          'https://images.unsplash.com/photo-1700158777421-2fd9263cec53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTg3NjQ4NDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'skirt-color-2',
        name: 'Charcoal Grey',
        colorCode: '#36454F',
        images: [
          'https://images.unsplash.com/photo-1637227314917-3c0f595c3596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2lydCUyMGZhc2hpb24lMjB3b21lbnxlbnwxfHx8fDE3NTg3OTk4MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        ],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'skirt-size-1', name: 'XS', displayName: 'Extra Small (24")' },
      { id: 'skirt-size-2', name: 'S', displayName: 'Small (26")' },
      { id: 'skirt-size-3', name: 'M', displayName: 'Medium (28")' },
      { id: 'skirt-size-4', name: 'L', displayName: 'Large (30")' },
      { id: 'skirt-size-5', name: 'XL', displayName: 'Extra Large (32")' }
    ],
    combinations: [
      { id: 'skirt-combo-1', colorId: 'skirt-color-1', sizeId: 'skirt-size-1', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'skirt-combo-2', colorId: 'skirt-color-1', sizeId: 'skirt-size-2', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'skirt-combo-3', colorId: 'skirt-color-1', sizeId: 'skirt-size-3', quantity: 22, availableQuantity: 22, images: [] },
      { id: 'skirt-combo-4', colorId: 'skirt-color-1', sizeId: 'skirt-size-4', quantity: 16, availableQuantity: 16, images: [] },
      { id: 'skirt-combo-5', colorId: 'skirt-color-2', sizeId: 'skirt-size-2', quantity: 14, availableQuantity: 14, images: [] },
      { id: 'skirt-combo-6', colorId: 'skirt-color-2', sizeId: 'skirt-size-3', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'skirt-combo-7', colorId: 'skirt-color-2', sizeId: 'skirt-size-4', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'skirt-combo-8', colorId: 'skirt-color-2', sizeId: 'skirt-size-5', quantity: 10, availableQuantity: 10, images: [] }
    ],
    flexibleSelectionAllowed: true,

    basePrice: 1299,
    singleShopPrice: 1499,
    multiShopPrice: 1199,
    minOrderQuantity: 6,

    fabricType: 'Polyester Blend',
    fabricDescription: 'Polyester viscose blend with stretch waistband, machine washable',
    deliveryTime: '5-10 days'
  }
];

// Comprehensive real suppliers data for Indian textile industry
const realSuppliers = [
  // Major Manufacturers
  {
    id: 'MFR001',
    name: 'Arvind Limited',
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'trader' as const,
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
    type: 'trader' as const,
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
    type: 'trader' as const,
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
    type: 'trader' as const,
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
    type: 'trader' as const,
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
    type: 'trader' as const,
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
    type: 'manufacturer' as const,
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
    type: 'manufacturer' as const,
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
    type: 'trader' as const,
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

interface AppMainProps {
  user: any;
}

export function AppMain({ user }: AppMainProps) {
  // VERSION: 2025-12-15-v2-DEBUG-ORDERS
  useEffect(() => {
    console.log("AppMain V2 Loaded - Debugging Orders/Notifications");
  }, []);

  // Helper function to determine default view based on user role
  const getDefaultView = () => {
    if (user?.role === 'admin' || user?.role === 'super-admin') {
      return 'admin-dashboard';
    }
    if (user?.role === 'financial') {
      return 'financial-dashboard';
    }
    if (user?.role === 'logistics-agent') {
      return 'logistics-dashboard';
    }
    return 'home';
  };

  // Core state
  const [activeView, setActiveView] = useState(() => getDefaultView());
  const [isAppReady, setIsAppReady] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([getDefaultView()]);

  // Order provider hooks
  const { orders, addOrder, updateOrderStatus, getMyOrders, getOrdersForSupplier } = useOrders();

  // Stock provider hooks
  const { allStock, userStock, isLoading: stockLoading, refreshStock, addStock, deleteStock } = useStock();

  // Cart provider hooks
  const { addToCart, cartSummary } = useCart();

  // Notification provider hooks
  const { unreadCount: notificationCount } = useNotifications();

  // Data state - Initialize with empty arrays and load lazily
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [itemSets, setItemSets] = useState<ItemSet[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [preferredSuppliers, setPreferredSuppliers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]); // Suppliers from database
  const [userPurchaseHistory, setUserPurchaseHistory] = useState<string[]>([]); // Product IDs user has purchased
  const [returnRequests, setReturnRequests] = useState<any[]>([]); // Return requests state
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null); // Selected supplier for detail view
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null); // Selected product for detail view
  const [editingStock, setEditingStock] = useState<EnhancedStockItem | null>(null); // Stock item being edited

  // Purchase page state
  const [purchasePageData, setPurchasePageData] = useState<{
    stock: EnhancedStockItem;
    selectedCombinations: any[];
    specialInstructions: string;
  } | null>(null);

  // Item set state
  const [itemSetOrders, setItemSetOrders] = useState<SetOrderRequest[]>([]);
  const [itemSetPurchaseRequests, setItemSetPurchaseRequests] = useState<SetPurchaseRequest[]>([]);

  // Logistics state - Initialize with empty arrays and load lazily
  const [logisticsAgents, setLogisticsAgents] = useState<LogisticsAgent[]>([]);
  const [cities, setCities] = useState<DeliveryCity[]>([]);

  // Dialog state
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState<{
    orderNumber: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    deliveryAddress?: string;
    paymentMethod?: string;
    estimatedDelivery?: string;
    supplierName?: string;
    buyerName?: string;
    buyerPhone?: string;
    itemImage?: string;
    status: string;
  } | null>(null);

  const [showLogisticsSelection, setShowLogisticsSelection] = useState(false);
  const [pendingOrderForLogistics, setPendingOrderForLogistics] = useState<Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'> | null>(null);

  // Legacy logistics state
  const [showLogisticsSelector, setShowLogisticsSelector] = useState(false);
  const [selectedRequestForLogistics, setSelectedRequestForLogistics] = useState<PurchaseRequest | null>(null);


  // Memoize expensive computations - Always call these hooks
  const userStocks = useMemo(() => {
    if (!user || !stocks.length) return [];
    return stocks.filter(stock => stock.supplier === user.company);
  }, [stocks, user]);

  const filteredOrders = useMemo(() => {
    if (!user) return [];
    return user.role === 'retailer' ? getMyOrders(user.company || '') : getOrdersForSupplier(user.company);
  }, [user, getMyOrders, getOrdersForSupplier]);

  // Navigation functions
  const navigateTo = useCallback((view: string) => {
    try {
      console.log(`[Navigation] Navigating from ${activeView} to ${view} for role: ${user?.role}`);
      if (view !== activeView) {
        setNavigationHistory(prev => [...prev, activeView]);
        setActiveView(view);
      }
    } catch (error) {
      console.error('[Navigation] Error during navigation:', error);
      toast.error('Navigation error occurred');
    }
  }, [activeView, user?.role]);

  const navigateBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setActiveView(previousView);
    } else {
      setActiveView(getDefaultView());
    }
  }, [navigationHistory, user?.role]);

  const navigateToHome = useCallback(() => {
    const defaultView = getDefaultView();
    setNavigationHistory([]);
    setActiveView(defaultView);
  }, [user?.role]);

  // Handler functions
  const handleAddStock = useCallback(async (newStock: Omit<StockItem, 'id' | 'dateAdded'>) => {
    try {
      // Transform StockItem to Enhanced Stock format for backend
      const transformedStockData = {
        name: newStock.name,
        category: newStock.category,
        supplier: user?.company || newStock.supplier,
        basePrice: newStock.price,
        description: newStock.description,
        itemSetType: 'individual_flex', // Default for simple stock items
        minOrderQuantity: newStock.minOrderQuantity,
        singleShopPrice: newStock.singleShopPrice,
        multiShopPrice: newStock.multiShopPrice,
        fabricType: newStock.fabricType,
        fabricDescription: newStock.fabricDescription,
        deliveryTime: newStock.deliveryTime,
        tradersOnly: newStock.tradersOnly || false,
        location: newStock.location || (user?.profile?.address ?
          `${user.profile.address.city}, ${user.profile.address.state}` : 'Location not available'),
        productImages: newStock.images || [],

        // Create colors and sizes arrays
        colors: newStock.variants ?
          Array.from(new Set(newStock.variants.map(v => v.color))).map(color => ({
            id: `color-${(color || 'default').toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: color,
            images: newStock.variants?.filter(v => v.color === color && v.imageUrl)
              .map(v => v.imageUrl!).filter(Boolean) || [],
            definition: { hasColorPicker: false, hasImage: false, hasName: true }
          })) : [{
            id: newStock.color?.toLowerCase().replace(/\s+/g, '-') || 'default',
            name: newStock.color || 'Default',
            images: [],
            definition: { hasColorPicker: false, hasImage: false, hasName: true }
          }],

        sizes: newStock.variants ?
          Array.from(new Set(newStock.variants.map(v => v.size))).map(size => ({
            id: (size || 'one-size').toLowerCase().replace(/\s+/g, '-'),
            name: size,
            displayName: size
          })) : [{
            id: newStock.size?.toLowerCase().replace(/\s+/g, '-') || 'one-size',
            name: newStock.size || 'One Size',
            displayName: newStock.size || 'One Size'
          }],

        // Create combinations from variants or single color/size
        combinations: newStock.variants ? newStock.variants.map((variant, index) => ({
          id: `${`combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}-${variant.size || 'one-size'}-${index}`.toLowerCase().replace(/\s+/g, '-'),
          colorId: `color-${Date.now()}-${index}`.toLowerCase().replace(/\s+/g, '-'),
          sizeId: `size-${(variant.size || 'one-size').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${index}`.replace(/\s+/g, '-'),
          quantity: variant.quantity,
          availableQuantity: variant.quantity,
          images: variant.imageUrl ? [variant.imageUrl] : []
        })) : [{
          id: `single-combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toLowerCase().replace(/\s+/g, '-'),
          colorId: `single-color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sizeId: `single-size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quantity: newStock.quantity,
          availableQuantity: newStock.quantity,
          images: []
        }],

        // Set additional enhanced stock properties
        flexibleSelectionAllowed: true,

        // Handle offer data if present
        hasOffer: newStock.offerPrice && newStock.offerPrice > 0,
        ...(newStock.offerPrice && newStock.offerPrice > 0 && {
          offerData: {
            offerPrice: newStock.offerPrice,
            offerType: newStock.offerType || 'time',
            offerTimeWeeks: newStock.offerTimeWeeks,
            offerMinQuantity: newStock.offerMinQuantity,
            offerValidUntil: newStock.offerValidUntil,
            offerCreatedDate: newStock.offerCreatedDate
          }
        })
      };

      // Use StockProvider's addStock method to save to backend
      const success = await addStock(transformedStockData);

      if (success) {
        // Also add to local state for immediate UI update (StockProvider should handle this)
        const stock: StockItem = {
          ...newStock,
          id: Math.random().toString(36).substr(2, 9),
          dateAdded: new Date().toISOString()
        };
        setStocks(prev => [stock, ...prev]);

        setActiveView('my-stock');
        toast.success('Stock item added successfully and saved to database!');
      } else {
        toast.error('Failed to save stock item to database. Please try again.');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock item. Please check your connection and try again.');
    }
  }, [addStock, user]);

  const handleDeleteStock = useCallback(async (stockId: string) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this stock item? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteStock(stockId);
      if (success) {
        toast.success('Stock item deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error('Failed to delete stock item. Please try again.');
    }
  }, [deleteStock]);

  const handleEditStock = useCallback((updatedStock: any) => {
    // Navigate back to my-stock after successful edit
    setEditingStock(null);
    setActiveView('my-stock');
  }, []);

  const handlePlaceOrder = useCallback((orderData: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>) => {
    if (user?.role === 'retailer') {
      setPendingOrderForLogistics(orderData);
      setShowLogisticsSelection(true);
      return;
    }

    // Create order data for the provider
    const orderToAdd: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'> = {
      ...orderData,
      stockId: orderData.stockId || orderData.itemId || '',
      stockName: orderData.stockName || orderData.itemName || 'Unknown Item',
      itemName: orderData.itemName || 'Unknown Item',
      quantity: orderData.quantity || 1,
      unitPrice: orderData.unitPrice || 0,
      totalAmount: orderData.totalAmount || 0,
      buyerCompany: user?.company || 'Unknown Company',
      buyerEmail: user?.email || '',
      supplierName: orderData.supplierName || 'Unknown Supplier',
      paymentMethod: orderData.paymentMethod || 'upi',
      deliveryAddress: orderData.deliveryAddress || '',
      specialInstructions: orderData.specialInstructions || '',
      estimatedDelivery: orderData.estimatedDelivery || ''
    };

    // Add order via provider (automatically handles real-time updates)
    const newOrder = addOrder(orderToAdd);

    setConfirmationOrderDetails({
      orderNumber: newOrder.id,
      itemName: orderData.itemName || '',
      quantity: orderData.quantity || 0,
      unitPrice: orderData.unitPrice || 0,
      totalAmount: orderData.totalAmount || 0,
      deliveryAddress: orderData.deliveryAddress,
      paymentMethod: newOrder.paymentMethod,
      estimatedDelivery: orderData.estimatedDelivery,
      supplierName: orderData.supplierName,
      buyerName: user?.company || user?.name || 'Valued Customer',
      buyerPhone: user?.phone || '',
      itemImage: orderData.stockImage,
      status: 'confirmed'
    });
    setShowOrderConfirmation(true);
  }, [user?.role, addOrder]);

  const handleLogisticsConfirm = useCallback((logistics: OrderLogistics) => {
    if (pendingOrderForLogistics) {
      // Create order data for the provider
      const orderToAdd: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'> = {
        ...pendingOrderForLogistics,
        stockId: pendingOrderForLogistics.stockId || pendingOrderForLogistics.itemId || '',
        stockName: pendingOrderForLogistics.stockName || pendingOrderForLogistics.itemName || 'Unknown Item',
        itemName: pendingOrderForLogistics.itemName || 'Unknown Item',
        quantity: pendingOrderForLogistics.quantity || 1,
        unitPrice: pendingOrderForLogistics.unitPrice || 0,
        totalAmount: pendingOrderForLogistics.totalAmount || 0,
        buyerCompany: user?.company || 'Unknown Company',
        buyerEmail: user?.email || '',
        supplierName: pendingOrderForLogistics.supplierName || 'Unknown Supplier',
        paymentMethod: pendingOrderForLogistics.paymentMethod || 'upi',
        deliveryCity: logistics.deliveryCity,
        deliveryAddress: logistics.deliveryAddress,
        preferredLogisticsAgent: logistics.preferredAgentId,
        specialInstructions: logistics.specialInstructions || pendingOrderForLogistics.specialInstructions || '',
        estimatedDelivery: pendingOrderForLogistics.estimatedDelivery || ''
      };

      // Add order via provider (automatically handles real-time updates)
      const newOrder = addOrder(orderToAdd);

      setConfirmationOrderDetails({
        orderNumber: newOrder.id,
        itemName: pendingOrderForLogistics.itemName || '',
        quantity: pendingOrderForLogistics.quantity || 0,
        unitPrice: pendingOrderForLogistics.unitPrice || 0,
        totalAmount: pendingOrderForLogistics.totalAmount || 0,
        deliveryAddress: logistics.deliveryAddress,
        paymentMethod: newOrder.paymentMethod,
        estimatedDelivery: pendingOrderForLogistics.estimatedDelivery,
        supplierName: pendingOrderForLogistics.supplierName,
        buyerName: user?.company || user?.name || 'Valued Customer',
        buyerPhone: user?.phone || '',
        itemImage: pendingOrderForLogistics.stockImage,
        status: 'confirmed'
      });
      setShowOrderConfirmation(true);

      setPendingOrderForLogistics(null);
    }
    setShowLogisticsSelection(false);
  }, [pendingOrderForLogistics, addOrder]);

  // Post-order handlers
  const handleTrackOrder = useCallback(() => {
    setShowOrderConfirmation(false);
    setConfirmationOrderDetails(null);
    setActiveView('my-orders');
  }, []);

  const handleContinueShopping = useCallback(() => {
    setShowOrderConfirmation(false);
    setConfirmationOrderDetails(null);
    setActiveView('browse-stock');
  }, []);

  // Purchase page handlers
  const handleProceedToPurchase = useCallback((
    stock: EnhancedStockItem,
    selectedCombinations: any[],
    specialInstructions: string
  ) => {
    setPurchasePageData({
      stock,
      selectedCombinations,
      specialInstructions
    });
    setActiveView('purchase-page');
  }, []);

  const handlePurchaseComplete = useCallback(() => {
    setPurchasePageData(null);
    setActiveView('my-orders');
    toast.success('Purchase completed successfully!');
  }, []);

  // Handle add to cart from product detail page
  const handleAddToCart = useCallback((variants: Array<any>) => {
    if (!selectedProduct) {
      toast.error('No product selected');
      return;
    }

    try {
      // For each variant, create a cart entry
      variants.forEach(variant => {
        // Create a mock stock item for the variant
        const variantStockItem: StockItem = {
          ...selectedProduct,
          id: variant.id || variant.sku || `${selectedProduct.id}-${variant.color || variant.selectedColor?.name || 'default'}-${variant.size || variant.selectedSize || 'default'}`,
          color: variant.color || variant.selectedColor?.name || 'Default',
          size: variant.size || variant.selectedSize || 'One Size',
          quantity: variant.quantity || 1
        };

        addToCart(variantStockItem, variant.quantity || 1);
      });

      toast.success(`Added ${variants.length} item${variants.length > 1 ? 's' : ''} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add items to cart');
    }
  }, [selectedProduct, addToCart]);



  // Preferred suppliers handlers
  const handleTogglePreferredSupplier = useCallback(async (supplierId: string) => {
    if (!user?.gstNumber) {
      toast.error('Please log in to manage preferred suppliers');
      return;
    }

    try {
      const isCurrentlyPreferred = preferredSuppliers.includes(supplierId);
      const action = isCurrentlyPreferred ? 'remove' : 'add';

      const data = await suppliersAPI.togglePreferredSupplier(user.gstNumber, supplierId, action);

      if (data.success) {
        setPreferredSuppliers(data.preferredSuppliers || (action === 'add'
          ? [...preferredSuppliers, supplierId]
          : preferredSuppliers.filter(id => id !== supplierId)
        ));
        const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Supplier';
        toast.success(
          action === 'add'
            ? `Added ${supplierName} to preferred suppliers`
            : `Removed ${supplierName} from preferred suppliers`
        );
      } else if (!data.usingFallback) {
        toast.error(data.error || 'Failed to update preferred suppliers');
      }
    } catch (error) {
      console.error('Error toggling preferred supplier:', error);
      toast.error('Failed to update preferred suppliers');
    }
  }, [user?.gstNumber, preferredSuppliers, suppliers]);

  // Load preferred suppliers on user login
  useEffect(() => {
    const loadPreferredSuppliers = async () => {
      if (!user?.gstNumber) {
        setPreferredSuppliers([]);
        return;
      }

      try {
        const data = await suppliersAPI.getPreferredSuppliers(user.gstNumber);

        if (data.success && data.preferredSuppliers) {
          setPreferredSuppliers(data.preferredSuppliers);
        } else {
          setPreferredSuppliers([]);
        }
      } catch (error) {
        console.error('Error loading preferred suppliers:', error);
        setPreferredSuppliers([]);
      }
    };

    loadPreferredSuppliers();
  }, [user?.gstNumber]);

  // Load suppliers from database with auto-migration
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        console.log('Loading suppliers from database...');
        const data = await suppliersAPI.getSuppliers();

        console.log('Suppliers response data:', data);

        if (data.success && data.suppliers && data.suppliers.length > 0) {
          setSuppliers(data.suppliers);
          // Backend is working - suppliers loaded successfully
        } else {
          // Backend not deployed or no suppliers - use fallback data silently
          setSuppliers(realSuppliers);
        }
      } catch (error) {
        // Silent fallback - backend not deployed is expected until user deploys
        // Components use fallback data automatically, no need for error messages
        setSuppliers(realSuppliers);
      }
    };

    loadSuppliers();
  }, []); // Only load once when component mounts

  // Migrate suppliers to database
  const migrateSuppliers = useCallback(async () => {
    try {
      console.log('Starting suppliers migration...');

      const data = await suppliersAPI.migrateSuppliers();
      console.log('Migration response data:', data);

      if (data.success) {
        console.log(`Suppliers migration completed successfully: ${data.count || 0} suppliers migrated`);
        return true;
      } else {
        console.error('Suppliers migration failed:', data.error);
        if (!data.usingFallback) {
          toast.error(`Migration failed: ${data.error}`);
        }
        return false;
      }
    } catch (error) {
      console.error('Error during suppliers migration:', error);
      toast.error(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, []);

  const handleBackFromPurchase = useCallback(() => {
    setPurchasePageData(null);
    navigateBack();
  }, [navigateBack]);

  // Rating handler
  const handleRatingSubmit = useCallback((newRating: Omit<Rating, 'id' | 'createdDate'>) => {
    const rating: Rating = {
      ...newRating,
      id: `rating-${Date.now()}-${Math.random()}`,
      createdDate: new Date().toISOString().split('T')[0]
    };

    // Update or add rating
    setRatings(prev => {
      const existingIndex = prev.findIndex(r =>
        r.userId === rating.userId &&
        r.targetId === rating.targetId &&
        r.targetType === rating.targetType
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = rating;
        return updated;
      } else {
        return [...prev, rating];
      }
    });

    // Add to purchase history if rating a product
    if (newRating.targetType === 'item') {
      setUserPurchaseHistory(prev => {
        if (!prev.includes(newRating.targetId)) {
          return [...prev, newRating.targetId];
        }
        return prev;
      });
    }

    toast.success('Rating submitted successfully!');
  }, []);

  // Return request handler
  const handleInitiateReturn = useCallback((returnData: any) => {
    const returnRequest = {
      ...returnData,
      id: `RET-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      status: 'pending',
      returnDate: new Date().toISOString()
    };

    setReturnRequests(prev => [returnRequest, ...prev]);
  }, []);

  // Navigation handlers for detail pages
  const handleViewSupplierDetails = useCallback((supplier: any) => {
    setSelectedSupplier(supplier);
    setActiveView('supplier-detail');
  }, []);

  const handleViewProductDetails = useCallback((product: any) => {
    setSelectedProduct(product);
    setActiveView('product-detail');
  }, []);

  // Purchase request handler
  const handlePurchaseRequest = useCallback((requestData: any) => {
    const purchaseRequest = {
      id: `PR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      ...requestData,
      requestDate: new Date().toISOString(),
      status: 'PR-Created' as const,
      buyerCompany: user?.company || requestData.buyerName || 'Unknown company'
    };

    setPurchaseRequests(prev => [purchaseRequest, ...prev]);
    toast.success('Purchase request sent successfully!');

    // Navigate back to browse stock
    setActiveView('browse-stock');
  }, [user?.company]);

  // Admin Dashboard Handlers
  const handleOrderStatusUpdate = useCallback((orderId: string, status: OrderRequest['status'], adminRemarks?: string) => {
    updateOrderStatus(orderId, status, { specialInstructions: adminRemarks });
    toast.success(`Order ${orderId} status updated to ${status}`);
  }, [updateOrderStatus]);

  const handleUpdateTrending = useCallback((stockId: string, isTrending: boolean, trendingText?: string) => {
    setStocks(prev => prev.map(stock =>
      stock.id === stockId
        ? { ...stock, isTrending, trendingText: isTrending ? trendingText : undefined }
        : stock
    ));
    toast.success(`Stock item ${isTrending ? 'marked as trending' : 'removed from trending'}`);
  }, []);

  const handleAddLogisticsAgent = useCallback((agent: Omit<LogisticsAgent, 'id' | 'dateAdded' | 'isActive'>) => {
    const newAgent: LogisticsAgent = {
      ...agent,
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dateAdded: new Date().toISOString(),
      isActive: true
    };
    setLogisticsAgents(prev => [...prev, newAgent]);
    toast.success('Logistics agent added successfully');
  }, []);

  const handleUpdateLogisticsAgent = useCallback((agentId: string, updates: Partial<LogisticsAgent>) => {
    setLogisticsAgents(prev => prev.map(agent =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    ));
    toast.success('Logistics agent updated successfully');
  }, []);

  const handleDeleteLogisticsAgent = useCallback((agentId: string) => {
    setLogisticsAgents(prev => prev.filter(agent => agent.id !== agentId));
    toast.success('Logistics agent deleted successfully');
  }, []);

  const handleAddCity = useCallback((city: Omit<DeliveryCity, 'id' | 'dateAdded'>) => {
    const newCity: DeliveryCity = {
      ...city,
      id: `city-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dateAdded: new Date().toISOString()
    };
    setCities(prev => [...prev, newCity]);
    toast.success('Delivery city added successfully');
  }, []);

  const handleUpdateCity = useCallback((cityId: string, updates: Partial<DeliveryCity>) => {
    setCities(prev => prev.map(city =>
      city.id === cityId ? { ...city, ...updates } : city
    ));
    toast.success('Delivery city updated successfully');
  }, []);

  const handleDeleteCity = useCallback((cityId: string) => {
    setCities(prev => prev.filter(city => city.id !== cityId));
    toast.success('Delivery city deleted successfully');
  }, []);

  // Initialize app
  useEffect(() => {
    if (user) {
      // Determine initial view: Priority to URL path, fallback to role-based default
      const path = window.location.pathname;
      const defaultView = getDefaultView();
      let initialView = defaultView;

      if (path === '/add-stock') {
        const allowedRoles = ['manufacturer', 'trader', 'warehouse', 'admin'];
        if (allowedRoles.includes(user.role)) {
          initialView = 'add-stock';
        }
      } else if (path === '/browse' || path === '/browse-stock') {
        initialView = 'browse-stock';
      } else if (path === '/cart') {
        initialView = 'cart';
      } else if (path === '/orders') {
        initialView = 'orders';
      } else if (path === '/my-orders') {
        initialView = 'my-orders';
      } else if (path === '/my-stock') {
        initialView = 'my-stock';
      } else if (path === '/analytics') {
        initialView = 'analytics';
      } else if (path === '/settings') {
        initialView = 'settings';
      } else if (path === '/profile') {
        initialView = 'profile';
      } else if (path === '/suppliers') {
        initialView = 'suppliers';
      } else if (path === '/approvals') {
        initialView = 'approvals';
      } else if (path === '/payments') {
        initialView = 'payments';
      } else if (path === '/clients') {
        initialView = 'clients';
      }

      console.log(`[Init] Setting initial view to ${initialView} (Path: ${path}, Default: ${defaultView})`);
      setActiveView(initialView);

      // Initialize purchase history with delivered order product IDs for retailers
      if (user.role === 'retailer') {
        setUserPurchaseHistory(['1', '3']);
      }

      // Load mock data with robust error handling
      const loadMockData = () => {
        try {
          // Ensure mockStocks is defined and is an array
          const safeStocks = Array.isArray(mockStocks) ? mockStocks : [];
          const safeLogisticsAgents = Array.isArray(mockLogisticsAgents) ? mockLogisticsAgents : [];
          const safeCities = Array.isArray(mockDeliveryCities) ? mockDeliveryCities : [];

          // Load initial batch of data immediately
          setStocks(safeStocks.slice(0, Math.min(10, safeStocks.length)));
          setLogisticsAgents(safeLogisticsAgents);
          setCities(safeCities);

          // Set app as ready immediately
          setIsAppReady(true);

          // Load remaining data after component has rendered
          if (safeStocks.length > 10) {
            setTimeout(() => {
              try {
                setStocks(safeStocks);
              } catch (error) {
                console.warn('Error loading additional stock data:', error);
              }
            }, 50);
          }

        } catch (error) {
          console.error('Error loading mock data:', error);
          toast.error('Failed to load application data. Continuing with limited functionality.');

          // Fallback: set minimal data to prevent app from breaking
          setStocks([]);
          setLogisticsAgents([]);
          setCities([]);
          setIsAppReady(true);
        }
      };

      // Use requestAnimationFrame for better performance if available
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(loadMockData);
      } else {
        loadMockData();
      }
    }
  }, [user]);

  // Event listener for direct product navigation from EnhancedStockCard
  useEffect(() => {
    const handleProductNavigation = (event: CustomEvent) => {
      const { product } = event.detail;
      if (product) {
        handleViewProductDetails(product);
      }
    };

    window.addEventListener('navigate-to-product', handleProductNavigation as EventListener);

    return () => {
      window.removeEventListener('navigate-to-product', handleProductNavigation as EventListener);
    };
  }, [handleViewProductDetails]);

  const renderContent = () => {
    console.log(`[Render] Rendering view: ${activeView} for role: ${user?.role}`);

    // Show loading if not ready
    if (!isAppReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Initializing...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;

      case 'analytics':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back to Dashboard"
              variant="minimal"
            />
            <AnalyticsDashboard />
          </div>
        );

      // Role-specific Dashboard Cases
      case 'retailer-dashboard':
        if (user?.role === 'retailer') {
          return <RetailerDashboard onNavigate={navigateTo} />;
        }
        return <HomePage onNavigate={navigateTo} />;

      case 'manufacturer-dashboard':
        if (user?.role === 'manufacturer') {
          return <ManufacturerDashboard />;
        }
        return <HomePage onNavigate={navigateTo} />;

      case 'trader-dashboard':
        if (user?.role === 'trader') {
          return <TraderDashboard />;
        }
        return <HomePage onNavigate={navigateTo} />;

      case 'settings':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <SettingsPanel onProfileClick={() => navigateTo('profile')} />
          </div>
        );

      case 'profile':
        return (
          <div>
            <BreadcrumbBackButton
              paths={[
                { label: 'Settings', action: () => navigateTo('settings') },
                { label: 'Profile', action: () => { }, current: true }
              ]}
            />
            <ProfileEditor onBack={() => navigateTo('settings')} />
          </div>
        );

      case 'my-stock':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <EnhancedStockView
              title="My Stock"
              stocks={allStock}
              preferredSuppliers={preferredSuppliers}
              onTogglePreferred={handleTogglePreferredSupplier}
              showOwnerActions={true}
              onEdit={(stock) => {
                setEditingStock(stock);
                setActiveView('edit-stock');
              }}
              onDelete={handleDeleteStock}
              onProceedToPurchase={handleProceedToPurchase}
              onViewDetails={handleViewProductDetails}
            />
          </div>
        );

      case 'browse-stock':
        return (
          <EnhancedBrowseStockPage
            onNavigateBack={navigateBack}
            onNavigateHome={navigateToHome}
            showBackButton={navigationHistory.length > 0}
          />
        );


      case 'cart':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <CartView
              onContinueShopping={() => navigateTo('browse-stock')}
            />
          </div>
        );

      case 'add-stock':
        return (
          <div>
            <AddStockWizard
              onSubmit={handleAddStock}
              onCancel={() => {
                // Only navigate to my-stock if onCancel is called directly (not during navigation)
                // This will be handled by AddStockWizard's internal logic which may call this
                // IF the user clicks "Discard" or "Close".
                // BUT if AddStockWizard calls onCancel() as cleanup after navigation, this will override it.
                // We can check if we are still on 'add-stock' view, but that won't help if React hasn't updated.

                // Since AddStockWizard handles navigation internally now via pendingNavigationPage,
                // we shouldn't force navigation here IF the intent was just to close the "modal".
                // But in this flat view structure, "closing" IS navigation.

                // For now, let's stick to 'my-stock' as default cancel destination,
                // but rely on AddStockWizard NOT calling this if it has already navigated.
                navigateTo('my-stock');
              }}
              navigation={{
                currentPage: activeView,
                onNavigate: navigateTo,
                cartItemCount: 0,
                notificationCount: 0
              }}
            />
          </div>
        );

      // Commented out - VariantUploadDemo component removed during cleanup
      // case 'variant-demo':
      //   return (
      //     <div>
      //       <BreadcrumbBackButton 
      //         paths={[
      //           { label: 'My Stock', action: () => navigateTo('my-stock') },
      //           { label: 'Variant Upload Demo', action: () => {}, current: true }
      //         ]}
      //       />
      //       <VariantUploadDemo />
      //     </div>
      //   );

      case 'edit-stock':
        return (
          <>
            <div>
              <BreadcrumbBackButton
                paths={[
                  { label: 'My Stock', action: () => navigateTo('my-stock') },
                  { label: 'Edit Stock', action: () => { }, current: true }
                ]}
              />
              <div className="p-4">
                <p className="text-muted-foreground mb-4">Loading edit form...</p>
              </div>
            </div>
            <EditStockForm
              stock={editingStock}
              isOpen={true}
              onClose={() => {
                setEditingStock(null);
                navigateTo('my-stock');
              }}
            />
          </>
        );

      case 'suppliers':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <SuppliersDirectory
              preferredSuppliers={preferredSuppliers}
              onTogglePreferred={handleTogglePreferredSupplier}
              ratings={ratings}
              onRatingSubmit={handleRatingSubmit}
              onViewDetails={handleViewSupplierDetails}
            />
          </div>
        );

      case 'my-orders':
        // Use OrderProvider to get real-time user orders
        const myOrders = getMyOrders(user?.company || '');
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <MyOrdersView
              orders={myOrders}
              ratings={ratings}
              onRatingSubmit={handleRatingSubmit}
              onReturnRequest={(orderId: string, reason: string) => {
                // Handle return request
                console.log('Return request:', orderId, reason);
                toast.success('Return request submitted successfully!');
              }}
            />
          </div>
        );

      case 'vton':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <VirtualTryOn />
          </div>
        );

      case 'orders':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <UnifiedOrderManagement
              userRole={
                (user?.role === 'manufacturer' || user?.role === 'warehouse') ? 'supplier' :
                  (user?.role === 'retailer') ? 'retailer' :
                    (user?.role === 'financial') ? 'financial_agent' :
                      'trader'
              }
            />
          </div>
        );

      case 'purchase-return':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <EnhancedPurchaseReturn
              orders={user?.role === 'retailer'
                ? orders.filter(order => order.buyerCompany === user.company)
                : orders}
              returns={returnRequests}
              onInitiateReturn={handleInitiateReturn}
            />
          </div>
        );

      case 'rating-demo':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back to Home"
            />
            <div className="p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Rating System</h2>
              <p className="text-muted-foreground">Rating and review features are available when viewing actual stock items and suppliers.</p>
            </div>
          </div>
        );

      case 'rating-review-demo':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back to Home"
            />
            <div className="p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Rating & Review System</h2>
              <p className="text-muted-foreground">Rating and review features are integrated into the stock browsing and purchasing experience.</p>
            </div>
          </div>
        );

      case 'enhanced-stock-demo':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back to Home"
            />
            <div className="p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Enhanced Stock Management</h2>
              <p className="text-muted-foreground">Add real stock items using the "Add Stock" feature to explore the enhanced stock management capabilities.</p>
            </div>
          </div>
        );

      case 'set-of-pattern-demo':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back to Home"
            />
            <div className="p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Set of Pattern Feature</h2>
              <p className="text-muted-foreground">Create stock items with multiple color and size combinations using the "Set of Pattern" option when adding new stock.</p>
            </div>
          </div>
        );

      case 'supplier-detail':
        return selectedSupplier ? (
          <SupplierDetailPage
            supplier={selectedSupplier}
            ratings={ratings.filter(r => r.targetId === selectedSupplier.id && r.targetType === 'supplier')}
            preferredSuppliers={preferredSuppliers}
            onRatingSubmit={handleRatingSubmit}
            onTogglePreferred={handleTogglePreferredSupplier}
            onBack={navigateBack}
          />
        ) : (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <p>Supplier not found</p>
          </div>
        );

      case 'product-detail':
        return selectedProduct ? (
          <ModernBuyerFocusedProductDetail
            product={selectedProduct}
            onBack={navigateBack}
            onPurchaseRequest={handlePurchaseRequest}
            onAddToCart={handleAddToCart}
            onNavigateToCart={() => navigateTo('cart')}
          />
        ) : (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <p>Product not found</p>
          </div>
        );

      // Admin Dashboard
      case 'admin-dashboard':
        if (user?.role === 'admin' || user?.role === 'super-admin') {
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
                variant="minimal"
              />
              <AdminDashboard
                orders={orders}
                onUpdateOrderStatus={handleOrderStatusUpdate}
                stocks={stocks}
                onUpdateTrending={handleUpdateTrending}
                logisticsAgents={logisticsAgents}
                cities={cities}
                onAddLogisticsAgent={handleAddLogisticsAgent}
                onUpdateLogisticsAgent={handleUpdateLogisticsAgent}
                onDeleteLogisticsAgent={handleDeleteLogisticsAgent}
                onAddCity={handleAddCity}
                onUpdateCity={handleUpdateCity}
                onDeleteCity={handleDeleteCity}
                onUserUpdate={(users) => {
                  console.log('User data updated:', users);
                  toast.success('User data updated successfully');
                }}
              />
            </div>
          );
        }
        // Fallback for non-admin users
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
              variant="minimal"
            />
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground text-center">
                Access Denied<br />
                <span className="text-sm">You need admin privileges to access this page</span>
              </p>
            </div>
          </div>
        );

      // User Management - Direct access to Admin Dashboard with focus on User Management
      case 'user-management':
        if (user?.role === 'admin' || user?.role === 'super-admin') {
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
                variant="minimal"
              />
              <AdminDashboard
                orders={orders}
                onUpdateOrderStatus={handleOrderStatusUpdate}
                stocks={stocks}
                onUpdateTrending={handleUpdateTrending}
                logisticsAgents={logisticsAgents}
                cities={cities}
                onAddLogisticsAgent={handleAddLogisticsAgent}
                onUpdateLogisticsAgent={handleUpdateLogisticsAgent}
                onDeleteLogisticsAgent={handleDeleteLogisticsAgent}
                onAddCity={handleAddCity}
                onUpdateCity={handleUpdateCity}
                onDeleteCity={handleDeleteCity}
                onUserUpdate={(users) => {
                  console.log('User data updated:', users);
                  toast.success('User data updated successfully');
                }}
                initialTab="users"
              />
            </div>
          );
        }
        // Fallback for non-admin users
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
              variant="minimal"
            />
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground text-center">
                Access Denied<br />
                <span className="text-sm">You need admin privileges to access this page</span>
              </p>
            </div>
          </div>
        );

      // Financial Agent Dashboard
      case 'financial-dashboard':
        if (user?.role === 'financial') {
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
                variant="minimal"
              />
              <FinancialAgentDashboard onNavigate={navigateTo} />
            </div>
          );
        }
        break;

      case 'approvals':
        // Route based on user role
        if (user?.role === 'logistics-agent' || user?.role === 'logistics_agent') {
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
              />
              <UnifiedOrderManagement userRole="logistics_agent" />
            </div>
          );
        } else if (user?.role === 'financial_agent' || user?.role === 'financial') {
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
              />
              <UnifiedOrderManagement userRole="financial_agent" />
            </div>
          );
        } else {
          // For other roles (supplier, retailer, trader)
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
              />
              <UnifiedOrderManagement userRole={user?.role === 'manufacturer' || user?.role === 'warehouse' ? 'supplier' : (user?.role as any) || 'retailer'} />
            </div>
          );
        }

      case 'payments':
        return <FinancialPayments onBack={navigateToHome} />;

      case 'clients':
        return <FinancialClients onBack={navigateToHome} />;



      // Logistics Dashboard
      case 'logistics-dashboard':
        if (user?.role === 'logistics-agent') {
          return (
            <div>
              <BackButton
                onBack={navigateBack}
                onHome={navigateToHome}
                label="Back"
                variant="minimal"
              />
              <LogisticsAgentDashboard />
            </div>
          );
        }
        break;

      case 'purchase-page':
        if (purchasePageData) {
          return (
            <PurchasePage
              stock={purchasePageData.stock}
              selectedCombinations={purchasePageData.selectedCombinations}
              specialInstructions={purchasePageData.specialInstructions}
              onBack={handleBackFromPurchase}
              onPurchaseComplete={handlePurchaseComplete}
            />
          );
        }
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
              variant="minimal"
            />
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Purchase data not found. Please go back and try again.</p>
            </div>
          </div>
        );

      case 'new':
        return <NewPickupsPage onBack={navigateToHome} />;

      case 'today':
        return <TodaysPickupsPage onBack={navigateToHome} />;

      case 'transit':
        return <InTransitPage onBack={navigateToHome} />;

      case 'notifications':
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
            />
            <div className="max-w-3xl mx-auto mt-6 px-4 md:px-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground mt-1">
                  View your latest updates, order status, and action items from Firestore.
                </p>
              </div>
              <NotificationPanel fullPage={true} />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <BackButton
              onBack={navigateBack}
              onHome={navigateToHome}
              label="Back"
              variant="minimal"
            />
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Page not found or feature coming soon...</p>
            </div>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'home': return 'CALIQUO';
      case 'browse-stock': return 'Browse Stock';
      case 'my-stock': return 'My Stock';
      case 'cart': return 'Shopping Cart';
      case 'orders': return 'Orders';
      case 'my-orders': return 'My Orders';
      case 'admin-dashboard': return 'Admin Dashboard';
      case 'notifications': return 'Notifications';
      case 'settings': return 'Settings';
      case 'add-stock': return 'Add Stock';
      case 'profile': return 'Profile';
      case 'suppliers': return 'Suppliers';
      case 'approvals': return 'Approvals';
      case 'payments': return 'Payments';
      case 'clients': return 'Clients';

      case 'new': return 'New Pickups';
      case 'today': return 'Today\'s Pickups';
      case 'transit': return 'In Transit';
      default: return 'CALIQUO';
    }
  };

  return (
    <div className={`min-h-screen ${activeView === 'admin-dashboard' ? 'bg-background' : 'bg-transparent'} ${activeView === 'admin-dashboard' ? '' : 'pb-[calc(6rem+env(safe-area-inset-bottom))]'}`}>
      {activeView !== 'home' && activeView !== 'admin-dashboard' && (
        <FloatingHomeButton onHomeClick={() => navigateTo('home')} variant="floating" />
      )}
      {activeView !== 'admin-dashboard' && <FloatingApparels />}
      <PWAFeatures />

      {activeView !== 'admin-dashboard' && (
        <MobileHeader
          title={getPageTitle()}
          showSearch={activeView === 'browse-stock'}
          onNavigate={navigateTo}
          notificationCount={notificationCount}
          cartItemCount={cartSummary?.totalItems || 0}
          onBack={navigationHistory.length > 0 ? navigateBack : undefined}
          showBack={navigationHistory.length > 0 && activeView !== 'home'}
        />
      )}

      {(activeView === 'home') && (
        <div className="relative z-10">
          <AnnouncementBanner />
        </div>
      )}

      <PWAManager />

      <main className={activeView === 'admin-dashboard'
        ? "p-0"
        : "p-4 sm:p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[calc(100vh-4rem)] relative z-10"
      }>
        {renderContent()}
      </main>

      {activeView !== 'add-stock' && (
        <MobileBottomNavigation
          currentPage={
            activeView === 'browse-stock' ? 'browse' :
              (activeView === 'my-orders' || activeView === 'orders') ? 'orders' :
                activeView
          }
          onNavigate={(page) => {
            if (page === 'browse') navigateTo('browse-stock');
            else if (page === 'orders') {
              navigateTo('orders');
            }
            else navigateTo(page);
          }}
          cartItemCount={cartSummary?.totalItems || 0}
          notificationCount={notificationCount}
        />
      )}

      {/* Order Confirmation Dialog */}
      {confirmationOrderDetails && (
        <OrderConfirmationDialog
          isOpen={showOrderConfirmation}
          onClose={() => {
            setShowOrderConfirmation(false);
            setConfirmationOrderDetails(null);
          }}
          orderDetails={{
            ...confirmationOrderDetails,
            buyerName: user?.name || user?.company || 'Buyer',
            status: 'confirmed'
          }}
        />
      )}

      {/* Logistics Selection Dialog */}
      <LogisticsSelectionDialog
        isOpen={showLogisticsSelection}
        onClose={() => {
          setShowLogisticsSelection(false);
          setPendingOrderForLogistics(null);
        }}
        onConfirm={handleLogisticsConfirm}
        agents={logisticsAgents}
        cities={cities}
      />
    </div>
  );
}

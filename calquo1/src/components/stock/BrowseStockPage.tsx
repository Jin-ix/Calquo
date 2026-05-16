import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Grid, List, SortAsc, SortDesc, ShoppingCart, Eye, Package, ArrowLeft, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { BackButton } from '../layout/BackButton';
import { simpleTimeout } from '../utils/simple-timeout';
import { ConnectionStatus } from '../status/ConnectionStatus';
import { FirebaseStockStatus } from './FirebaseStockStatus';

import { useStock } from '../context/StockContext';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { EnhancedStockItem, getEffectivePrice, getAvailableColors, getAvailableSizes, getBestAvailableImage, getColorImagesForDisplay } from './EnhancedStockTypes';
import { ModernBuyerFocusedProductDetail } from './ModernBuyerFocusedProductDetail';
import { FilterPanel } from './FilterPanel';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// PERFORMANCE OPTIMIZATION: Constants
const INITIAL_LOAD_LIMIT = 20; // Show 20 items initially
const LOAD_MORE_BATCH = 20; // Load 20 more each time
const DEBOUNCE_DELAY = 300; // ms for search debounce

interface FilterState {
  colors: string[];
  sizes: string[];
  priceRange: [number, number];
  suppliers: string[];
  locations: string[];
  categories: string[];
  availability: 'all' | 'in_stock' | 'low_stock';
  itemType: 'all' | 'set_of_pattern' | 'single_color' | 'individual_flex';
}

interface BrowseStockPageProps {
  onNavigateBack?: () => void;
  onNavigateHome?: () => void;
  showBackButton?: boolean;
}

export function BrowseStockPage({ 
  onNavigateBack, 
  onNavigateHome, 
  showBackButton = true 
}: BrowseStockPageProps = {}) {
  const { allStock, isLoading, error, refreshStock } = useStock();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Helper to safely extract string from potentially object fields (category, supplier, etc)
  const getSafeString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object') {
      return value.name || value.id || 'N/A';
    }
    return String(value);
  };

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // OPTIMIZATION: Debounced search
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date' | 'supplier' | 'recently_added' | 'preferred' | 'location'>('preferred');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // OPTIMIZATION: Progressive loading
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LOAD_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // OPTIMIZATION: Always show products - load from cache immediately
  const [cachedStock, setCachedStock] = useState<EnhancedStockItem[]>([]);
  
  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem('allStock_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedStock(parsed);
          console.log('📦 Loaded', parsed.length, 'items from cache');
        }
      } catch (e) {
        console.warn('Failed to parse cache:', e);
      }
    }
  }, []);
  
  // OPTIMIZATION: Use cached stock if real stock is not loaded yet
  const displayStock = allStock.length > 0 ? allStock : cachedStock;
  
  // OPTIMIZATION: Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, DEBOUNCE_DELAY);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Listen for custom events from MobileHeader search
  React.useEffect(() => {
    const handleMobileSearch = (event: CustomEvent) => {
      if (event.detail !== undefined) {
        setSearchQuery(event.detail);
      }
    };
    
    window.addEventListener('mobile-search', handleMobileSearch as EventListener);
    return () => {
      window.removeEventListener('mobile-search', handleMobileSearch as EventListener);
    };
  }, []);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    colors: [],
    sizes: [],
    priceRange: [0, 10000],
    suppliers: [],
    locations: [],
    categories: [],
    availability: 'all',
    itemType: 'all'
  });

  // Modal states
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  
  const selectedStock = useMemo(() => {
    return allStock.find(stock => stock.id === selectedStockId) || null;
  }, [allStock, selectedStockId]);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // OPTIMIZATION: Compute filter options only when stock changes (not on every filter change)
  const filterOptions = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const suppliers = new Set<string>();
    const locations = new Set<string>();
    const categories = new Set<string>();

    // Safety check: ensure allStock is an array
    if (!Array.isArray(displayStock)) {
      console.warn('allStock is not an array:', displayStock);
      return {
        colors: [],
        sizes: [],
        suppliers: [],
        locations: [],
        categories: []
      };
    }

    // OPTIMIZATION: Only compute from visible stock, not all stock
    const stockToProcess = displayStock.slice(0, Math.min(displayStock.length, 200));
    
    stockToProcess.forEach(stock => {
      // Skip if stock is null/undefined
      if (!stock) return;
      
      // Defer expensive operations - handle potential object types
      const supplierName = getSafeString(stock.supplier);
      const locationName = getSafeString(stock.location);
      const categoryName = getSafeString(stock.category);
      
      if (supplierName) suppliers.add(supplierName);
      if (locationName) locations.add(locationName);
      if (categoryName) categories.add(categoryName);
      
      // OPTIMIZATION: Cache color/size extraction
      if (stock.colors && Array.isArray(stock.colors)) {
        stock.colors.forEach(c => {
          if (c?.name) colors.add(c.name);
        });
      }
      
      if (stock.sizes && Array.isArray(stock.sizes)) {
        stock.sizes.forEach(s => {
          if (s?.name) sizes.add(s.name);
        });
      }
    });

    return {
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      suppliers: Array.from(suppliers).sort(),
      locations: Array.from(locations).sort(),
      categories: Array.from(categories).sort()
    };
  }, [displayStock]);

  // OPTIMIZATION: Split filtering and sorting into cached steps
  const filteredStock = useMemo(() => {
    let filtered = displayStock.filter(stock => {
      // Handle potential object types for selective extraction
      const supplierName = getSafeString(stock.supplier);
      const locationName = getSafeString(stock.location);
      const categoryName = getSafeString(stock.category);

      // Search query filter - use debounced search
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = stock.name?.toLowerCase().includes(query) || false;
        const matchesCategory = categoryName.toLowerCase().includes(query) || false;
        const matchesSupplier = supplierName.toLowerCase().includes(query) || false;
        const matchesDescription = stock.description?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesCategory && !matchesSupplier && !matchesDescription) {
          return false;
        }
      }

      // OPTIMIZATION: Quick filters first (most selective)
      
      // Item type filter
      if (filters.itemType !== 'all' && stock.itemSetType !== filters.itemType) {
        return false;
      }

      // Supplier filter
      if (filters.suppliers.length > 0 && !filters.suppliers.includes(supplierName)) {
        return false;
      }

      // Location filter
      if (filters.locations.length > 0 && !filters.locations.includes(locationName)) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(categoryName)) {
        return false;
      }

      // OPTIMIZATION: Expensive filters last
      
      // Color filter (deferred)
      if (filters.colors.length > 0) {
        const stockColors = (stock.colors || []).map(c => c?.name).filter(Boolean);
        if (!filters.colors.some(color => stockColors.includes(color))) {
          return false;
        }
      }

      // Size filter (deferred)
      if (filters.sizes.length > 0) {
        const stockSizes = (stock.sizes || []).map(s => s?.name).filter(Boolean);
        if (!filters.sizes.some(size => stockSizes.includes(size))) {
          return false;
        }
      }

      // Price filter (deferred calculation)
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
        const effectivePrice = getEffectivePrice(stock, user?.role, user?.businessType);
        if (effectivePrice !== undefined && (effectivePrice < filters.priceRange[0] || effectivePrice > filters.priceRange[1])) {
          return false;
        }
      }

      // Availability filter
      if (filters.availability !== 'all') {
        const totalStock = (stock.combinations || []).reduce((sum, combo) => sum + (combo.availableQuantity || 0), 0);
        if (filters.availability === 'in_stock' && totalStock <= 0) {
          return false;
        }
        if (filters.availability === 'low_stock' && totalStock > 10) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [displayStock, debouncedSearch, filters, user]);

  // OPTIMIZATION: Sort in separate memo
  const filteredAndSortedStock = useMemo(() => {
    const sorted = [...filteredStock];
    
    sorted.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'price':
          aValue = getEffectivePrice(a, user?.role, user?.businessType);
          bValue = getEffectivePrice(b, user?.role, user?.businessType);
          break;
        case 'date':
        case 'recently_added':
          aValue = new Date(a.dateAdded);
          bValue = new Date(b.dateAdded);
          break;
        case 'supplier':
          aValue = getSafeString(a.supplier).toLowerCase() || '';
          bValue = getSafeString(b.supplier).toLowerCase() || '';
          break;
        case 'preferred': {
          let aScore = 0;
          let bScore = 0;
          
          const prefs = user?.profile?.preferences;
          if (prefs) {
            // Category match priority
            const aCategory = getSafeString(a.category);
            const bCategory = getSafeString(b.category);
            if (prefs.preferredCategories?.includes(aCategory)) aScore += 100;
            if (prefs.preferredCategories?.includes(bCategory)) bScore += 100;
            
            // Location match priority
            const aLocation = getSafeString(a.location).toLowerCase();
            const bLocation = getSafeString(b.location).toLowerCase();
            
            if (prefs.preferredLocation === 'local_city' && prefs.preferredCity) {
                const preferredCity = prefs.preferredCity.toLowerCase();
                if (aLocation.includes(preferredCity)) aScore += 50;
                if (bLocation.includes(preferredCity)) bScore += 50;
            } else if (prefs.preferredLocation === 'local_state' && prefs.preferredState) {
                const preferredState = prefs.preferredState.toLowerCase();
                if (aLocation.includes(preferredState)) aScore += 30;
                if (bLocation.includes(preferredState)) bScore += 30;
            }
          }
          
          // Base score
          aScore += a.supplierType === 'manufacturer' ? 10 : 0;
          bScore += b.supplierType === 'manufacturer' ? 10 : 0;
          
          // Add recency weight (newer is slightly better, adds small decimal fraction)
          const aTime = new Date(a.dateAdded).getTime();
          const bTime = new Date(b.dateAdded).getTime();
          aScore += (aTime / 10000000000000);
          bScore += (bTime / 10000000000000);

          aValue = aScore;
          bValue = bScore;
          break;
        }
        case 'location':
          aValue = getSafeString(a.location).toLowerCase() || '';
          bValue = getSafeString(b.location).toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredStock, sortBy, sortOrder, user]);

  // Handle add to cart from enhanced product detail
  const handleAddToCart = (variants: any[]) => {
    if (variants.length === 0) return;
    
    // Convert the variants to our cart format and show success
    variants.forEach(variant => {
      // Ensure we pass the variant as the stock item and its selected quantity
      // The variant from ModernBuyerFocusedProductDetail already has the necessary structure
      addToCart(variant, variant.quantity || 1);
    });
    
    setShowDetailPage(false);
  };

  // Get main image for stock item
  const getMainImage = (stock: EnhancedStockItem): string => {
    if (stock.mainImages && stock.mainImages.length > 0) {
      return stock.mainImages[0];
    }
    if (stock.colors.length > 0 && stock.colors[0].images.length > 0) {
      return stock.colors[0].images[0];
    }
    if (stock.colors.length > 0 && stock.colors[0].patternImage) {
      return stock.colors[0].patternImage;
    }
    return '';
  };

  // Get available stock count
  const getAvailableStock = (stock: EnhancedStockItem): number => {
    return stock.combinations.reduce((sum, combo) => sum + combo.availableQuantity, 0);
  };

  // Enhanced error handling with timeout detection
  const handleRefreshWithTimeout = async () => {
    try {
      toast.loading('Refreshing stock data...', { id: 'refresh-stock' });
      
      // Simple timeout with fallback
      await simpleTimeout(
        refreshStock(),
        15000,
        'Stock loading is taking too long. Please check your connection.'
      );
      
      toast.success('Stock data refreshed successfully', { id: 'refresh-stock' });
    } catch (error) {
      console.error('Error refreshing stock:', error);
      
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast.error('Connection timeout. Using cached data.', { id: 'refresh-stock' });
      } else {
        toast.error('Failed to refresh stock data', { id: 'refresh-stock' });
      }
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Navigation for error state */}
        {showBackButton && (
          <BackButton
            onBack={handleNavigateBack}
            onHome={handleNavigateHome}
            label="Back to previous page"
            variant="ghost"
            className="mb-4"
          />
        )}
        
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Stock Data</h3>
            <p className="text-destructive mb-4">
              {error.includes('timeout') || error.includes('timed out') 
                ? 'Connection timeout. Please check your internet connection and try again.'
                : `Error: ${error}`
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefreshWithTimeout} variant="outline">
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default navigation handlers
  const handleNavigateBack = onNavigateBack || (() => {
    // Try to go back in browser history within the app
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to reload or navigate to a default page
      window.location.hash = '#home';
    }
  });

  const handleNavigateHome = onNavigateHome || (() => {
    window.location.hash = '#home';
  });

  // Show enhanced product detail page when a product is selected
  if (showDetailPage && selectedStock) {
    return (
      <ModernBuyerFocusedProductDetail
        product={selectedStock}
        onBack={() => {
          setShowDetailPage(false);
          setSelectedStockId(null);
        }}
        onAddToCart={handleAddToCart}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-4 md:space-y-6">
      {/* Back Navigation - Desktop Only */}
      {showBackButton && (
        <div className="hidden md:block mb-4">
          <BackButton
            onBack={handleNavigateBack}
            label="Back to previous page"
            variant="ghost"
          />
        </div>
      )}

      {/* Quick Filter Chips */}


      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar - Hidden on mobile since MobileHeader has search */}
        <div className="hidden md:block flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by product name, category, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
            className="hidden md:flex"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recently_added">Recently Added</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="preferred">Preferred</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          isMobile={true}
          showMobileQuickFilters={true}
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-4 md:px-0">
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${filteredAndSortedStock.length} product${filteredAndSortedStock.length !== 1 ? 's' : ''} found`}
          </p>
          <ConnectionStatus showText={!isLoading} />
        </div>
        
        {filteredAndSortedStock.length === 0 && !isLoading && allStock.length > 0 && (
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setFilters({
              colors: [],
              sizes: [],
              priceRange: [0, 10000],
              suppliers: [],
              locations: [],
              categories: [],
              availability: 'all',
              itemType: 'all'
            });
          }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar - Desktop Only */}
        {showFilters && (
          <div className="w-80 flex-shrink-0 hidden md:block">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={filterOptions}
              isMobile={false}
            />
          </div>
        )}

        {/* Stock Grid/List */}
        <div className="flex-1 px-3 md:px-0">
          {/* ALWAYS SHOW PRODUCTS - Never block the UI */}
          {filteredAndSortedStock.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isLoading ? 'Loading products...' : 'No products found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isLoading 
                  ? 'Please wait while we fetch stock items from Firebase'
                  : displayStock.length === 0 
                    ? "No stock items are currently available"
                    : "Try adjusting your search or filters to find what you're looking for"
                }
              </p>
              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              {!isLoading && displayStock.length === 0 && (
                <Button onClick={refreshStock} variant="outline">
                  Refresh Stock
                </Button>
              )}
            </Card>
          ) : (
            <>
              {/* Show subtle loading indicator at top if syncing */}
              {isLoading && allStock.length === 0 && cachedStock.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800">Syncing with Firebase...</p>
                </div>
              )}
              
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredAndSortedStock.slice(0, displayLimit).map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    viewMode={viewMode}
                    onViewDetails={() => {
                      setSelectedStockId(stock.id);
                      setShowDetailPage(true);
                    }}
                    userRole={user?.role}
                    businessType={user?.businessType}
                    currentUser={user}
                  />
                ))}
              </div>
              
              {/* Load More Button */}
              {filteredAndSortedStock.length > displayLimit && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => {
                      setDisplayLimit(prev => prev + LOAD_MORE_BATCH);
                      setIsLoadingMore(true);
                      setTimeout(() => setIsLoadingMore(false), 500);
                    }}
                    variant="outline"
                    size="lg"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      `Load More (${filteredAndSortedStock.length - displayLimit} remaining)`
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Product Detail is rendered as a full page above when showDetailPage is true */}
    </div>
  );
}

// Stock Card Component
interface StockCardProps {
  stock: EnhancedStockItem;
  viewMode: 'grid' | 'list';
  onViewDetails: () => void;
  userRole?: string;
  businessType?: string;
  currentUser?: any;
}

function StockCard({ stock, viewMode, onViewDetails, userRole, businessType, currentUser }: StockCardProps) {
  // Helper to safely extract string from potentially object fields
  const getSafeString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object') {
      return value.name || value.id || 'N/A';
    }
    return String(value);
  };

  const mainImage = getBestAvailableImage(stock);
  const availableStock = stock.combinations.reduce((sum, combo) => sum + combo.availableQuantity, 0);
  
  // Check if this is the user's own product
  const sellerId = (stock as any).sellerId || (stock as any).supplierId;
  const userCompany = currentUser?.company || currentUser?.profile?.company;
  const isMyProduct = (currentUser?.id && sellerId && currentUser.id === sellerId) || 
                      (userCompany && stock.supplier && userCompany === stock.supplier);
  
  // OPTIMIZATION: Removed debug console logs for production performance
  
  const displayPrice = getEffectivePrice(stock, userRole, businessType, isMyProduct) || stock.basePrice || (stock as any).price;
  const priceLabel = hasOffer ? 'offer price' : 'effective price';
  
  const hasOffer = stock.offerPrice != null && stock.offerPrice > 0 && stock.basePrice && stock.offerPrice < stock.basePrice;
  const colorImages = getColorImagesForDisplay(stock);
  const availableSizes = getAvailableSizes(stock);
  
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex">
          <div className="w-32 h-32 flex-shrink-0">
            <ImageWithFallback
              src={mainImage}
              alt={stock.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <CardContent className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold line-clamp-1">{stock.name}</h3>
                <p className="text-sm text-muted-foreground">{getSafeString(stock.category)}</p>
                <p className="text-sm text-muted-foreground">{getSafeString(stock.supplier)} • {getSafeString(stock.location)}</p>
                
                {/* Color Images Preview */}
                {colorImages.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {colorImages.slice(0, 5).map((colorData) => (
                      <div
                        key={colorData.colorId}
                        className="w-6 h-6 rounded border border-gray-300 flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: colorData.colorCode || '#f3f4f6' }}
                        title={colorData.colorName || 'Color'}
                      >
                        {(colorData.image || colorData.patternImage) && (
                          <ImageWithFallback
                            src={(colorData.image || colorData.patternImage)!}
                            alt={colorData.colorName || 'Color'}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {colorImages.length > 5 && (
                      <div className="w-6 h-6 rounded border border-gray-300 bg-muted flex items-center justify-center text-xs">
                        +{colorImages.length - 5}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  {isMyProduct && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                      My Product
                    </Badge>
                  )}
                  <Badge variant={stock.itemSetType === 'set_of_pattern' ? 'default' : 'secondary'}>
                    {stock.itemSetType.replace('_', ' ')}
                  </Badge>
                  <Badge variant={availableStock > 0 ? 'default' : 'destructive'}>
                    {availableStock} in stock
                  </Badge>
                  {hasOffer && (
                    <Badge className="bg-pastel-orange text-pastel-orange-text">
                      Offer
                    </Badge>
                  )}
                </div>

                {/* Important Details Section */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">Fabric:</span> {stock.fabricType || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">Delivery:</span> {stock.deliveryTime || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">MOQ:</span> {stock.minOrderQuantity || 1}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">Location:</span> {stock.location || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {displayPrice !== undefined ? (
                  <>
                    <div className="flex items-center gap-2">
                      {hasOffer && stock.offerPrice && (
                        <span className="text-sm text-pastel-green-text">
                          ₹{stock.offerPrice} offer
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-lg">₹{displayPrice.toLocaleString()}</span>
                    <p className="text-xs text-muted-foreground">{priceLabel}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Price on request</p>
                )}
                
                <Button onClick={onViewDetails} className="mt-2" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group h-full flex flex-col border-gray-200">
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
        <ImageWithFallback
          key={mainImage || 'no-image'}
          src={mainImage || ''}
          alt={stock.name || 'Stock Item'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
           {isMyProduct && (
            <Badge className="bg-blue-600/90 text-white shadow-sm border-0 backdrop-blur-sm">
              My Product
            </Badge>
           )}
           {hasOffer && stock.offerPrice != null && (
            <Badge className="bg-red-500/90 text-white shadow-sm border-0 backdrop-blur-sm">
              {`₹${stock.offerPrice} Offer`}
            </Badge>
           )}
        </div>

        <div className="absolute top-2 right-2 z-10">
          <Badge variant={availableStock > 0 ? 'default' : 'destructive'} className="shadow-sm">
            {availableStock > 0 ? `${availableStock} left` : 'Out of Stock'}
          </Badge>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              variant="secondary"
              className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 font-semibold shadow-lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Quick View
            </Button>
        </div>
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">{getSafeString(stock.category)}</p>
                <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 mb-1 min-h-[1.25rem]">{stock.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-1">{getSafeString(stock.supplier)}</p>
             </div>
             <div className="text-right pl-2">
                {displayPrice !== undefined ? (
                  <div className="flex flex-col items-end">
                    {hasOffer && stock.offerPrice && (
                       <span className="text-xs text-muted-foreground line-through">₹{displayPrice}</span>
                    )}
                    {(hasOffer && stock.offerPrice ? stock.offerPrice : displayPrice) > 0 ? (
                      <span className={`font-bold text-lg ${hasOffer ? 'text-red-600' : 'text-primary'}`}>
                        ₹{hasOffer && stock.offerPrice ? stock.offerPrice : displayPrice}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-primary">Ask for Price</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-medium text-gray-500">Price on Request</span>
                )}
             </div>
          </div>
        </div>
        
        {/* Important Info Grid */}
        <div className="mt-auto pt-3 border-t border-gray-100">
           <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs mb-3">
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-gray-400 font-semibold">Fabric</span>
                 <span className="text-gray-700 font-medium truncate" title={stock.fabricType}>{stock.fabricType || '-'}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-gray-400 font-semibold">MOQ</span>
                 <span className="text-gray-700 font-medium">{stock.minOrderQuantity || 1} pcs</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-gray-400 font-semibold">Sizes</span>
                 <span className="text-gray-700 font-medium truncate" title={availableSizes.map(s => s.name).join(', ')}>
                    {availableSizes.length > 0 ? availableSizes.map(s => s.name).join(', ') : '-'}
                 </span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase text-gray-400 font-semibold">Location</span>
                 <span className="text-gray-700 font-medium truncate" title={getSafeString(stock.location)}>{getSafeString(stock.location) || '-'}</span>
              </div>
           </div>

           {/* Color Previews */}
           {colorImages.length > 0 && (
              <div className="flex items-center gap-1.5">
                {colorImages.slice(0, 5).map((colorData, i) => (
                  <div
                    key={colorData.colorId || i}
                    className="w-6 h-6 rounded-md border border-gray-200 overflow-hidden relative shadow-sm"
                    title={colorData.colorName}
                  >
                    {(colorData.image || colorData.patternImage) ? (
                      <ImageWithFallback
                        src={(colorData.image || colorData.patternImage)!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full"
                        style={{ backgroundColor: colorData.colorCode || '#f0f0f0' }}
                      />
                    )}
                  </div>
                ))}
                {colorImages.length > 5 && (
                  <span className="text-xs text-muted-foreground font-medium pl-1">
                    +{colorImages.length - 5} more
                  </span>
                )}
              </div>
           )}
        </div>

        <Button onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
        }} className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white shadow-none">
            View Details
        </Button>
      </CardContent>
    </Card>
  );
}

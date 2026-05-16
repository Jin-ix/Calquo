/**
 * CALIQUO - Enhanced Browse Stock Page with Purchase Integration
 * Complete purchasing flow with Razorpay payment
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc, 
  Package,
  RefreshCw,
  X
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { BackButton } from '../layout/BackButton';
import { ConnectionStatus } from '../status/ConnectionStatus';
import { useStock } from '../context/StockContext';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { EnhancedStockItem, getEffectivePrice } from './EnhancedStockTypes';
import { EnhancedStockCard } from './EnhancedStockCard';
import { PurchaseModal } from './PurchaseModal';
import { FilterPanel } from './FilterPanel';
import { EnhancedModernProductDetail } from './EnhancedModernProductDetail';

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

interface EnhancedBrowseStockPageProps {
  onNavigateBack?: () => void;
  onNavigateHome?: () => void;
  showBackButton?: boolean;
}

export function EnhancedBrowseStockPage({ 
  onNavigateBack, 
  onNavigateHome, 
  showBackButton = true 
}: EnhancedBrowseStockPageProps = {}) {
  const { allStock, isLoading, error, refreshStock } = useStock();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Helper to safely extract string from potentially object fields
  const getSafeString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object') {
      return value.name || value.id || 'N/A';
    }
    return String(value);
  };

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date' | 'supplier' | 'recently_added'>('recently_added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const selectedItem = useMemo(() => {
    return allStock.find(stock => stock.id === selectedItemId) || null;
  }, [allStock, selectedItemId]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const suppliers = new Set<string>();
    const locations = new Set<string>();
    const categories = new Set<string>();

    allStock.forEach(stock => {
      stock.colors.forEach(color => {
        if (color.name) colors.add(color.name);
      });
      stock.sizes.forEach(size => sizes.add(size.name));
      
      const supplierName = getSafeString(stock.supplier);
      const locationName = getSafeString(stock.location);
      const categoryName = getSafeString(stock.category);
      
      if (supplierName) suppliers.add(supplierName);
      if (locationName) locations.add(locationName);
      if (categoryName) categories.add(categoryName);
    });

    return {
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      suppliers: Array.from(suppliers).sort(),
      locations: Array.from(locations).sort(),
      categories: Array.from(categories).sort()
    };
  }, [allStock]);

  // Filter and sort stock
  const filteredAndSortedStock = useMemo(() => {
    let filtered = allStock.filter(stock => {
      const categoryName = getSafeString(stock.category);
      const supplierName = getSafeString(stock.supplier);
      const locationName = getSafeString(stock.location);

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = stock.name?.toLowerCase().includes(query);
        const matchesCategory = categoryName.toLowerCase().includes(query);
        const matchesSupplier = supplierName.toLowerCase().includes(query);
        const matchesDescription = stock.description?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesCategory && !matchesSupplier && !matchesDescription) {
          return false;
        }
      }

      // Color filter
      if (filters.colors.length > 0) {
        const stockColors = stock.colors.map(c => c.name).filter(Boolean);
        if (!filters.colors.some(color => stockColors.includes(color))) {
          return false;
        }
      }

      // Size filter
      if (filters.sizes.length > 0) {
        const stockSizes = stock.sizes.map(s => s.name);
        if (!filters.sizes.some(size => stockSizes.includes(size))) {
          return false;
        }
      }

      // Price filter
      const effectivePrice = getEffectivePrice(stock, user?.role, user?.businessType);
      if (effectivePrice < filters.priceRange[0] || effectivePrice > filters.priceRange[1]) {
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

      // Item type filter
      if (filters.itemType !== 'all' && stock.itemSetType !== filters.itemType) {
        return false;
      }

      // Availability filter
      if (filters.availability !== 'all') {
        const totalStock = stock.combinations.reduce((sum, combo) => sum + combo.availableQuantity, 0);
        if (filters.availability === 'in_stock' && totalStock <= 0) {
          return false;
        }
        if (filters.availability === 'low_stock' && totalStock > 10) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
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
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allStock, searchQuery, filters, sortBy, sortOrder, user]);

  // Handle purchase button click
  const handlePurchaseClick = (item: EnhancedStockItem) => {
    // Check if user is authenticated and has correct role
    if (!user) {
      toast.error('Please login to make a purchase');
      return;
    }

    if (user.role === 'manufacturer') {
      toast.error('Manufacturers cannot make purchases');
      return;
    }

    if (user.role !== 'retailer' && user.role !== 'trader') {
      toast.error('Only retailers and traders can make purchases');
      return;
    }

    setSelectedItemId(item.id);
    setShowPurchaseModal(true);
  };

  // Handle successful payment
  const handlePaymentSuccess = async (orderId: string) => {
    setShowPurchaseModal(false);
    setSelectedItemId(null);
    
    toast.success('Order placed successfully!', {
      description: `Order ID: ${orderId}`,
      duration: 5000,
    });

    // Refresh stock to update quantities
    await refreshStock();
  };

  // Clear all filters
  const handleClearFilters = () => {
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
  };

  // Navigation handlers
  const handleNavigateBack = onNavigateBack || (() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#home';
    }
  });

  const handleNavigateHome = onNavigateHome || (() => {
    window.location.hash = '#home';
  });

  // Show product detail page
  if (showDetailPage && selectedItem) {
    return (
      <EnhancedModernProductDetail
        product={selectedItem}
        onBack={() => {
          setShowDetailPage(false);
          setSelectedItemId(null);
        }}
        onPurchaseRequest={(request) => {
          setShowDetailPage(false);
          handlePurchaseClick(selectedItem);
        }}
        onAddToCart={(variants) => {
          if (variants.length === 0) return;
          
          variants.forEach(variant => {
            addToCart(variant, variant.quantity || 1);
          });
          
          setShowDetailPage(false);
        }}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
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
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => refreshStock()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Navigation */}
      {showBackButton && (
        <BackButton
          onBack={handleNavigateBack}
          onHome={handleNavigateHome}
          label="Back to Dashboard"
          variant="ghost"
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
          Browse Stock
        </h1>
        <p className="text-muted-foreground">
          Discover quality apparel from verified manufacturers and traders
        </p>
      </motion.div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by product name, category, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-white/80 backdrop-blur-sm border-gray-200/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters Button */}
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.categories.length > 0 || filters.suppliers.length > 0) && (
              <Badge variant="secondary" className="ml-1">
                {filters.categories.length + filters.suppliers.length}
              </Badge>
            )}
          </Button>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-36 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recently_added">Recently Added</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-white/80 backdrop-blur-sm"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border bg-white/80 backdrop-blur-sm">
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

      {/* Results Summary & Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {isLoading 
              ? 'Loading...' 
              : `${filteredAndSortedStock.length} product${filteredAndSortedStock.length !== 1 ? 's' : ''} found`
            }
          </p>
          <ConnectionStatus showText={!isLoading} />
        </div>
        
        {filteredAndSortedStock.length === 0 && !isLoading && allStock.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar - Desktop */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-80 flex-shrink-0 hidden md:block"
            >
              <div className="sticky top-6">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  filterOptions={filterOptions}
                  isMobile={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stock Grid/List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Package className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <p className="text-muted-foreground mt-4">Loading stock data...</p>
                </div>
              </div>
              
              {/* Skeleton Loaders */}
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="animate-pulse">
                      <div className="bg-muted aspect-square w-full" />
                      <CardContent className="p-4 space-y-3">
                        <div className="bg-muted h-4 w-3/4 rounded" />
                        <div className="bg-muted h-3 w-1/2 rounded" />
                        <div className="bg-muted h-4 w-1/3 rounded" />
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : filteredAndSortedStock.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {allStock.length === 0 
                    ? "No stock items are currently available"
                    : "Try adjusting your search or filters"
                  }
                </p>
                {allStock.length === 0 && (
                  <Button onClick={() => refreshStock()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Stock
                  </Button>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }
            >
              {filteredAndSortedStock.map((stock, index) => (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <EnhancedStockCard
                    stock={stock}
                    onPurchase={handlePurchaseClick}
                    onViewDetails={(item) => {
                      setSelectedItemId(item.id);
                      setShowDetailPage(true);
                    }}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        item={selectedItem}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Mobile Filters Sheet */}
      {showFilters && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={filterOptions}
              isMobile={true}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

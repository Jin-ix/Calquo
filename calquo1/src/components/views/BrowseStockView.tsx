/**
 * BrowseStockView - Global Stock Discovery with Preference-Based Filtering
 *
 * Features:
 * - Reads user preferences set during registration (categories, dress type, location)
 * - Pre-applies preference filters on first load (can be dismissed)
 * - Client-side debounced search and additional manual filtering
 * - Responsive grid/list layout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Grid, List, RefreshCw, Package, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useStock } from '../context/StockContext';
import { useAuth } from '../auth/AuthProvider';

interface BrowseStockViewProps {
  onViewDetails?: (stock: any) => void;
  onAddToCart?: (stock: any) => void;
}

export function BrowseStockView({ onViewDetails, onAddToCart }: BrowseStockViewProps) {
  const { allStock, isLoading, error, refreshStock } = useStock();
  const { user } = useAuth();

  // Read preferences from logged-in user
  const userPrefs = user?.profile?.preferences;

  // Filter and search state — pre-populate from preferences
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'recent' | 'supplier' | 'preference'>('preference');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [prefFiltersActive, setPrefFiltersActive] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract unique categories and suppliers for filters
  const { categories, suppliers } = useMemo(() => {
    const cats = new Set<string>();
    const sups = new Set<string>();
    allStock.forEach(stock => {
      if (stock.category) cats.add(stock.category);
      if (stock.supplier || stock.seller_company) sups.add(stock.supplier || stock.seller_company);
    });
    return {
      categories: Array.from(cats).sort(),
      suppliers: Array.from(sups).sort()
    };
  }, [allStock]);

  // ── Preference matching score helper ─────────────────────────────────────
  const getPreferenceScore = (stock: any): number => {
    if (!userPrefs || !prefFiltersActive) return 0;
    let score = 0;
    const prefCats: string[] = userPrefs.preferredCategories || [];
    const prefDress = (userPrefs.preferredDressType || '').toLowerCase();
    const prefCity  = (userPrefs.preferredSellerLocation || '').toLowerCase();
    const prefLoc   = userPrefs.preferredLocation || 'all';

    // Category match
    if (prefCats.length > 0 && prefCats.some(c => c.toLowerCase() === (stock.category || '').toLowerCase())) {
      score += 3;
    }
    // Dress type keyword match
    if (prefDress) {
      const haystack = `${stock.name} ${stock.category} ${stock.fabricType || ''}`.toLowerCase();
      if (haystack.includes(prefDress)) score += 2;
    }
    // City match
    if (prefLoc === 'local_city' && prefCity) {
      const stockCity = (stock.supplier_city || stock.city || '').toLowerCase();
      if (stockCity === prefCity) score += 3;
    }
    return score;
  };

  // ── Client-side filtering and sorting ────────────────────────────────────
  const filteredAndSortedStock = useMemo(() => {
    let filtered = [...allStock];

    // Search filter (debounced)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(stock => {
        const name        = (stock.name || '').toLowerCase();
        const category    = (stock.category || '').toLowerCase();
        const supplier    = (stock.supplier || stock.seller_company || '').toLowerCase();
        const description = (stock.description || '').toLowerCase();
        return name.includes(query) || category.includes(query) || supplier.includes(query) || description.includes(query);
      });
    }

    // Preference-based category filter (soft — shows preferred first, doesn't hide others)
    // Only hard-filter if the user chose a specific category manually
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(stock => stock.category === selectedCategory);
    } else if (prefFiltersActive && userPrefs?.preferredCategories?.length) {
      // Soft: still show all, but scored
    }

    // Supplier filter
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter(stock =>
        (stock.supplier === selectedSupplier) || (stock.seller_company === selectedSupplier)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'preference':
          return getPreferenceScore(b) - getPreferenceScore(a);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'supplier':
          return (a.supplier || a.seller_company || '').localeCompare(b.supplier || b.seller_company || '');
        case 'recent':
        default:
          return 0;
      }
    });

    return filtered;
  }, [allStock, debouncedSearch, selectedCategory, selectedSupplier, sortBy, prefFiltersActive, userPrefs]);

  const hasPreferences = !!(
    userPrefs &&
    (
      (userPrefs.preferredCategories && userPrefs.preferredCategories.length > 0) ||
      userPrefs.preferredDressType ||
      userPrefs.preferredSellerLocation
    )
  );

  // Handle refresh
  const handleRefresh = () => {
    toast.success('Refreshing stock data...');
    refreshStock();
  };



  // Loading state
  if (isLoading && allStock.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Browse Stock</h1>
          <Badge variant="outline">Loading...</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="animate-pulse">
                <div className="bg-muted h-48 w-full" />
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
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Browse Stock</h1>
        </div>
        
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Stock Data</h3>
            <p className="text-sm text-crimson mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Browse Stock</h1>
            {hasPreferences && prefFiltersActive && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 animate-pulse">
                <Sparkles className="h-3 w-3" />
                Personalized
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedStock.length} items available
            {isLoading && ' • Syncing...'}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, category, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Supplier Filter */}
        <div className="md:col-span-2">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger>
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(sup => (
                <SelectItem key={sup} value={sup}>{sup}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="md:col-span-2">
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hasPreferences && (
                <SelectItem value="preference">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Personalized for You
                  </div>
                </SelectItem>
              )}
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="md:col-span-1 flex rounded-lg border">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none flex-1"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none flex-1"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(debouncedSearch || selectedCategory !== 'all' || selectedSupplier !== 'all' || (hasPreferences && prefFiltersActive)) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {hasPreferences && prefFiltersActive && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200 transition-colors">
              <Sparkles className="h-3 w-3 mr-1 text-amber-600" />
              Smart Recommendations
              <button
                onClick={() => {
                  setPrefFiltersActive(false);
                  if (sortBy === 'preference') setSortBy('recent');
                }}
                className="ml-2 text-xs hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {debouncedSearch && (
            <Badge variant="secondary">
              Search: "{debouncedSearch}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 text-xs hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary">
              {selectedCategory}
              <button
                onClick={() => setSelectedCategory('all')}
                className="ml-2 text-xs hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedSupplier !== 'all' && (
            <Badge variant="secondary">
              {selectedSupplier}
              <button
                onClick={() => setSelectedSupplier('all')}
                className="ml-2 text-xs hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedSupplier('all');
              setPrefFiltersActive(false);
              if (sortBy === 'preference') setSortBy('recent');
            }}
            className="text-xs h-7"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Stock Grid/List */}
      {filteredAndSortedStock.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Stock Items Found</h3>
          <p className="text-muted-foreground mb-4">
            {allStock.length === 0
              ? 'No stock items are currently available. Be the first to add stock!'
              : 'Try adjusting your search or filters to find what you\'re looking for.'}
          </p>
          {(debouncedSearch || selectedCategory !== 'all' || selectedSupplier !== 'all') && (
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedSupplier('all');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredAndSortedStock.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              viewMode={viewMode}
              onViewDetails={() => onViewDetails?.(stock)}
              onAddToCart={() => onAddToCart?.(stock)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Stock Card Component
interface StockCardProps {
  stock: any;
  viewMode: 'grid' | 'list';
  onViewDetails?: () => void;
  onAddToCart?: () => void;
}

function StockCard({ stock, viewMode, onViewDetails, onAddToCart }: StockCardProps) {
  const mainImage = stock.images?.[0] || stock.mainImages?.[0] || '';
  const price = stock.price || 0;
  const quantity = stock.quantity || 0;
  const supplier = stock.supplier || stock.seller_company || 'Unknown';
  
  console.log('🖼️ StockCard Image Debug:', {
    stockId: stock.id,
    stockName: stock.name,
    mainImage,
    allImages: stock.images,
    mainImages: stock.mainImages,
    isBlobUrl: mainImage.startsWith('blob:')
  });

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex">
          <div className="w-32 h-32 flex-shrink-0 bg-muted">
            {mainImage && (
              <img
                src={mainImage}
                alt={stock.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <CardContent className="flex-1 p-4 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-1">{stock.name}</h3>
              <p className="text-sm text-muted-foreground">{stock.category}</p>
              <p className="text-sm text-muted-foreground">{supplier}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={quantity > 0 ? 'default' : 'destructive'}>
                  {quantity} in stock
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">₹{price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">per piece</p>
              <Button onClick={onViewDetails} size="sm" className="mt-2">
                View Details
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-square relative overflow-hidden bg-muted">
        {mainImage ? (
          <img
            src={mainImage}
            alt={stock.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={quantity > 0 ? 'default' : 'destructive'}>
            {quantity} left
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-1">{stock.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{stock.category}</p>
        <p className="text-sm text-muted-foreground line-clamp-1">{supplier}</p>
        
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="font-bold">₹{price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">per piece</p>
          </div>
          <Button onClick={onViewDetails} size="sm">
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

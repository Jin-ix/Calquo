/**
 * MyStockView - User-Specific Stock with Firebase Real-time Sync
 * 
 * Features:
 * - Real-time Firebase onSnapshot listener filtered by sellerId
 * - Automatically updates when AddStockWizard creates new items
 * - Edit and delete capabilities for user's own stock
 * - Loading indicators and graceful error recovery
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, Plus, Edit, Trash2, RefreshCw, Grid, List, CheckSquare, Square, X as XIcon, Archive, PlayCircle, PauseCircle, Check, Filter, SortAsc, SortDesc, Eye, Layers, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { useStock } from '../context/StockContext';
import { listenToCollection, where, orderBy, deleteDocument, or } from '../../utils/firebase/firestore';
import { Unsubscribe, and } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface MyStockViewProps {
  onAddStock?: () => void;
  onEditStock?: (stock: any) => void;
  onViewDetails?: (stock: any) => void;
}

export function MyStockView({ onAddStock, onEditStock, onViewDetails }: MyStockViewProps) {
  const { user } = useAuth();
  const { bulkDeleteStock, bulkUpdateStockStatus } = useStock();
  const [myStock, setMyStock] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'recent' | 'quantity'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'draft'>('active');
  const [showFilters, setShowFilters] = useState(false);

  // Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);

  // Delete confirmation dialog
  const [stockToDelete, setStockToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Firebase real-time listener for user's stock
  useEffect(() => {
    console.log("Starting listener");
    if (!user?.id) {
      setIsLoading(false);
      setError('User not authenticated');
      return;
    }

    let unsubscribe: Unsubscribe | null = null;

    const setupListener = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Bypassing strict Firebase check as we're using the Supabase shim
        const { isFirebaseDemoMode } = await import('../../utils/firebase/config');

        if (isFirebaseDemoMode) {
          console.warn('⚠️ MyStock: Running in Demo Mode');
          setIsLoading(false);
          setMyStock([]);
          return;
        }

        console.log('🔵 Setting up MyStock listener for user:', user.id);

        // Listen to stock items where sellerId matches current user OR supplierId (legacy) matches
        // Using 'or' allows fetching old items that haven't been migrated yet
        unsubscribe = listenToCollection(
          'stock_items',
          [
            // Updated to use gst_number to match Supabase schema and AddStockWizard logic
            where('gst_number', '==', user.id)
          ],
          (data) => {
            // Sort client side (newest first)
            if (Array.isArray(data)) {
              data.sort((a, b) => {
                // Supabase uses created_at (string or timestamp)
                const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return tB - tA;
              });
            }

            console.log('✅ MyStock update received:', data?.length || 0, 'items for user', user.id, 'status:', statusFilter);

            // Ensure data is always an array and filter out any invalid items
            const safeData = Array.isArray(data)
              ? data.filter(item => item && typeof item === 'object' && item.id)
              : [];

            // Log each item for debugging
            if (safeData.length > 0) {
              console.log('📦 Stock items:', safeData.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                hasQuantity: typeof item.quantity === 'number',
                hasPrice: typeof item.price === 'number'
              })));
            }

            setMyStock(safeData);
            setIsLoading(false);
            setError(null);
          }
        );
      } catch (err: any) {
        console.error('❌ Error setting up MyStock listener:', err);
        setError(err.message || 'Failed to load your stock');
        setIsLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount or user change
    return () => {
      if (unsubscribe) {
        console.log('Stopping listener');
        unsubscribe();
      }
    };
  }, [user, statusFilter]);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    myStock.forEach(stock => {
      if (stock.category) cats.add(stock.category);
    });
    return Array.from(cats).sort();
  }, [myStock]);

  // Client-side filtering and sorting with defensive checks
  const filteredAndSortedStock = useMemo(() => {
    try {
      // Ensure myStock is always an array
      const safeStock = Array.isArray(myStock) ? myStock : [];
      let filtered = [...safeStock];

      // Search filter (debounced)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        filtered = filtered.filter(stock => {
          if (!stock || typeof stock !== 'object') return false;

          const name = (stock.name || '').toLowerCase();
          const category = (stock.category || '').toLowerCase();
          const description = (stock.description || '').toLowerCase();

          return name.includes(query) ||
            category.includes(query) ||
            description.includes(query);
        });
      }

      // Category filter
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(stock => stock && stock.category === selectedCategory);
      }

      // Sorting
      filtered.sort((a, b) => {
        if (!a || !b) return 0;

        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'price':
            comparison = (a.price || 0) - (b.price || 0);
            break;
          case 'quantity':
            comparison = (a.quantity || 0) - (b.quantity || 0);
            break;
          case 'recent':
          default:
            // For recent, we want new items (higher timestamp) first by default
            // Supabase uses created_at string
            const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
            comparison = tA - tB;
            break;
        }

        // Apply sort order (descending by default for 'recent', ascending for others usually)
        if (sortBy === 'recent') {
          return sortOrder === 'desc' ? -comparison : comparison; // Recent: Desc means newest first (high timestamp)
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      return filtered;
    } catch (err) {
      console.error('Error filtering/sorting stock:', err);
      return [];
    }
  }, [myStock, debouncedSearch, selectedCategory, sortBy]);

  // Selection handlers
  const toggleStockSelection = (stockId: string) => {
    setSelectedStockIds(prev =>
      prev.includes(stockId)
        ? prev.filter(id => id !== stockId)
        : [...prev, stockId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStockIds.length === filteredAndSortedStock.length) {
      setSelectedStockIds([]);
    } else {
      setSelectedStockIds(filteredAndSortedStock.map(s => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedStockIds.length} items?`)) {
      if (await bulkDeleteStock(selectedStockIds)) {
        setSelectedStockIds([]);
        setIsSelectionMode(false);
      }
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    if (await bulkUpdateStockStatus(selectedStockIds, status)) {
      setSelectedStockIds([]);
      setIsSelectionMode(false);
    }
  };

  // Handle delete stock
  const handleDeleteStock = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent dialog from closing immediately

    if (!stockToDelete) return;

    if (!stockToDelete.id) {
      toast.error('Error: Stock item has no ID');
      setStockToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting stock item:', stockToDelete.id);
      const success = await deleteDocument('stock_items', stockToDelete.id);

      if (success) {
        toast.success('Stock item deleted successfully! 🎉');
        setStockToDelete(null); // Close dialog manually
      } else {
        // If success is false, deleteDocument caught the error and logged it
        toast.error('Failed to delete stock item. Please check your connection and try again.');
      }
    } catch (err: any) {
      console.error('❌ Error deleting stock:', err);
      // Fallback for unexpected errors that bubble up
      const msg = err.message?.toLowerCase() === 'internal'
        ? 'Internal error. Please refresh and try again.'
        : (err.message || 'Failed to delete stock item');
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total stock value with defensive checks
  const totalValue = useMemo(() => {
    try {
      // Ensure myStock is an array before reducing
      const safeStock = Array.isArray(myStock) ? myStock : [];
      if (safeStock.length === 0) return 0;

      return safeStock.reduce((sum, stock) => {
        // Ensure stock is an object with valid properties
        if (!stock || typeof stock !== 'object') {
          console.warn('Invalid stock item in reduce:', stock);
          return sum;
        }

        const price = typeof stock.price === 'number' ? stock.price : 0;
        const quantity = typeof stock.quantity === 'number' ? stock.quantity : 0;
        return sum + (price * quantity);
      }, 0);
    } catch (err) {
      console.error('Error calculating totalValue:', err);
      return 0;
    }
  }, [myStock]);

  const totalQuantity = useMemo(() => {
    try {
      // Ensure myStock is an array before reducing
      const safeStock = Array.isArray(myStock) ? myStock : [];
      if (safeStock.length === 0) return 0;

      return safeStock.reduce((sum, stock) => {
        // Ensure stock is an object with valid properties
        if (!stock || typeof stock !== 'object') {
          console.warn('Invalid stock item in reduce:', stock);
          return sum;
        }

        const quantity = typeof stock.quantity === 'number' ? stock.quantity : 0;
        return sum + quantity;
      }, 0);
    } catch (err) {
      console.error('Error calculating totalQuantity:', err);
      return 0;
    }
  }, [myStock]);

  // Loading state
  if (isLoading && myStock.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Stock</h1>
          <Badge variant="outline">Loading...</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
  if (error && myStock.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Stock</h1>
        </div>

        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Your Stock</h3>
            <p className="text-sm text-crimson mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">My Stock Hub</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {filteredAndSortedStock.length} items • {totalQuantity.toLocaleString()} pieces • ₹{totalValue.toLocaleString()} total value
            {isLoading && ' • Syncing...'}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Button onClick={onAddStock} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all rounded-full px-6 py-5 font-semibold">
            <Plus className="w-5 h-5" />
            Add New Stock
          </Button>
        </motion.div>
      </div>

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-xl border rounded-lg p-2 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-3 border-r mr-2">
            <span className="font-medium text-sm">{selectedStockIds.length} selected</span>
            <Button variant="ghost" size="sm" onClick={() => {
              setIsSelectionMode(false);
              setSelectedStockIds([]);
            }} className="h-6 w-6 p-0">
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('active')} disabled={selectedStockIds.length === 0}>
            <PlayCircle className="h-4 w-4 mr-2 text-green-600" />
            Set Active
          </Button>

          <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('inactive')} disabled={selectedStockIds.length === 0}>
            <PauseCircle className="h-4 w-4 mr-2 text-orange-600" />
            Set Inactive
          </Button>

          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={selectedStockIds.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
        {[
          { label: 'Total Items', value: myStock.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-500/10 to-transparent' },
          { label: 'Total Pieces', value: totalQuantity.toLocaleString(), icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500/10 to-transparent' },
          { label: 'Inventory Value', value: `₹${totalValue.toLocaleString()}`, icon: IndianRupee, color: 'text-violet-600', bg: 'bg-violet-50', gradient: 'from-violet-500/10 to-transparent' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
          >
            <Card className="relative overflow-hidden bg-white/60 backdrop-blur-2xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-bl ${stat.gradient} rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500`} />
              <CardContent className="p-6 relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="active">Active Stock</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          {/* Selection Mode Toggle */}
          <Button
            variant={isSelectionMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedStockIds([]);
            }}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {isSelectionMode ? 'Cancel Selection' : 'Select'}
          </Button>

          {/* Select All (Only visible in selection mode) */}
          {isSelectionMode && (
            <div className="flex items-center px-2">
              <Checkbox
                checked={selectedStockIds.length > 0 && selectedStockIds.length === filteredAndSortedStock.length}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
            </div>
          )}

          {/* View Mode Toggle */}
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

      {/* Stock Grid/List */}
      {filteredAndSortedStock.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {myStock.length === 0 ? 'No Stock Items Yet' : 'No Stock Items Found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {myStock.length === 0
              ? 'Start by adding your first stock item to your inventory.'
              : 'Adjust your filters or search query to find items.'}
          </p>
          {myStock.length === 0 && (
            <Button onClick={onAddStock} className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Add New Stock
            </Button>
          )}
        </Card>
      ) : (
        viewMode === 'grid' ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1, // Stagger entry of cards
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {filteredAndSortedStock.map((stock, index) => (
              <motion.div
                key={`${stock.id}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 100, damping: 15 }
                  }
                }}
                className="relative group"
              >
                {/* Selection Overlay */}
                {isSelectionMode && (
                  <div
                    className="absolute inset-0 z-20 bg-black/20 rounded-xl cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStockSelection(stock.id);
                    }}
                  >
                    <div className="absolute top-4 left-4">
                      <Checkbox
                        checked={selectedStockIds.includes(stock.id)}
                        className="h-6 w-6 border-2 border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleStockSelection(stock.id)}
                      />
                    </div>
                  </div>
                )}
                <EnhancedStockCard
                  stock={stock}
                  onOrderSubmit={() => { }}
                  isPreferredSupplier={false}
                  showOwnerActions={true}
                  onEdit={() => onEditStock?.(stock)}
                  onDelete={() => setStockToDelete(stock)}
                  onViewDetails={() => onViewDetails?.(stock)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedStock.map((stock, index) => (
              <EnhancedStockCard
                key={`${stock.id}-${index}`}
                stock={stock}
                viewMode={viewMode}
                onViewDetails={() => onViewDetails?.(stock)}
                onEdit={() => onEditStock?.(stock)}
                onDelete={() => setStockToDelete(stock)}
                isSelectionMode={isSelectionMode}
                isSelected={selectedStockIds.includes(stock.id)}
                onToggleSelection={() => toggleStockSelection(stock.id)}
              />
            ))}
          </div>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!stockToDelete} onOpenChange={(open) => !open && setStockToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{stockToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStock}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Stock Card Component
interface StockCardProps {
  stock: any;
  viewMode: 'grid' | 'list';
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

function StockCard({
  stock,
  viewMode,
  onViewDetails,
  onEdit,
  onDelete,
  isSelectionMode,
  isSelected,
  onToggleSelection
}: StockCardProps) {
  const mainImage = stock.images?.[0] || stock.mainImages?.[0] || '';
  const price = stock.price || 0;
  const quantity = stock.quantity || 0;

  if (viewMode === 'list') {
    return (
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}>
        <div className="flex">
          {isSelectionMode && (
            <div className="flex items-center justify-center px-4 border-r bg-muted/20">
              <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
            </div>
          )}
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
                <p className="text-sm text-muted-foreground">{stock.category}</p>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={quantity > 0 ? 'default' : 'destructive'}>
                    {quantity} in stock
                  </Badge>
                  {stock.status && (
                    <Badge variant="outline">{stock.status}</Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-lg">₹{price.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground">per piece</p>

                <div className="flex gap-2 mt-2">
                  <Button onClick={onViewDetails} size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button onClick={onEdit} size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button onClick={onDelete} size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}>
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
              className="bg-white border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
          </div>
        )}
        <ImageWithFallback
          src={mainImage}
          alt={stock.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <Badge variant={quantity > 0 ? 'default' : 'destructive'}>
            {quantity} in stock
          </Badge>
          {stock.status === 'draft' && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
              Draft
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold line-clamp-1 mb-1" title={stock.name}>{stock.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{stock.category}</p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t">
          <div>
            <span className="font-bold text-lg">₹{price.toLocaleString()}</span>
            <p className="text-xs text-muted-foreground">per piece</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Button onClick={onViewDetails} size="sm" variant="outline" className="w-full" title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          <Button onClick={onEdit} size="sm" variant="outline" className="w-full" title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button onClick={onDelete} size="sm" variant="outline" className="w-full text-destructive hover:bg-destructive/10" title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

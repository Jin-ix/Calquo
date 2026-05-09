import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ItemSetCard } from '../stock/ItemSetCard';
import { ItemSet, SetOrderRequest } from '../stock/ItemSetTypes';
import { Search, Filter, SortAsc, Package, Star, Heart } from 'lucide-react';

interface ItemSetViewProps {
  title: string;
  itemSets: ItemSet[];
  onOrderSet?: (orderData: SetOrderRequest) => void;
  onEdit?: (itemSet: ItemSet) => void;
  onRemoveOffer?: (itemSetId: string) => void;
  showOwnerActions?: boolean;
  preferredSuppliers?: string[];
}

export function ItemSetView({
  title,
  itemSets,
  onOrderSet,
  onEdit,
  onRemoveOffer,
  showOwnerActions = false,
  preferredSuppliers = []
}: ItemSetViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'pieces' | 'recent'>('recent');
  const [colorFilter, setColorFilter] = useState('all');

  // Get unique categories and colors for filters
  const categories = useMemo(() => {
    const cats = Array.from(new Set(itemSets.map(set => set.category)));
    return cats.sort();
  }, [itemSets]);

  const colors = useMemo(() => {
    const cols = Array.from(new Set(itemSets.map(set => set.color)));
    return cols.sort();
  }, [itemSets]);

  // Filter and sort item sets
  const filteredAndSortedSets = useMemo(() => {
    let filtered = itemSets.filter(set => {
      const matchesSearch = set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           set.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           set.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           set.color.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || set.category === categoryFilter;
      const matchesColor = colorFilter === 'all' || set.color === colorFilter;
      
      return matchesSearch && matchesCategory && matchesColor;
    });

    // Sort by preferred suppliers first, then by selected criteria
    filtered.sort((a, b) => {
      // Get supplier IDs for preferred supplier check
      const getSupplierName = (set: ItemSet) => set.supplier;
      const supplierIdA = preferredSuppliers.find(id => 
        // This is a simplified check - you might need to match by supplier name to ID
        getSupplierName(a).includes(id) || id.includes(getSupplierName(a))
      );
      const supplierIdB = preferredSuppliers.find(id => 
        getSupplierName(b).includes(id) || id.includes(getSupplierName(b))
      );
      
      const isPreferredA = !!supplierIdA;
      const isPreferredB = !!supplierIdB;
      
      // Preferred suppliers come first
      if (isPreferredA && !isPreferredB) return -1;
      if (!isPreferredA && isPreferredB) return 1;
      
      // Then sort by selected criteria
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          const priceA = a.offerPrice || a.setPrice;
          const priceB = b.offerPrice || b.setPrice;
          return priceA - priceB;
        case 'pieces':
          return b.totalPiecesInSet - a.totalPiecesInSet;
        case 'recent':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });

    return filtered;
  }, [itemSets, searchTerm, categoryFilter, colorFilter, sortBy, preferredSuppliers]);

  const handleOrderSet = (orderData: any) => {
    if (!onOrderSet) return;
    
    // Convert to SetOrderRequest format
    const setOrderRequest: SetOrderRequest = {
      id: `SET-ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      itemSetId: orderData.itemSetId,
      setName: orderData.setName,
      numberOfSets: orderData.numberOfSets,
      pricePerSet: orderData.pricePerSet,
      totalAmount: orderData.totalAmount,
      buyerCompany: orderData.buyerCompany,
      buyerEmail: orderData.buyerEmail,
      buyerPhone: orderData.buyerPhone,
      supplierName: orderData.supplierName,
      supplierLocation: orderData.supplierLocation,
      status: 'pending',
      orderDate: new Date().toISOString(),
      paymentStatus: 'pending',
      setDetails: orderData.setDetails
    };
    
    onOrderSet(setOrderRequest);
  };

  const isPreferredSupplier = (set: ItemSet) => {
    return preferredSuppliers.some(id => 
      set.supplier.includes(id) || id.includes(set.supplier)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {filteredAndSortedSets.length} item sets available
          </p>
        </div>
        {showOwnerActions && (
          <Button className="gap-2">
            <Package className="h-4 w-4" />
            Add New Set
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sets by name, supplier, category, or color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={colorFilter} onValueChange={setColorFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {colors.map(color => (
                <SelectItem key={color} value={color}>{color}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Sort:</span>
          </div>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price">Price Low-High</SelectItem>
              <SelectItem value="pieces">Most Pieces</SelectItem>
            </SelectContent>
          </Select>

          {/* Active Filters Summary */}
          <div className="flex gap-2 ml-auto">
            {preferredSuppliers.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Heart className="h-3 w-3 fill-current text-red-500" />
                Preferred First
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge variant="outline" className="gap-1">
                {categoryFilter}
                <button onClick={() => setCategoryFilter('all')}>×</button>
              </Badge>
            )}
            {colorFilter !== 'all' && (
              <Badge variant="outline" className="gap-1">
                {colorFilter}
                <button onClick={() => setColorFilter('all')}>×</button>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedSets.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">No item sets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' || colorFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No item sets are available at the moment'
            }
          </p>
          {(searchTerm || categoryFilter !== 'all' || colorFilter !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setColorFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSets.map((itemSet) => (
            <ItemSetCard
              key={itemSet.id}
              itemSet={itemSet}
              onOrderSet={handleOrderSet}
              onEdit={onEdit}
              onRemoveOffer={onRemoveOffer}
              showOwnerActions={showOwnerActions}
              isPreferredSupplier={isPreferredSupplier(itemSet)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

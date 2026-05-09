import React, { useState, useMemo } from 'react';
import { EnhancedStockCard } from '../stock/EnhancedStockCard';
import { EnhancedStockItem } from '../stock/EnhancedStockTypes';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Filter, SortAsc, Clock, MapPin, Navigation, Package, Grid, Palette } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';

import { toast } from 'sonner';

interface EnhancedStockViewProps {
  title: string;
  stocks: EnhancedStockItem[];
  preferredSuppliers?: string[];
  onTogglePreferred?: (supplierId: string) => void;
  showOwnerActions?: boolean; // Show edit/delete for user's own stock
  onEdit?: (stock: EnhancedStockItem) => void;
  onDelete?: (stockId: string) => void;
  onProceedToPurchase?: (stock: EnhancedStockItem, selectedCombinations: any[], specialInstructions: string) => void;
  onViewDetails?: (stock: EnhancedStockItem) => void; // Navigation to separate page
}

const categories = ['All', 'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts', 'Jackets', 'Sweaters', 'Shorts', 'Activewear'];
const locations = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad'];
const setTypes = ['All', 'Set of Pattern', 'Set of Sizes', 'Flexible'];

// City coordinates for distance calculation (approximate city centers)
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};

export function EnhancedStockView({ 
  title, 
  stocks, 
  preferredSuppliers = [],
  onTogglePreferred,
  showOwnerActions = false,
  onEdit,
  onDelete,
  onProceedToPurchase,
  onViewDetails
}: EnhancedStockViewProps) {
  const { user } = useAuth();
  const { addOrder } = useOrders();


  // Use provided stocks only (no demo data)
  const effectiveStocks = stocks;

  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedSetType, setSelectedSetType] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date' | 'distance' | 'preferred'>('preferred');

  // Calculate user location for distance sorting
  const userLocation = useMemo(() => {
    const userCity = user?.city || user?.location || 'Mumbai';
    return cityCoordinates[userCity] || cityCoordinates['Mumbai'];
  }, [user]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = effectiveStocks.filter((stock) => {
      const nameMatch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       stock.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       stock.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryMatch = selectedCategory === 'All' || stock.category === selectedCategory;
      
      const locationMatch = selectedLocation === 'All' || 
                           stock.location.toLowerCase().includes(selectedLocation.toLowerCase());
      
      const setTypeMatch = selectedSetType === 'All' || 
                          (selectedSetType === 'Set of Pattern' && stock.itemSetType === 'set_of_pattern') ||
                          (selectedSetType === 'Set of Sizes' && stock.itemSetType === 'single_color') ||
                          (selectedSetType === 'Flexible' && stock.itemSetType === 'individual_flex');

      return nameMatch && categoryMatch && locationMatch && setTypeMatch;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      if (sortBy === 'preferred') {
        const aPreferred = preferredSuppliers.includes(a.supplier);
        const bPreferred = preferredSuppliers.includes(b.supplier);
        if (aPreferred !== bPreferred) {
          return bPreferred ? 1 : -1; // Preferred suppliers first
        }
        // If both are preferred or both are not, sort by name
        return a.name.localeCompare(b.name);
      }
      
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      
      if (sortBy === 'price') {
        return a.basePrice - b.basePrice;
      }
      
      if (sortBy === 'date') {
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
      
      if (sortBy === 'distance') {
        const cityA = a.location.split(',')[0].trim();
        const cityB = b.location.split(',')[0].trim();
        const coordsA = cityCoordinates[cityA];
        const coordsB = cityCoordinates[cityB];
        
        if (!coordsA || !coordsB) return 0;
        
        const distanceA = calculateDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng);
        const distanceB = calculateDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng);
        
        return distanceA - distanceB;
      }
      
      return 0;
    });
  }, [stocks, searchTerm, selectedCategory, selectedLocation, selectedSetType, sortBy, preferredSuppliers, userLocation]);

  // Get filter statistics
  const getFilterStats = () => {
    const total = filteredAndSortedStocks.length;
    const setOfPattern = filteredAndSortedStocks.filter(s => s.itemSetType === 'set_of_pattern').length;
    const setOfSizes = filteredAndSortedStocks.filter(s => s.itemSetType === 'single_color').length;
    const flexible = filteredAndSortedStocks.filter(s => s.itemSetType === 'individual_flex').length;
    const preferred = filteredAndSortedStocks.filter(s => preferredSuppliers.includes(s.supplier)).length;
    
    return { total, setOfPattern, setOfSizes, flexible, preferred };
  };

  const stats = getFilterStats();

  const getSetTypeDisplay = (itemSetType: string) => {
    switch (itemSetType) {
      case 'set_of_pattern': return 'Set of Pattern';
      case 'single_color': return 'Set of Sizes';
      case 'individual_flex': return 'Flexible';
      default: return itemSetType;
    }
  };

  const getSetTypeIcon = (itemSetType: string) => {
    switch (itemSetType) {
      case 'set_of_pattern': return <Palette className="h-3 w-3" />;
      case 'single_color': return <Grid className="h-3 w-3" />;
      case 'individual_flex': return <Package className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-medium">
            <Package className="h-5 w-5" />
            {title}
          </h1>
          <Badge variant="outline" className="text-sm">
            {stats.total} items found
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search and Sort Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by product name, supplier, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-[200px] bg-white">
                <div className="flex items-center gap-2">
                  {sortBy === 'preferred' && <Navigation className="h-4 w-4 text-muted-foreground" />}
                  {sortBy === 'name' && <SortAsc className="h-4 w-4 text-muted-foreground" />}
                  {sortBy === 'price' && <SortAsc className="h-4 w-4 text-muted-foreground" />}
                  {sortBy === 'distance' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                  {sortBy === 'date' && <Clock className="h-4 w-4 text-muted-foreground" />}
                  <span className="truncate">
                    {sortBy === 'preferred' ? 'Preferred First' :
                     sortBy === 'name' ? 'Name (A-Z)' :
                     sortBy === 'price' ? 'Price (Low to High)' :
                     sortBy === 'distance' ? 'Distance' : 'Recently Added'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preferred">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3" />
                    Preferred First
                  </div>
                </SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-3 w-3" />
                    Name (A-Z)
                  </div>
                </SelectItem>
                <SelectItem value="price">Price (Low to High)</SelectItem>
                <SelectItem value="distance">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Distance
                  </div>
                </SelectItem>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recently Added
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground ml-1">Set Type</label>
            <Select value={selectedSetType} onValueChange={setSelectedSetType}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Set Types" />
              </SelectTrigger>
              <SelectContent>
                {setTypes.map(setType => (
                  <SelectItem key={setType} value={setType}>
                    <div className="flex items-center gap-2">
                      {setType !== 'All' && getSetTypeIcon(
                        setType === 'Set of Pattern' ? 'set_of_pattern' :
                        setType === 'Set of Sizes' ? 'single_color' : 'individual_flex'
                      )}
                      {setType}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || selectedCategory !== 'All' || selectedLocation !== 'All' || selectedSetType !== 'All') && (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedLocation('All');
                setSelectedSetType('All');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredAndSortedStocks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No stock items found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search criteria or clearing the filters.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedLocation('All');
                setSelectedSetType('All');
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStocks.map((stock, index) => (
            <EnhancedStockCard
              key={`${stock.id}-${index}`}
              stock={stock}
              onOrderSubmit={() => {}} // Orders are handled by the ProductSelectionModal via OrderProvider
              isPreferredSupplier={preferredSuppliers.includes(stock.supplier)}
              onTogglePreferred={() => onTogglePreferred?.(stock.supplier)}
              showOwnerActions={showOwnerActions}
              onEdit={onEdit}
              onDelete={onDelete}
              onProceedToPurchase={onProceedToPurchase}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredAndSortedStocks.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredAndSortedStocks.length} of {stocks.length} items
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          {selectedLocation !== 'All' && ` from ${selectedLocation}`}
          {selectedSetType !== 'All' && ` with ${selectedSetType} configuration`}
        </div>
      )}
    </div>
  );
}

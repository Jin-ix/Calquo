import React, { useState, useEffect } from 'react';
import { StockCardWithGallery } from '../stock/StockCardWithGallery';
import { StockItem } from '../stock/StockCard';
import { PlaceOrderDialog } from '../orders/PlaceOrderDialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Search, Filter, SortAsc, Clock, MapPin, Navigation, CheckSquare, Trash2, PlayCircle, PauseCircle, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useStock } from '../context/StockContext';
import { toast } from 'sonner';

interface StockViewProps {
  title: string;
  stocks: StockItem[];
  onOrder?: (orderData: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    deliveryAddress: string;
    paymentMethod: string;
    specialInstructions?: string;
  }) => void;
  onEdit?: (stock: StockItem) => void;
  onRemoveOffer?: (stockId: string) => void;
  showOwnerActions?: boolean;
  preferredSuppliers?: string[];
  showAddToCart?: boolean;
  onViewDetails?: (product: StockItem) => void;
}

const categories = ['All', 'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts', 'Jackets', 'Sweaters', 'Shorts', 'Activewear'];
const locations = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad'];

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
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Thane': { lat: 19.2183, lng: 72.9781 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 }
};

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Get distance from user location to stock location
const getStockDistance = (stock: StockItem, userLoc: UserLocation | null, userAddress?: any): number => {
  // Try to extract city from stock location
  const stockCity = stock.location.split(',')[0].trim();
  const stockCoords = cityCoordinates[stockCity];
  
  if (!stockCoords) {
    return Infinity; // Unknown location, put at the end
  }

  // Prefer GPS location if available
  if (userLoc) {
    return calculateDistance(userLoc.latitude, userLoc.longitude, stockCoords.lat, stockCoords.lng);
  }

  // Fallback to user's saved address
  if (userAddress?.city) {
    const userCityCoords = cityCoordinates[userAddress.city];
    if (userCityCoords) {
      return calculateDistance(userCityCoords.lat, userCityCoords.lng, stockCoords.lat, stockCoords.lng);
    }
  }

  return Infinity; // No location data available
};

// Convert delivery time to sortable number (days)
const getDeliveryDays = (deliveryTime?: string): number => {
  if (!deliveryTime) return 999; // Unknown delivery time goes to end
  
  switch (deliveryTime) {
    case '5-10 days':
      return 7.5; // Average of 5-10
    case '10-20 days':
      return 15; // Average of 10-20
    case 'more than 1 month':
      return 45; // Assume 45 days for more than 1 month
    default:
      return 999;
  }
};

// Location interface for GPS coordinates
interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function StockView({ title, stocks, onOrder, onEdit, onRemoveOffer, showOwnerActions = false, preferredSuppliers = [], showAddToCart = true, onViewDetails }: StockViewProps) {
  const { user } = useAuth();
  // Try to get stock context, but don't fail if it's not available (in case used in isolation)
  let stockContext;
  try {
    stockContext = useStock();
  } catch (e) {
    // Context might not be available in all usages
    console.warn('StockView used outside StockProvider');
  }
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | null>(null);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);

  // Selection handlers
  const toggleStockSelection = (stockId: string) => {
    setSelectedStockIds(prev =>
      prev.includes(stockId)
        ? prev.filter(id => id !== stockId)
        : [...prev, stockId]
    );
  };

  // Helper to get currently filtered stocks for Select All
  // We need to move filteredStocks logic up or duplicate it for the handler
  // To avoid duplication, we'll define filter logic before the handlers
  
  // Filter logic
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || stock.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || stock.location.includes(selectedLocation);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    // Always prioritize trending items first, regardless of sort
    if (a.isTrending && !b.isTrending) return -1;
    if (!a.isTrending && b.isTrending) return 1;
    
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'quantity':
        return b.quantity - a.quantity;
      case 'date':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      case 'trending':
        // When specifically sorting by trending, trending items stay at top, then by trending set date
        if (a.isTrending && b.isTrending) {
          return new Date(b.trendingSetDate!).getTime() - new Date(a.trendingSetDate!).getTime();
        }
        return 0;
      case 'delivery':
        // Sort by quickest delivery time
        const aDays = getDeliveryDays(a.deliveryTime);
        const bDays = getDeliveryDays(b.deliveryTime);
        return aDays - bDays;
      case 'nearby':
        // Sort by proximity to user location
        const aDistance = getStockDistance(a, userLocation, user?.profile?.address);
        const bDistance = getStockDistance(b, userLocation, user?.profile?.address);
        return aDistance - bDistance;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleSelectAll = () => {
    if (selectedStockIds.length === sortedStocks.length) {
      setSelectedStockIds([]);
    } else {
      setSelectedStockIds(sortedStocks.map(s => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!stockContext) return;
    if (window.confirm(`Are you sure you want to delete ${selectedStockIds.length} items?`)) {
      if (await stockContext.bulkDeleteStock(selectedStockIds)) {
        setSelectedStockIds([]);
        setIsSelectionMode(false);
      }
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    if (!stockContext) return;
    if (await stockContext.bulkUpdateStockStatus(selectedStockIds, status)) {
      setSelectedStockIds([]);
      setIsSelectionMode(false);
    }
  };

  // Request location permission and get user's current location
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    try {
      // Check if we already have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermissionStatus(permission.state);

      if (permission.state === 'granted') {
        getCurrentLocation();
      } else if (permission.state === 'prompt') {
        getCurrentLocation();
      } else {
        toast.error('Location permission denied. Using saved address as fallback.');
      }
    } catch (error) {
      // Fallback for browsers that don't support permission query
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(location);
        setLocationPermissionStatus('granted');
        toast.success('Location detected successfully!');
      },
      (error) => {
        setLocationPermissionStatus('denied');
        const userCity = user?.profile?.address?.city;
        toast.error(`Location access denied. ${userCity ? `Using saved address: ${userCity}` : 'No location data available'}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Auto-detect location when component mounts if sorting by nearby location
  useEffect(() => {
    if (sortBy === 'nearby' && !userLocation && locationPermissionStatus !== 'denied') {
      requestLocationPermission();
    }
  }, [sortBy, userLocation, locationPermissionStatus]);

  // Filter logic moved up

  const handleOrderClick = (stock: StockItem) => {
    setSelectedStock(stock);
    setShowOrderDialog(true);
  };

  const handleOrderSubmit = (orderData: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    deliveryAddress: string;
    paymentMethod: string;
    specialInstructions?: string;
  }) => {
    if (onOrder) {
      onOrder(orderData);
    }
    setShowOrderDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {sortedStocks.length} items available
            {sortedStocks.filter(s => s.isTrending).length > 0 && (
              <span className="ml-2 text-purple-600">
                • {sortedStocks.filter(s => s.isTrending).length} trending
              </span>
            )}
          </p>
        </div>
        <Badge variant="outline">
          Total: {sortedStocks.reduce((sum, stock) => sum + stock.quantity, 0)} pieces
        </Badge>
      </div>

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && showOwnerActions && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-xl border rounded-lg p-2 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-3 border-r mr-2">
            <span className="font-medium text-sm">{selectedStockIds.length} selected</span>
            <Button variant="ghost" size="sm" onClick={() => {
              setIsSelectionMode(false);
              setSelectedStockIds([]);
            }} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
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

      {/* Location Status Indicator */}
      {sortBy === 'nearby' && (
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Location-based Sorting</p>
                <p className="text-sm text-muted-foreground">
                  {userLocation 
                    ? `Using GPS location (accuracy: ~${Math.round(userLocation.accuracy || 0)}m)`
                    : user?.profile?.address?.city 
                    ? `Using saved address: ${user.profile.address.city}, ${user.profile.address.state}`
                    : 'No location data available'
                  }
                </p>
              </div>
            </div>
            {!userLocation && locationPermissionStatus !== 'denied' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={requestLocationPermission}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Enable GPS
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delivery Time Info */}
      {sortBy === 'delivery' && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Delivery Time Sorting</p>
              <p className="text-sm text-blue-700">
                Items are sorted by fastest delivery time first. Times shown are estimated delivery periods.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {showOwnerActions && (
          <div className="flex items-center">
            {isSelectionMode ? (
              <div className="flex items-center gap-2 w-full px-2">
                <Checkbox 
                  checked={selectedStockIds.length > 0 && selectedStockIds.length === sortedStocks.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all-stock"
                />
                <label htmlFor="select-all-stock" className="text-sm font-medium cursor-pointer">
                  Select All
                </label>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsSelectionMode(true)}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Select Items
              </Button>
            )}
          </div>
        )}

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Name A-Z
              </div>
            </SelectItem>
            <SelectItem value="trending">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Trending First
              </div>
            </SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="quantity">Stock Quantity</SelectItem>
            <SelectItem value="date">Recently Added</SelectItem>
            <SelectItem value="delivery">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Quickest Delivery
              </div>
            </SelectItem>
            <SelectItem value="nearby">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Nearby Location
                {locationPermissionStatus === 'denied' && (
                  <span className="text-xs text-muted-foreground">(saved address)</span>
                )}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stock Grid */}
      {sortedStocks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stock items found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStocks.map(stock => {
            const isFromPreferred = preferredSuppliers.includes(stock.supplier);
            return (
              <StockCardWithGallery
                key={stock.id}
                stock={stock}
                onOrder={user?.role === 'retailer' || user?.role === 'trader' ? handleOrderClick : undefined}
                onEdit={showOwnerActions ? onEdit : undefined}
                onRemoveOffer={showOwnerActions ? onRemoveOffer : undefined}
                isOwner={showOwnerActions}
                showActions={true}
                isFromPreferred={isFromPreferred}
                showAddToCart={showAddToCart && !showOwnerActions}
                showDistance={sortBy === 'nearby'}
                distance={getStockDistance(stock, userLocation, user?.profile?.address)}
                showDeliveryTime={sortBy === 'delivery'}
                isSelectionMode={isSelectionMode}
                isSelected={selectedStockIds.includes(stock.id)}
                onToggleSelection={() => toggleStockSelection(stock.id)}
              />
            );
          })}
        </div>
      )}

      {/* Place Order Dialog */}
      <PlaceOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        stock={selectedStock}
        onOrderSubmit={handleOrderSubmit}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Heart, HeartOff, MapPin, Star, Filter, Search, Building2, Package, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RatingDisplay, RatingSubmission, Rating, calculateRatingStats, getUserRating } from '../rating/RatingSystem';
import { listenToCollection, where, orderBy, limit, Unsubscribe } from '../../utils/firebase/firestore';

export interface Supplier {
  id: string;
  name: string;
  type: 'manufacturer' | 'trader' | 'financial' | 'logistics-agent';
  location: string;
  rating: number;
  totalProducts: number;
  description: string;
  specialties: string[];
  joinedDate: string;
  verified: boolean;
  contactEmail: string;
  contactPhone: string;
}

interface SuppliersDirectoryProps {
  preferredSuppliers?: string[];
  onTogglePreferred?: (supplierId: string) => void;
  ratings?: Rating[];
  onRatingSubmit?: (rating: Omit<Rating, 'id' | 'createdDate'>) => void;
  onViewDetails?: (supplier: Supplier) => void;
}

export function SuppliersDirectory({
  preferredSuppliers = [],
  onTogglePreferred,
  ratings = [],
  onRatingSubmit,
  onViewDetails
}: SuppliersDirectoryProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'manufacturer' | 'trader' | 'financial'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'products'>('rating');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<string[]>(preferredSuppliers);
  const [activeTab, setActiveTab] = useState<'all' | 'preferred'>('all');
  const [itemsLimit, setItemsLimit] = useState(12);

  // Retry state for index building
  const [retryCount, setRetryCount] = useState(0);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [indexErrorUrl, setIndexErrorUrl] = useState<string | null>(null);
  const [useClientSideSort, setUseClientSideSort] = useState(false);

  // Firebase Real-time Sync for Suppliers
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupListener = async () => {
      try {
        setLoading(true);

        // Check if Firebase is configured
        const { isFirebaseDemoMode, firebaseDb } = await import('../../utils/firebase/config');

        if (isFirebaseDemoMode || !firebaseDb) {
          console.warn('⚠️  Suppliers Directory: Firebase not configured - using demo data');
          setSuppliers(getDemoSuppliers());
          setLoading(false);
          return;
        }

        console.log('🔵 Setting up Suppliers Directory listener');
        console.log(`🔥 Setting up listener for collection: suppliers (retry: ${retryCount}/${5})`);

        let constraints;

        // If index is building or we're using client-side sort, use simplified query
        if (useClientSideSort || indexBuilding) {
          console.log('📊 Using simplified query with client-side sorting');
          constraints = [
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(100) // Fetch more for client-side sorting
          ];

          // Add type filter if selected (this doesn't require composite index)
          if (selectedType !== 'all') {
            constraints.unshift(where('type', '==', selectedType));
          }
        } else {
          // Try full indexed query first
          console.log('📊 Using full indexed query');
          constraints = [
            where('status', '==', 'active'),
            orderBy(sortBy === 'rating' ? 'rating' : 'createdAt', 'desc'),
            limit(itemsLimit)
          ];

          // Add type filter if selected
          if (selectedType !== 'all') {
            constraints.unshift(where('type', '==', selectedType));
          }
        }

        // Listen to suppliers collection
        unsubscribe = listenToCollection(
          'suppliers',
          constraints,
          (data) => {
            console.log('✅ Suppliers Directory update received:', data.length, 'suppliers');

            // Validate and transform Firestore data to Supplier format
            const transformedSuppliers: Supplier[] = data
              .map((doc: any) => {
                // Validate required fields
                if (!doc || typeof doc !== 'object' || !doc.id) {
                  console.warn('❌ Invalid supplier document:', doc);
                  return null;
                }

                return {
                  id: doc.id,
                  name: doc.name || 'Unknown Supplier',
                  type: doc.type || 'manufacturer',
                  location: doc.location || 'India',
                  rating: typeof doc.rating === 'number' ? doc.rating : 0,
                  totalProducts: typeof doc.total_products === 'number' ? doc.total_products : 0,
                  description: doc.description || '',
                  specialties: Array.isArray(doc.specialties) ? doc.specialties : [],
                  joinedDate: doc.createdAt || new Date().toISOString(),
                  verified: Boolean(doc.verified),
                  contactEmail: doc.contact_email || '',
                  contactPhone: doc.contact_phone || '',
                  status: doc.status || 'active'
                };
              })
              .filter((supplier): supplier is Supplier => supplier !== null && supplier.status === 'active');

            // If using client-side sort, sort here
            if (useClientSideSort || indexBuilding) {
              console.log('📊 Applying client-side sorting by:', sortBy);
              transformedSuppliers.sort((a, b) => {
                switch (sortBy) {
                  case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                  case 'name':
                    return a.name.localeCompare(b.name);
                  case 'products':
                    return (b.totalProducts || 0) - (a.totalProducts || 0);
                  default:
                    return 0;
                }
              });

              // Limit results
              transformedSuppliers.splice(itemsLimit);
            }

            console.log(`📦 Loaded ${transformedSuppliers.length} suppliers (${transformedSuppliers.filter(s => s.verified).length} verified)`);

            setSuppliers(transformedSuppliers);
            setLoading(false);
            setIndexBuilding(false); // Success! Index is ready
            setRetryCount(0); // Reset retry count on success
          }
        );
      } catch (err: any) {
        console.error('❌ Error setting up Suppliers Directory listener:', err);
        console.error('❌ Full error object:', err);

        // Check if error is due to missing Firestore index
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          console.warn('🔥 MISSING FIRESTORE INDEX!');
          console.warn('💡 Create index by clicking the link in the error above, OR');
          console.warn('💡 Run: firebase deploy --only firestore:indexes');
          console.warn(`   Error Code: ${err.code}`);

          // Extract index creation URL from error message
          const indexUrlMatch = err.message?.match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
          const extractedUrl = indexUrlMatch ? indexUrlMatch[1] : null;

          if (extractedUrl) {
            setIndexErrorUrl(extractedUrl);
            console.warn(`🔗 Index Creation URL: ${extractedUrl}`);
          }

          // Show user-friendly message
          const retryMessage = retryCount < 5
            ? `Optimizing directory – suppliers loading soon. Retry ${retryCount + 1}/5...`
            : 'Index building in progress – refresh in a few minutes or deploy indexes.';

          toast.error(retryMessage, {
            duration: 8000,
            action: extractedUrl ? {
              label: 'Create Index',
              onClick: () => window.open(extractedUrl, '_blank')
            } : undefined
          });

          setIndexBuilding(true);

          // Retry logic with exponential backoff
          if (retryCount < 5) {
            const retryDelay = Math.min(5000 * Math.pow(1.5, retryCount), 30000); // Max 30s
            console.log(`⏳ Retrying in ${retryDelay / 1000}s... (attempt ${retryCount + 1}/5)`);

            setRetryCount(prev => prev + 1);
            retryTimeout = setTimeout(() => {
              setupListener();
            }, retryDelay);
          } else {
            // After max retries, switch to client-side sorting
            console.log('📊 Max retries reached. Switching to client-side sorting fallback.');
            setUseClientSideSort(true);

            // Try one more time with simplified query
            setTimeout(() => {
              setRetryCount(0);
              setupListener();
            }, 1000);
          }
        } else {
          // Other errors
          toast.error(`Failed to load suppliers: ${err.message}`, { duration: 5000 });
        }

        // Show demo data while retrying
        setSuppliers(getDemoSuppliers());
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount or when filters change
    return () => {
      if (unsubscribe) {
        console.log('🔴 Cleaning up Suppliers Directory listener');
        unsubscribe();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [selectedType, sortBy, itemsLimit, useClientSideSort]);

  // Update preferences when prop changes
  useEffect(() => {
    setUserPreferences(preferredSuppliers);
  }, [preferredSuppliers]);

  const getDemoSuppliers = (): Supplier[] => [
    {
      id: '1',
      name: 'FashionCorp Manufacturing',
      type: 'manufacturer',
      location: 'Mumbai, Maharashtra',
      rating: 4.5,
      totalProducts: 150,
      description: 'FashionCorp Manufacturing is a trusted manufacturer based in Mumbai. Verified business with GST registration 27AABCF1234M1Z5.',
      specialties: ['Cotton Apparel', 'Synthetic Fabrics', 'Traditional Wear', 'Bulk Production'],
      joinedDate: '2024-01-15T10:30:00Z',
      verified: true,
      contactEmail: 'rajesh@fashioncorp.com',
      contactPhone: '9876543210'
    },
    {
      id: '2',
      name: 'Global Warehouse Solutions',
      type: 'trader',
      location: 'Delhi, Delhi',
      rating: 4.3,
      totalProducts: 85,
      description: 'Global Warehouse Solutions is a trusted trader based in Delhi. Verified business with GST registration 29BCDEG5678N2Z6.',
      specialties: ['Wholesale Trading', 'Import/Export', 'Market Distribution', 'Bulk Supply'],
      joinedDate: '2024-01-10T09:15:00Z',
      verified: true,
      contactEmail: 'priya@globalware.com',
      contactPhone: '9876543211'
    },
    {
      id: '4',
      name: 'PayFast Financial Services',
      type: 'financial',
      location: 'Mumbai, Maharashtra',
      rating: 4.2,
      totalProducts: 1,
      description: 'PayFast Financial Services is a trusted financial based in Mumbai. Verified business with GST registration 33GHIJK3456P4Z8.',
      specialties: ['Payment Processing', 'Trade Finance', 'Credit Solutions', 'Transaction Support'],
      joinedDate: '2024-01-12T11:45:00Z',
      verified: true,
      contactEmail: 'sunita@payfast.com',
      contactPhone: '9876543213'
    }
  ];

  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'all' || supplier.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'products':
          return b.totalProducts - a.totalProducts;
        default:
          return 0;
      }
    });

  const preferredSuppliersData = suppliers.filter(supplier =>
    userPreferences.includes(supplier.id)
  );

  const handleTogglePreferred = (supplierId: string, supplierName: string) => {
    const isCurrentlyPreferred = userPreferences.includes(supplierId);

    // Update local state
    const newPreferences = isCurrentlyPreferred
      ? userPreferences.filter(id => id !== supplierId)
      : [...userPreferences, supplierId];

    setUserPreferences(newPreferences);

    // Call parent handler if provided
    if (onTogglePreferred) {
      onTogglePreferred(supplierId);
    }

    toast.success(
      isCurrentlyPreferred
        ? `Removed ${supplierName} from preferred suppliers`
        : `Added ${supplierName} to preferred suppliers`
    );
  };

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => {
    const isPreferred = userPreferences.includes(supplier.id);

    // Calculate rating stats for this supplier
    const supplierRatings = ratings.filter(r => r.targetId === supplier.id && r.targetType === 'supplier');
    const ratingStats = calculateRatingStats(supplierRatings);
    const userRating = user ? getUserRating(supplierRatings, user.email) : undefined;

    // Get type badge configuration
    const getTypeBadge = () => {
      switch (supplier.type) {
        case 'manufacturer':
          return { icon: Building2, label: 'Manufacturer', className: 'bg-blue-100 text-blue-700 border-blue-200' };
        case 'trader':
          return { icon: Package, label: 'Trader', className: 'bg-orange-100 text-orange-700 border-orange-200' };
        case 'financial':
          return { icon: CreditCard, label: 'Financial', className: 'bg-green-100 text-green-700 border-green-200' };
        default:
          return { icon: Building2, label: 'Supplier', className: 'bg-gray-100 text-gray-700 border-gray-200' };
      }
    };

    const typeBadge = getTypeBadge();
    const TypeIcon = typeBadge.icon;

    return (
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] duration-300 bg-gradient-to-br from-white to-gray-50/50 border-gray-200">
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{supplier.name}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {supplier.location}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {supplier.verified && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePreferred(supplier.id, supplier.name)}
                className={isPreferred ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-red-600'}
              >
                {isPreferred ? <Heart className="h-4 w-4 fill-current" /> : <HeartOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(ratingStats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium ml-1">
                {ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : 'New'}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({ratingStats.totalRatings})
              </span>
            </div>

            {/* Type Badge */}
            <Badge variant="outline" className={`flex items-center gap-1 ${typeBadge.className}`}>
              <TypeIcon className="h-3 w-3" />
              {typeBadge.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {supplier.description}
          </p>

          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Products:</span> {supplier.totalProducts}
            </div>
            {supplier.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {supplier.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {supplier.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{supplier.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              variant="default"
              size="sm"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (user?.role !== 'retailer' && user?.role !== 'trader') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Access denied. This page is only available for retailers and traders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers Directory</h1>
          <p className="text-muted-foreground">Discover and connect with manufacturers, traders, and financial agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {userPreferences.length} Preferred
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {suppliers.length} Total
          </Badge>
        </div>
      </div>

      {/* Index Building Banner */}
      {indexBuilding && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-orange-600 animate-spin flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  Optimizing Directory
                </h3>
                <p className="text-sm text-orange-800 mb-2">
                  Firestore index is building. Suppliers will load automatically once ready.
                  {retryCount > 0 && ` Retrying... (${retryCount}/5)`}
                </p>
                {indexErrorUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(indexErrorUrl, '_blank')}
                    className="text-xs border-orange-300 hover:bg-orange-100"
                  >
                    Create Index Manually
                  </Button>
                )}
                {useClientSideSort && (
                  <p className="text-xs text-orange-700 mt-2">
                    Using client-side sorting as fallback. Deploy indexes for better performance: <code className="bg-orange-200 px-1 rounded">npm run deploy:indexes</code>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Suppliers</TabsTrigger>
          <TabsTrigger value="preferred">Preferred Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers, locations, or specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedType}
              onValueChange={(value: 'all' | 'manufacturer' | 'trader' | 'financial') => setSelectedType(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manufacturer">Manufacturers</SelectItem>
                <SelectItem value="trader">Traders</SelectItem>
                <SelectItem value="financial">Financial Agents</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value: 'name' | 'rating' | 'products') => setSortBy(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Sort by Rating</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="products">Sort by Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No suppliers found. Try adjusting your search or explore more via the directory.</p>
            </div>
          )}

          {/* Load More Button */}
          {filteredSuppliers.length > 0 && suppliers.length >= itemsLimit && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setItemsLimit(prev => prev + 12)}
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Load More Suppliers
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferred" className="space-y-4">
          {preferredSuppliersData.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No preferred suppliers selected yet</p>
              <p className="text-sm text-muted-foreground">Add suppliers to your preferred list to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {preferredSuppliersData.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

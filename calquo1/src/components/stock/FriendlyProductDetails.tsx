import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Star, 
  MapPin, 
  Package, 
  Truck, 
  ShoppingCart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Shield,
  Award,
  ThumbsUp,
  Clock,
  Users,
  Tag,
  Info,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Eye
} from 'lucide-react';

import { RatingDisplay, RatingBreakdown, RatingSubmission, Rating } from '../rating/RatingSystem';
import { StockItem } from './StockCard';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FriendlyProductDetailsProps {
  product: StockItem;
  ratings: Rating[];
  userPurchaseHistory: string[];
  onRatingSubmit: (rating: Omit<Rating, 'id' | 'createdDate'>) => void;
  onOrder: (product: StockItem) => void;
  onBack: () => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

export const FriendlyProductDetails: React.FC<FriendlyProductDetailsProps> = ({
  product,
  ratings,
  userPurchaseHistory,
  onRatingSubmit,
  onOrder,
  onBack
}) => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const hasPurchased = userPurchaseHistory.includes(product.id);

  // Calculate rating stats
  const ratingStats = useMemo(() => {
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    ratings.forEach(rating => {
      totalRating += rating.rating;
      distribution[rating.rating as keyof typeof distribution]++;
    });

    return {
      averageRating: totalRating / ratings.length,
      totalRatings: ratings.length,
      ratingDistribution: distribution
    };
  }, [ratings]);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = ratings.filter(rating => rating.review && rating.review.trim().length > 0);

    if (filterBy !== 'all') {
      const filterValue = parseInt(filterBy);
      filtered = filtered.filter(rating => rating.rating === filterValue);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'oldest':
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [ratings, sortBy, filterBy]);

  const displayedReviews = showAllReviews ? filteredAndSortedReviews : filteredAndSortedReviews.slice(0, 5);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getDiscountPercentage = (): number => {
    if (product.offerPrice && product.price > product.offerPrice) {
      return Math.round(((product.price - product.offerPrice) / product.price) * 100);
    }
    return 0;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const nextImage = () => {
    if (product.images && product.images.length > 1) {
      setSelectedImage((prev) => (prev + 1) % product.images!.length);
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 1) {
      setSelectedImage((prev) => (prev - 1 + product.images!.length) % product.images!.length);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this ${product.category} - ${product.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const getDeliveryBadgeColor = () => {
    switch (product.deliveryTime) {
      case '5-10 days': return 'bg-green-100 text-green-700 border-green-200';
      case '10-20 days': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto px-4 lg:px-6">
      {/* Friendly Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="gap-2 hover:bg-primary/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Browse
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLike}
            className={`gap-2 ${isLiked ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </Button>
        </div>
      </div>

      {/* Main Product Section - Landscape Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Image Gallery - Takes 7 columns for more landscape emphasis */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              <div className="aspect-[4/3] lg:aspect-[16/10] relative group">
                <ImageWithFallback
                  src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isTrending && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {getDiscountPercentage() > 0 && (
                    <Badge className="bg-green-600 text-white shadow-lg">
                      <Tag className="h-3 w-3 mr-1" />
                      {getDiscountPercentage()}% OFF
                    </Badge>
                  )}
                  {product.supplierType === 'manufacturer' && (
                    <Badge className="bg-blue-600 text-white shadow-lg">
                      <Award className="h-3 w-3 mr-1" />
                      Direct from Manufacturer
                    </Badge>
                  )}
                </div>

                {/* Navigation Arrows */}
                {product.images && product.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Image Counter */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Thumbnail Navigation */}
          {product.images && product.images.length > 1 && (
            <ScrollArea className="w-full">
              <div className="flex gap-3 p-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedImage === index 
                        ? 'border-primary shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Product Information - Takes 5 columns with better spacing */}
        <div className="lg:col-span-5 space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-3 text-xs px-2 py-1">
                {product.category}
              </Badge>
              <h1 className="text-2xl font-semibold leading-tight mb-3">
                {product.name}
              </h1>
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <RatingDisplay stats={ratingStats} size="sm" />
                <span className="font-medium">{ratingStats.averageRating.toFixed(1)}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">
                {ratingStats.totalRatings} review{ratingStats.totalRatings !== 1 ? 's' : ''}
              </span>
              {ratingStats.totalRatings > 50 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="secondary" className="text-xs">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.offerPrice || product.price)}
                </span>
                {product.offerPrice && product.price > product.offerPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </span>
                    <Badge className="bg-green-100 text-green-700">
                      Save {formatPrice(product.price - product.offerPrice)}
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Per unit • Minimum order: {product.minOrderQuantity} units
              </p>
            </div>

            {/* Quick Info Cards - More compact for landscape */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
              <Card className="p-2 lg:p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Ships from</p>
                    <p className="text-sm font-medium truncate">{product.location}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-2 lg:p-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getDeliveryBadgeColor()}`}
                    >
                      {product.deliveryTime}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Supplier & Stock Info - Combined for landscape layout */}
            <Card className="p-3 lg:p-4">
              <div className="space-y-3">
                {/* Supplier Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                    <Avatar className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0">
                      <AvatarFallback>{getInitials(product.supplier)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm lg:text-base">{product.supplier}</p>
                      <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
                        <Badge 
                          variant={product.supplierType === 'manufacturer' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {product.supplierType}
                        </Badge>
                        {product.supplierType === 'manufacturer' && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <Eye className="h-4 w-4 lg:mr-1" />
                    <span className="hidden lg:inline">View</span>
                  </Button>
                </div>
                
                <Separator />
                
                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm lg:text-base">Stock Available</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        {product.quantity} units in stock
                      </p>
                    </div>
                  </div>
                  {product.quantity > 100 ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      In Stock
                    </Badge>
                  ) : product.quantity > 20 ? (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Limited
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons - Optimized for landscape */}
          <div className="space-y-3 lg:sticky lg:top-4">
            <Button 
              size="lg" 
              className="w-full gap-2 h-10 lg:h-12"
              onClick={() => onOrder(product)}
            >
              <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="flex-1 text-center">Request Quote</span>
              <Badge variant="secondary" className="text-xs">
                Min {product.minOrderQuantity}
              </Badge>
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Free to request • No commitment required
              </p>
            </div>
            
            {/* Rating Button */}
            {user && user.role === 'retailer' && hasPurchased && (
              <div className="pt-2">
                <RatingSubmission
                  targetId={product.id}
                  targetType="item"
                  targetName={product.name}
                  onRatingSubmit={onRatingSubmit}
                  existingRating={ratings.find(r => r.userId === user.email)}
                />
              </div>
            )}
            
            {user && user.role === 'retailer' && !hasPurchased && (
              <Card className="p-2 lg:p-3 bg-muted/50">
                <p className="text-xs lg:text-sm text-center text-muted-foreground">
                  💡 Purchase this product to leave a review and help other buyers
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs - Optimized for landscape */}
      <Tabs defaultValue="overview" className="space-y-4 lg:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-10 lg:h-12">
          <TabsTrigger value="overview" className="gap-1 lg:gap-2 text-xs lg:text-sm">
            <Info className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-1 lg:gap-2 text-xs lg:text-sm">
            <Package className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Details</span>
            <span className="sm:hidden">Specs</span>  
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1 lg:gap-2 text-xs lg:text-sm">
            <MessageSquare className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Reviews ({ratingStats.totalRatings})</span>
            <span className="sm:hidden">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-1 lg:gap-2 text-xs lg:text-sm">
            <Truck className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Shipping</span>
            <span className="sm:hidden">Ship</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="lg:col-span-3 space-y-4 lg:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    About This Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Fabric</p>
                      <p className="text-sm text-muted-foreground">{product.fabricType}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Size</p>
                      <p className="text-sm text-muted-foreground">{product.size}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Color</p>
                      <p className="text-sm text-muted-foreground">{product.color}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {product.fabricDescription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Fabric Care
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{product.fabricDescription}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <RatingBreakdown stats={ratingStats} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Facts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added on:</span>
                    <span className="font-medium">{formatDate(product.dateAdded)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier type:</span>
                    <span className="font-medium capitalize">{product.supplierType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min order:</span>
                    <span className="font-medium">{product.minOrderQuantity} units</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Specifications</CardTitle>
              <CardDescription>
                Detailed information about this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Product Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product Name:</span>
                      <span className="font-medium truncate ml-2">{product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{product.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium">{product.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fabric Type:</span>
                      <span className="font-medium">{product.fabricType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Business Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="font-medium truncate ml-2">{product.supplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier Type:</span>
                      <span className="font-medium capitalize">{product.supplierType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{product.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Stock & Orders</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock Available:</span>
                      <span className="font-medium">{product.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Order:</span>
                      <span className="font-medium">{product.minOrderQuantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Listed Date:</span>
                      <span className="font-medium">{formatDate(product.dateAdded)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {/* Reviews Section - Same as original but with friendly styling */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    What Customers Say
                  </CardTitle>
                  <CardDescription>
                    {filteredAndSortedReviews.length} review{filteredAndSortedReviews.length !== 1 ? 's' : ''}
                    {filterBy !== 'all' && ` with ${filterBy} star${filterBy !== '1' ? 's' : ''}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest">Highest Rated</SelectItem>
                      <SelectItem value="lowest">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {displayedReviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">
                    {filterBy === 'all' ? 'No reviews yet' : `No reviews with ${filterBy} star${filterBy !== '1' ? 's' : ''}`}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {filterBy === 'all' 
                      ? 'Be the first to share your experience with this product!'
                      : 'Try selecting a different rating filter.'
                    }
                  </p>
                  {user && user.role === 'retailer' && hasPurchased && (
                    <Button onClick={() => {}}>
                      Write First Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              displayedReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(review.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{review.userName}</p>
                            <p className="text-sm text-muted-foreground">{review.userCompany}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(review.createdDate)}
                            </p>
                          </div>
                        </div>
                        {review.review && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-muted-foreground leading-relaxed">
                              "{review.review}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {filteredAndSortedReviews.length > 5 && !showAllReviews && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllReviews(true)}
                    className="gap-2"
                  >
                    Show {filteredAndSortedReviews.length - 5} More Reviews
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Delivery Time</p>
                      <p className="text-muted-foreground">{product.deliveryTime}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Ships From</p>
                      <p className="text-muted-foreground">{product.location}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Minimum Order</p>
                      <p className="text-muted-foreground">{product.minOrderQuantity} units</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Order Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Quality assurance guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Secure payment processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Direct supplier communication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Order tracking support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

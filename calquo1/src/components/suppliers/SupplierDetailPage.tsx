import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  Package, 
  Shield, 
  Users, 
  Filter,
  ChevronDown,
  Image as ImageIcon,
  MessageSquare,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';

import { RatingDisplay, RatingBreakdown, RatingSubmission, Rating } from '../rating/RatingSystem';
import { PreferredSupplierToggle, PreferredSupplierHeader } from './PreferredSupplierToggle';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { OrderRequest } from '../utils/purchase-verification';

interface SupplierDetailProps {
  supplier: {
    id: string;
    name: string;
    type: 'manufacturer' | 'trader';
    location: string;
    rating: number;
    totalProducts: number;
    description: string;
    specialties: string[];
    joinedDate: string;
    verified: boolean;
    contactEmail: string;
    contactPhone: string;
    profileImage?: string;
    coverImage?: string;
    totalOrders?: number;
    responseTime?: string;
    businessHours?: string;
  };
  ratings: Rating[];
  orders?: OrderRequest[];
  preferredSuppliers?: string[];
  onRatingSubmit: (rating: Omit<Rating, 'id' | 'createdDate'>) => void;
  onTogglePreferred?: (supplierId: string) => void;
  onBack: () => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

export const SupplierDetailPage: React.FC<SupplierDetailProps> = ({
  supplier,
  ratings,
  orders = [],
  preferredSuppliers = [],
  onRatingSubmit,
  onTogglePreferred,
  onBack
}) => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);

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

    // Apply filter
    if (filterBy !== 'all') {
      const filterValue = parseInt(filterBy);
      filtered = filtered.filter(rating => rating.rating === filterValue);
    }

    // Apply sort
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

  const getUserRating = () => {
    if (!user) return undefined;
    return ratings.find(rating => rating.userId === user.email);
  };

  const isPreferred = preferredSuppliers.includes(supplier.id);

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

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          ← Back to Directory
        </Button>
      </div>

      {/* Supplier Header */}
      <Card className="overflow-hidden">
        {supplier.coverImage && (
          <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 relative">
            <img 
              src={supplier.coverImage} 
              alt={`${supplier.name} cover`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-16 w-16">
                <AvatarImage src={supplier.profileImage} />
                <AvatarFallback className="text-lg">{getInitials(supplier.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CardTitle className="text-xl">{supplier.name}</CardTitle>
                  {supplier.verified && (
                    <Badge variant="default" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {supplier.type}
                  </Badge>
                  {onTogglePreferred && (
                    <PreferredSupplierHeader
                      supplierId={supplier.id}
                      supplierName={supplier.name}
                      isPreferred={isPreferred}
                      onToggle={onTogglePreferred}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {supplier.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(supplier.joinedDate)}
                  </div>
                </div>
                <RatingDisplay stats={ratingStats} size="lg" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {user && user.role === 'retailer' && (
                <RatingSubmission
                  targetId={supplier.id}
                  targetType="supplier"
                  targetName={supplier.name}
                  onRatingSubmit={onRatingSubmit}
                  existingRating={getUserRating()}
                  orders={orders}
                />
              )}
              {onTogglePreferred && user?.role === 'retailer' && (
                <PreferredSupplierToggle
                  supplierId={supplier.id}
                  supplierName={supplier.name}
                  isPreferred={isPreferred}
                  onToggle={onTogglePreferred}
                  variant="button"
                  size="sm"
                />
              )}
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-semibold">{supplier.totalProducts}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-semibold">{supplier.totalOrders || 45}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-semibold">{supplier.responseTime || '2h'}</p>
            <p className="text-sm text-muted-foreground">Response Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-semibold">{ratingStats.averageRating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({ratingStats.totalRatings})</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{supplier.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {supplier.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rating Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <RatingBreakdown stats={ratingStats} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
              <CardDescription>
                Browse products from {supplier.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Product catalog will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {/* Reviews Header with Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customer Reviews</CardTitle>
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
                      <SelectItem value="all">All Stars</SelectItem>
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

          {/* Reviews List */}
          <div className="space-y-4">
            {displayedReviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {filterBy === 'all' ? 'No reviews yet' : `No reviews with ${filterBy} star${filterBy !== '1' ? 's' : ''}`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              displayedReviews.map((review) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
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
                          <p className="text-muted-foreground leading-relaxed">
                            {review.review}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Show More Button */}
            {filteredAndSortedReviews.length > 5 && !showAllReviews && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAllReviews(true)}
                    className="gap-2"
                  >
                    Show {filteredAndSortedReviews.length - 5} More Reviews
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{supplier.contactEmail}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{supplier.contactPhone}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Business Hours</p>
                  <p className="text-muted-foreground">{supplier.businessHours || 'Mon-Fri 9:00 AM - 6:00 PM'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

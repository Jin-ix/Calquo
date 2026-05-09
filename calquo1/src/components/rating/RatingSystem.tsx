import React, { useState } from 'react';
import { Star, Users, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { canUserRate, getPurchaseRestrictionMessage, OrderRequest } from '../utils/purchase-verification';

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userCompany: string;
  targetId: string;
  targetType: 'item' | 'supplier';
  rating: number;
  review?: string;
  images?: string[];
  createdDate: string;
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface RatingDisplayProps {
  stats: RatingStats;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

interface RatingSubmissionProps {
  targetId: string;
  targetType: 'item' | 'supplier';
  targetName: string;
  onRatingSubmit: (rating: Omit<Rating, 'id' | 'createdDate'>) => void;
  existingRating?: Rating;
  disabled?: boolean;
  orders?: OrderRequest[];
}

interface InteractiveRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

// Star rating display component
export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  stats,
  size = 'md',
  showCount = true,
  className = ''
}) => {
  const starSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  const renderStars = () => {
    const stars = [];
    const rating = stats.averageRating;

    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.floor(rating);
      const partial = i === Math.ceil(rating) && rating % 1 !== 0;

      stars.push(
        <div key={i} className="relative">
          <Star
            className={`${starSize} ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
          {partial && (
            <Star
              className={`${starSize} absolute top-0 left-0 fill-yellow-400 text-yellow-400`}
              style={{
                clipPath: `inset(0 ${100 - ((rating % 1) * 100)}% 0 0)`
              }}
            />
          )}
        </div>
      );
    }

    return stars;
  };

  if (stats.totalRatings === 0) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`${starSize} text-gray-300`} />
          ))}
        </div>
        {showCount && <span className={textSize}>No ratings</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex gap-0.5">
        {renderStars()}
      </div>
      <span className={`${textSize} font-medium text-foreground`}>
        {stats.averageRating.toFixed(1)}
      </span>
      {showCount && (
        <div className="flex items-center gap-1">
          <Users className={`${starSize} text-muted-foreground`} />
          <span className={`${textSize} text-muted-foreground`}>
            ({stats.totalRatings})
          </span>
        </div>
      )}
    </div>
  );
};

// Interactive star rating for submission
export const InteractiveRating: React.FC<InteractiveRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  disabled = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'} transition-transform`}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          onClick={() => !disabled && onRatingChange(star)}
        >
          <Star
            className={`${starSize} ${star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
              }`}
          />
        </button>
      ))}
    </div>
  );
};

// Rating submission dialog
export const RatingSubmission: React.FC<RatingSubmissionProps> = ({
  targetId,
  targetType,
  targetName,
  onRatingSubmit,
  existingRating,
  disabled = false,
  orders = []
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || '');

  // Check if user can rate based on purchase history
  const ratingEligibility = canUserRate(user, targetType, targetId, orders);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit a rating');
      return;
    }

    const ratingData = {
      userId: user.email,
      userName: user.name,
      userCompany: user.company,
      targetId,
      targetType,
      rating,
      review: review.trim() || undefined
    };

    onRatingSubmit(ratingData);
    setIsOpen(false);

    toast.success(
      existingRating
        ? 'Rating updated successfully!'
        : 'Rating submitted successfully!'
    );
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  // Only retailers can submit ratings and only if they have purchased
  if (!user || user.role !== 'retailer') {
    return null;
  }

  // If user cannot rate, show disabled button with tooltip
  if (!ratingEligibility.canRate) {
    return (
      <div className="relative group">
        <Button
          variant="outline"
          size="sm"
          disabled={true}
          className="gap-2 opacity-50 cursor-not-allowed"
        >
          <Lock className="h-4 w-4" />
          {existingRating ? 'Update Rating' : 'Rate'}
        </Button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md border shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3 w-3 mt-0.5 text-muted-foreground" />
            <span>{ratingEligibility.reason}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Star className="h-4 w-4" />
          {existingRating ? 'Update Rating' : 'Rate'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRating ? 'Update Rating' : 'Rate'} {targetName}
          </DialogTitle>
          <DialogDescription>
            {existingRating
              ? 'Update your previous rating and review for this item or supplier.'
              : 'Share your experience to help other users make informed decisions.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Purchase verification notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can submit this rating because you have completed purchases {targetType === 'supplier' ? 'from this supplier' : 'of this product'}.
            </AlertDescription>
          </Alert>
          <div>
            <Label>Your Rating</Label>
            <div className="flex items-center gap-3 mt-2">
              <InteractiveRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
              {rating > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  {getRatingText(rating)}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience with this item/supplier..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={rating === 0}>
              {existingRating ? 'Update' : 'Submit'} Rating
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Detailed rating breakdown component
export const RatingBreakdown: React.FC<{ stats: RatingStats }> = ({ stats }) => {
  if (stats.totalRatings === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-center text-muted-foreground">No ratings yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {stats.averageRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-2">
            <RatingDisplay stats={stats} showCount={false} />
            <span className="text-sm text-muted-foreground">
              ({stats.totalRatings} ratings)
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution];
            const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-400 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Utility functions for rating calculations
export const calculateRatingStats = (ratings: Rating[]): RatingStats => {
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
};

export const getUserRating = (ratings: Rating[], userId: string): Rating | undefined => {
  return ratings.find(rating => rating.userId === userId);
};

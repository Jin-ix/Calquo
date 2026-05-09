import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Star,
  Camera,
  X,
  AlertCircle,
  Package,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';

// Extended Rating interface to include image
export interface ReviewRating {
  id: string;
  userId: string;
  userName: string;
  userCompany: string;
  targetId: string;
  targetType: 'item' | 'supplier';
  targetName: string;
  rating: number;
  review?: string;
  images?: string[]; // Array of image URLs for product reviews
  createdDate: string;
  updatedDate?: string;
}

export interface OrderReview {
  orderId: string;
  productRating?: ReviewRating;
  supplierRating?: ReviewRating;
  submittedDate: string;
  canEdit: boolean; // Based on 7-day edit window
}

interface Order {
  id: string;
  itemName: string;
  itemId: string;
  supplierName: string;
  supplierId: string;
  status: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  orderDate?: string;
}

interface RatingReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  existingReview?: OrderReview;
  onSubmit: (review: {
    orderId: string;
    productRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
    supplierRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
  }) => void;
}

interface InteractiveRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const InteractiveRating: React.FC<InteractiveRatingProps> = ({
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
              ? 'fill-black text-black'
              : 'text-zinc-200'
              }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

const ImageUpload: React.FC<{
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}> = ({ images, onImagesChange, maxImages = 5 }) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          if (newImages.length === filesToProcess) {
            onImagesChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover rounded-none border border-zinc-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800 focus:opacity-100"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div className="border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-black transition-colors rounded-none p-6">
          <label className="cursor-pointer block">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3 text-center">
              <Camera className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-900">
                  Upload Photos
                </p>
                <p className="text-xs text-zinc-500">
                  {images.length}/{maxImages} images • PNG, JPG up to 5MB
                </p>
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export const RatingReviewDialog: React.FC<RatingReviewDialogProps> = ({
  open,
  onOpenChange,
  order,
  existingReview,
  onSubmit
}) => {
  const { user } = useAuth();

  // Product rating state
  const [productRating, setProductRating] = useState(existingReview?.productRating?.rating || 0);
  const [productReview, setProductReview] = useState(existingReview?.productRating?.review || '');
  const [productImages, setProductImages] = useState<string[]>(existingReview?.productRating?.images || []);

  // Supplier rating state
  const [supplierRating, setSupplierRating] = useState(existingReview?.supplierRating?.rating || 0);
  const [supplierReview, setSupplierReview] = useState(existingReview?.supplierRating?.review || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order || !user) return null;

  const isEditing = !!existingReview;
  const canEdit = existingReview?.canEdit ?? true;

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

  const handleSubmit = async () => {
    // Validate that at least one rating is provided
    if (productRating === 0 && supplierRating === 0) {
      toast.error('Please provide at least one rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: {
        orderId: string;
        productRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
        supplierRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
      } = {
        orderId: order.id
      };

      // Add product rating if provided
      if (productRating > 0) {
        reviewData.productRating = {
          userId: user.email,
          userName: user.name,
          userCompany: user.company,
          targetId: order.itemId,
          targetType: 'item' as const,
          targetName: order.itemName,
          rating: productRating,
          review: productReview.trim() || undefined,
          images: productImages.length > 0 ? productImages : undefined
        };
      }

      // Add supplier rating if provided
      if (supplierRating > 0) {
        reviewData.supplierRating = {
          userId: user.email,
          userName: user.name,
          userCompany: user.company,
          targetId: order.supplierId,
          targetType: 'supplier' as const,
          targetName: order.supplierName,
          rating: supplierRating,
          review: supplierReview.trim() || undefined
        };
      }

      onSubmit(reviewData);
      onOpenChange(false);

      toast.success(
        isEditing
          ? 'Your review has been updated successfully!'
          : 'Thank you! Your review has been submitted.'
      );

    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyRating = productRating > 0 || supplierRating > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-none border border-zinc-200 shadow-2xl overflow-hidden bg-white max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl tracking-tight text-zinc-900 flex items-center gap-3">
              <Star className="h-6 w-6 text-black" strokeWidth={1.5} />
              {isEditing ? 'Edit Your Review' : 'Rate & Review'}
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
              {isEditing ? 'Update your rating and review for this order.' : 'Share your experience about the product and supplier.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto overflow-x-hidden flex-1">
          {/* Order Summary */}
          <div className="p-4 border-l-2 border-black bg-zinc-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-900 mb-1 flex items-center gap-2">
                <Package className="h-3 w-3" />
                {order.itemName}
              </p>
              <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                <span className="mr-3">Order #{order.id}</span>
                <span>From {order.supplierName}</span>
              </div>
            </div>
            <Badge className="rounded-none bg-zinc-200 text-zinc-800 text-[9px] uppercase tracking-widest font-bold border-none px-3 py-1 hover:bg-zinc-300">
              Delivered
            </Badge>
          </div>

          {!canEdit && (
            <div className="bg-orange-50 border border-orange-200 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <AlertCircle className="h-6 w-6 text-orange-600 shrink-0 mt-0.5 sm:mt-0" strokeWidth={1.5} />
              <div>
                <p className="font-serif text-lg text-orange-900">Review editing period expired</p>
                <p className="text-sm font-medium text-orange-700 mt-1">Reviews can only be edited within 7 days of submission.</p>
              </div>
            </div>
          )}

          {/* Product Rating Section */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4">
              <Package className="h-4 w-4" strokeWidth={1.5} />
              Rate Product
            </h3>

            <div className="space-y-8">
              <div>
                <Label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4 block">How would you rate this product?</Label>
                <div className="flex items-center gap-4">
                  <InteractiveRating
                    rating={productRating}
                    onRatingChange={setProductRating}
                    size="lg"
                    disabled={!canEdit}
                  />
                  {productRating > 0 && (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-black border-l border-zinc-200 pl-4 h-5 flex items-center">
                      {getRatingText(productRating)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="product-review" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 block">
                  Product Review (Optional)
                </Label>
                <Textarea
                  id="product-review"
                  placeholder="Share your thoughts about the product quality, fit, material, etc..."
                  value={productReview}
                  onChange={(e) => setProductReview(e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className="rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black resize-none"
                />
              </div>

              {canEdit && (
                <div>
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 block">Add Photos (Optional)</Label>
                  <ImageUpload
                    images={productImages}
                    onImagesChange={setProductImages}
                    maxImages={5}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Supplier Rating Section */}
          <div className="space-y-6 pt-6 border-t border-zinc-100">
            <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4">
              <Building2 className="h-4 w-4" strokeWidth={1.5} />
              Rate Supplier
            </h3>

            <div className="space-y-8">
              <div>
                <Label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4 block">How would you rate {order.supplierName}?</Label>
                <div className="flex items-center gap-4">
                  <InteractiveRating
                    rating={supplierRating}
                    onRatingChange={setSupplierRating}
                    size="lg"
                    disabled={!canEdit}
                  />
                  {supplierRating > 0 && (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-black border-l border-zinc-200 pl-4 h-5 flex items-center">
                      {getRatingText(supplierRating)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="supplier-review" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 block">
                  Supplier Review (Optional)
                </Label>
                <Textarea
                  id="supplier-review"
                  placeholder="Share your experience with the supplier's service, communication, delivery, etc..."
                  value={supplierReview}
                  onChange={(e) => setSupplierReview(e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className="rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-4 shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 px-8 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold"
          >
            Cancel
          </Button>
          {canEdit && (
            <Button
              onClick={handleSubmit}
              disabled={!hasAnyRating || isSubmitting}
              className="h-12 px-8 rounded-none bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.2em] text-[10px] font-bold border border-black min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-3" />
                  Submitting...
                </>
              ) : (
                isEditing ? 'Update Review' : 'Submit Review'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

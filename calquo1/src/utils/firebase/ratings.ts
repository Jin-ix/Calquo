/**
 * CALICO - Real Rating System
 * Replaces DemoRatingData with actual Firestore calls
 */

import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions, firebaseDb } from './config';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';

const functions = firebaseFunctions;
const db = firebaseDb;

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userCompany: string;
  targetId: string;
  targetType: 'item' | 'supplier';
  rating: number;
  review?: string;
  createdDate: string;
  images?: string[];
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

/**
 * Submit or update a rating
 */
export const submitRating = async (data: {
  orderId: string;
  productId?: string;
  supplierId?: string;
  targetType: 'item' | 'supplier';
  targetName: string;
  rating: number;
  reviewText?: string;
  images?: string[];
}) => {
  try {
    const submitRatingFn = httpsCallable(functions, 'submitRating');
    const result = await submitRatingFn(data);
    return result.data;
  } catch (error: any) {
    console.error('Submit rating error:', error);
    throw new Error(error.message || 'Failed to submit rating');
  }
};

/**
 * Get ratings for a product or supplier
 */
export const getRatingsForProduct = async (
  targetId: string,
  targetType: 'item' | 'supplier',
  limitCount: number = 5
): Promise<{
  stats: RatingStats;
  reviews: Rating[];
  hasMore: boolean;
}> => {
  try {
    const getRatingsFn = httpsCallable(functions, 'getRatingsForProduct');
    const result: any = await getRatingsFn({
      targetId,
      targetType,
      limit: limitCount
    });

    const data = result.data;
    
    return {
      stats: {
        averageRating: data.stats.average_rating || 0,
        totalRatings: data.stats.total_ratings || 0,
        ratingDistribution: data.stats.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      reviews: (data.reviews || []).map((review: any) => ({
        id: review.id,
        userId: review.user_id,
        userName: review.user_name,
        userCompany: review.company_id,
        targetId: review.target_id,
        targetType: review.target_type,
        rating: review.rating,
        review: review.review_text,
        createdDate: review.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        images: review.images || []
      })),
      hasMore: data.has_more || false
    };
  } catch (error: any) {
    console.error('Get ratings error:', error);
    
    // Return empty stats on error (silent failure for Phase 1)
    return {
      stats: {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      reviews: [],
      hasMore: false
    };
  }
};

/**
 * Moderate a review (admin only)
 */
export const moderateReview = async (
  reviewId: string,
  action: 'approve' | 'reject' | 'flag',
  reason?: string
) => {
  try {
    const moderateReviewFn = httpsCallable(functions, 'moderateReviews');
    const result = await moderateReviewFn({
      reviewId,
      action,
      reason
    });
    return result.data;
  } catch (error: any) {
    console.error('Moderate review error:', error);
    throw new Error(error.message || 'Failed to moderate review');
  }
};

/**
 * Get ratings for multiple products (batch)
 */
export const getRatingsForProducts = async (
  targetIds: string[],
  targetType: 'item' | 'supplier'
): Promise<Map<string, RatingStats>> => {
  const ratingsMap = new Map<string, RatingStats>();

  try {
    // Fetch rating stats from Firestore directly
    const statsQuery = query(
      collection(db, 'rating_stats'),
      where('target_type', '==', targetType),
      where('target_id', 'in', targetIds.slice(0, 10)) // Firestore limit
    );

    const snapshot = await getDocs(statsQuery);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      ratingsMap.set(data.target_id, {
        averageRating: data.average_rating || 0,
        totalRatings: data.total_ratings || 0,
        ratingDistribution: data.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    });

    // Fill in missing items with empty stats
    targetIds.forEach(id => {
      if (!ratingsMap.has(id)) {
        ratingsMap.set(id, {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    });

  } catch (error) {
    console.error('Get ratings for products error:', error);
    
    // Silent failure - return empty stats
    targetIds.forEach(id => {
      ratingsMap.set(id, {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    });
  }

  return ratingsMap;
};

/**
 * Get user's rating for a specific order/product
 */
export const getUserRatingForOrder = async (
  userId: string,
  orderId: string,
  targetId: string,
  targetType: 'item' | 'supplier'
): Promise<Rating | null> => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('user_id', '==', userId),
      where('order_id', '==', orderId),
      where('target_id', '==', targetId),
      where('target_type', '==', targetType),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(reviewsQuery);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      userId: data.user_id,
      userName: data.user_name,
      userCompany: data.company_id,
      targetId: data.target_id,
      targetType: data.target_type,
      rating: data.rating,
      review: data.review_text,
      createdDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      images: data.images || []
    };

  } catch (error) {
    console.error('Get user rating error:', error);
    return null;
  }
};

/**
 * Check if user can rate an order
 */
export const canUserRateOrder = async (
  userId: string,
  orderId: string
): Promise<{ canRate: boolean; reason?: string }> => {
  try {
    // Get order from Firestore
    const orderRef = collection(db, 'orders');
    const orderQuery = query(orderRef, where('id', '==', orderId), firestoreLimit(1));
    const orderSnapshot = await getDocs(orderQuery);

    if (orderSnapshot.empty) {
      return { canRate: false, reason: 'Order not found' };
    }

    const orderData = orderSnapshot.docs[0].data();

    // Check if order is delivered
    if (orderData.status !== 'delivered') {
      return { canRate: false, reason: 'Order must be delivered before rating' };
    }

    // Check if user is the buyer
    // (This requires checking user's company_id matches buyer_company_id)

    return { canRate: true };

  } catch (error) {
    console.error('Can user rate order error:', error);
    return { canRate: false, reason: 'Unable to verify eligibility' };
  }
};

// Export helper functions for backward compatibility
export const getRatingsByTargetId = async (
  targetId: string,
  targetType: 'item' | 'supplier'
): Promise<Rating[]> => {
  const result = await getRatingsForProduct(targetId, targetType, 100);
  return result.reviews;
};

export const getDemoRatingStats = async (
  targetId: string,
  targetType: 'item' | 'supplier'
): Promise<RatingStats> => {
  const result = await getRatingsForProduct(targetId, targetType, 1);
  return result.stats;
};

// Empty functions for removed demo data
export const getRecentReviews = async (limit: number = 5): Promise<Rating[]> => {
  return [];
};

export const getTopRatedItems = async (limit: number = 3): Promise<any[]> => {
  return [];
};

export const getTopRatedSuppliers = async (limit: number = 3): Promise<any[]> => {
  return [];
};

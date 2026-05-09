import { Rating, RatingStats } from './RatingSystem';

// Empty demo data - all cleared
export const demoUsers = {};

// Empty demo ratings arrays
export const demoStockRatings: Rating[] = [];
// Supplier ratings removed with demo data cleanup

// Empty combined ratings
export const allDemoRatings: Rating[] = [];

// Helper function to get ratings by target ID (returns empty array)
export const getRatingsByTargetId = (targetId: string, targetType: 'item' | 'supplier'): Rating[] => {
  return [];
};

// Helper function to get rating stats for a target (returns empty stats)
export const getDemoRatingStats = (targetId: string, targetType: 'item' | 'supplier'): RatingStats => {
  return {
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Empty demo arrays - all demo data removed
export const demoStockItems: any[] = [];

// Functions return empty arrays
export const getRecentReviews = (limit: number = 5): Rating[] => {
  return [];
};

export const getTopRatedItems = (limit: number = 3): any[] => {
  return [];
};

export const getTopRatedSuppliers = (limit: number = 3): any[] => {
  return [];
};

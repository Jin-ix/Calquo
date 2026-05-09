import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { firebaseDb } from './config';

export interface ReviewData {
    orderId: string;
    reviewerId: string;
    reviewerRole: 'buyer' | 'seller';
    targetId: string;
    rating: number;
    comment?: string;
    categories?: Record<string, number>;
    images?: string[];
    createdAt?: string;
}

const REVIEWS_COLLECTION = 'reviews';

export const reviewService = {
    // Add a new review
    addReview: async (reviewData: ReviewData) => {
        if (!firebaseDb) {
            console.warn('Firestore not available, adding review to mock storage/console');
            console.log('Review:', reviewData);
            return 'mock_review_id_' + Date.now();
        }

        try {
            const docRef = await addDoc(collection(firebaseDb, REVIEWS_COLLECTION), {
                ...reviewData,
                createdAt: new Date().toISOString(),
                timestamp: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    },

    // Check if an order has been reviewed by a specific user (or role)
    hasReviewedOrder: async (orderId: string, reviewerId: string): Promise<boolean> => {
        if (!firebaseDb) return false;

        try {
            const q = query(
                collection(firebaseDb, REVIEWS_COLLECTION),
                where('orderId', '==', orderId),
                where('reviewerId', '==', reviewerId)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking review status:', error);
            return false;
        }
    },

    // Get all reviews for an order
    getReviewsForOrder: async (orderId: string) => {
        if (!firebaseDb) return [];

        try {
            const q = query(
                collection(firebaseDb, REVIEWS_COLLECTION),
                where('orderId', '==', orderId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting reviews for order:', error);
            return [];
        }
    },
    // Get all reviews by a specific reviewer (e.g., all reviews I made as a seller)
    getReviewsByReviewer: async (reviewerId: string) => {
        if (!firebaseDb) return [];

        try {
            const q = query(
                collection(firebaseDb, REVIEWS_COLLECTION),
                where('reviewerId', '==', reviewerId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewData));
        } catch (error) {
            console.error('Error getting reviews by reviewer:', error);
            return [];
        }
    }
};

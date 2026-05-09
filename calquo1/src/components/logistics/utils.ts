import { doc, updateDoc } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { toast } from 'sonner@2.0.3';

export const updateOrderStatus = async (orderId: string, status: string) => {
  if (!firebaseDb) return;
  try {
    const orderRef = doc(firebaseDb, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    const statusText = status.replace('_', ' ');
    toast.success(`Order status updated to: ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`);
  } catch (error) {
    console.error('Error updating status:', error);
    toast.error('Failed to update status');
  }
};

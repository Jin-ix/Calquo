import React from 'react';
import { AddStockWizard } from './AddStockWizard';
import { EnhancedStockItem } from './EnhancedStockTypes';
import { useStock } from '../context/StockContext';
import { toast } from 'sonner';

interface EditStockFormProps {
  stock: EnhancedStockItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStockForm({ stock, isOpen, onClose }: EditStockFormProps) {
  const { updateStock } = useStock();

  if (!isOpen || !stock) return null;

  const handleStockUpdate = async (stockData: any) => {
    try {
      if (!stock.id) {
        toast.error("Cannot update stock without ID");
        return;
      }
      
      // Keep existing creation/seller data while updating content
      const updatedData = {
        ...stockData,
        updatedAt: new Date().toISOString()
      };

      const success = await updateStock(stock.id, updatedData);
      
      if (success) {
        onClose();
        // Toast is handled by updateStock usually, but we can add one if needed
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  return (
    <AddStockWizard 
      isEditing={true}
      initialStock={stock}
      onSubmit={handleStockUpdate} 
      onCancel={onClose}
      navigation={{
         currentPage: 'my-stock', // Default to my-stock context for edit
         onNavigate: (page) => {
             // For edit form, navigation usually means "cancel and go here"
             // But since AddStockWizard handles safe navigation internally,
             // we just need to ensure the parent knows we are closing.
             onClose();
         }
      }}
    />
  );
}

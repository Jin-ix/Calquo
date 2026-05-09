// Types for Item Set functionality
export interface SizeQuantity {
  sizeDetails: {
    ageCategory: 'Baby' | 'Kids' | 'Adult';
    genderCategory: 'Male' | 'Female' | 'Unisex';
    sizeType: 'alphabet' | 'numerical';
    size: string;
    displayName: string;
  };
  quantity: number;
  available: number; // Available stock for this size
}

export interface ItemSet {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  supplier: string;
  supplierType: 'manufacturer' | 'trader' | 'warehouse' | 'financial';
  location: string;
  dateAdded: string;
  
  // Set-specific properties
  sizeQuantities: SizeQuantity[]; // Array of size-quantity combinations in this set
  setPrice: number; // Price for the complete set
  singleShopSetPrice: number;
  multiShopSetPrice: number;
  minOrderSets: number; // Minimum number of sets to order
  totalPiecesInSet: number; // Total pieces across all sizes in one set
  
  // Image and offer properties
  images: string[];
  offerPrice?: number;
  offerType?: 'time' | 'quantity';
  offerTimeWeeks?: number;
  offerMinQuantity?: number;
  offerValidUntil?: string;
  offerCreatedDate?: string;
}

export interface SetOrderRequest {
  id: string;
  itemSetId: string;
  setName: string;
  numberOfSets: number; // How many complete sets ordered
  pricePerSet: number;
  totalAmount: number;
  buyerCompany: string;
  buyerEmail: string;
  buyerPhone: string;
  supplierName: string;
  supplierLocation: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'agent_pending';
  adminRemarks?: string;
  adminUpdatedDate?: string;
  
  // Set-specific details for order tracking
  setDetails: {
    color: string;
    sizeBreakdown: SizeQuantity[]; // Shows what sizes/quantities per set
    totalPiecesPerSet: number;
    totalPiecesOrdered: number; // numberOfSets * totalPiecesPerSet
  };
}

export interface SetPurchaseRequest {
  id: string;
  itemSetId: string;
  setName: string;
  numberOfSets: number;
  pricePerSet: number;
  totalAmount: number;
  buyerCompany: string;
  buyerGstNumber: string;
  sellerCompany: string;
  sellerGstNumber: string;
  status: 'PR-Created' | 'PR-Acknowledged' | 'PR-PaymentDone' | 'PR-PaymentValidated' | 
          'PR-ItemShipped' | 'PR-ItemReceived' | 'PR-Verified' | 'PR-Completed' | 'PR-Cancelled';
  createdDate: string;
  lastUpdated: string;
  daysUntilVerificationDeadline?: number;
  statusHistory: Array<{
    status: SetPurchaseRequest['status'];
    updatedBy: string;
    updatedDate: string;
    remarks: string;
  }>;
  
  // Set-specific details
  setDetails: {
    color: string;
    sizeBreakdown: SizeQuantity[];
    totalPiecesPerSet: number;
    totalPiecesOrdered: number;
  };
}

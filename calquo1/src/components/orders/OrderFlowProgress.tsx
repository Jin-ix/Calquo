import React from 'react';
import { Card, CardContent } from '../ui/card';
import { PurchaseRequest } from '../../types/purchaseTypes';
import {
  Package,
  CheckCircle2,
  CreditCard,
  Truck,
  PackageCheck,
  Eye
} from 'lucide-react';

interface OrderFlowProgressProps {
  role: string;
  order: PurchaseRequest;
}

export const OrderFlowProgress: React.FC<OrderFlowProgressProps> = ({ role, order }) => {
  // Define flows with status mappings for progress tracking
  const sellerDirectFlow = [
    { step: 1, label: 'Receive Request', icon: Package, color: 'text-blue-600', statuses: ['pending_seller_ack'] },
    { step: 2, label: 'Approve Order', icon: CheckCircle2, color: 'text-purple-600', statuses: ['seller_acknowledged'] },
    { step: 3, label: 'Await Payment', icon: CreditCard, color: 'text-yellow-600', statuses: ['awaiting_payment'] },
    { step: 4, label: 'Confirm Payment', icon: CheckCircle2, color: 'text-green-600', statuses: ['paid'] },
    { step: 5, label: 'Mark Pickup', icon: Truck, color: 'text-blue-600', statuses: ['confirmed'] },
    { step: 6, label: 'Delivered', icon: PackageCheck, color: 'text-purple-600', statuses: ['in_transit', 'delivered'] },
    { step: 7, label: 'Complete', icon: CheckCircle2, color: 'text-green-700', statuses: ['completed'] }
  ];

  const sellerFinanceFlow = [
    { step: 1, label: 'Receive Request', icon: Package, color: 'text-blue-600', statuses: ['pending_seller_ack'] },
    { step: 2, label: 'Approve Order', icon: CheckCircle2, color: 'text-purple-600', statuses: ['pending_multi_party_approval'] },
    { step: 3, label: 'Finance Approval', icon: CreditCard, color: 'text-yellow-600', statuses: ['pending_dual_approval', 'finance_approved_seller_pending', 'seller_approved_finance_pending'] },
    { step: 4, label: 'Order Confirmed', icon: CheckCircle2, color: 'text-green-600', statuses: ['paid', 'confirmed'] },
    { step: 5, label: 'Mark Pickup', icon: Truck, color: 'text-blue-600', statuses: ['in_transit'] },
    { step: 6, label: 'Delivered', icon: PackageCheck, color: 'text-purple-600', statuses: ['delivered'] },
    { step: 7, label: 'Complete', icon: CheckCircle2, color: 'text-green-700', statuses: ['completed'] }
  ];

  const buyerDirectFlow = [
    { step: 1, label: 'Place Order', icon: Package, color: 'text-blue-600', statuses: ['pending_seller_ack'] },
    { step: 2, label: 'Seller Ack', icon: CheckCircle2, color: 'text-purple-600', statuses: ['seller_acknowledged'] },
    { step: 3, label: 'Select Logistics', icon: Truck, color: 'text-blue-600', statuses: ['awaiting_payment'] },
    { step: 4, label: 'Make Payment', icon: CreditCard, color: 'text-yellow-600', statuses: ['paid'] },
    { step: 5, label: 'Confirmed', icon: CheckCircle2, color: 'text-green-600', statuses: ['confirmed'] },
    { step: 6, label: 'In Transit', icon: Truck, color: 'text-blue-600', statuses: ['in_transit'] },
    { step: 7, label: 'Receive & Confirm', icon: PackageCheck, color: 'text-green-700', statuses: ['delivered', 'completed'] }
  ];

  const buyerFinanceFlow = [
    { step: 1, label: 'Place Order', icon: Package, color: 'text-blue-600', statuses: ['pending_seller_ack'] },
    { step: 2, label: 'Seller Ack', icon: CheckCircle2, color: 'text-purple-600', statuses: ['seller_acknowledged'] },
    { step: 3, label: 'Select Logistics & Finance', icon: Truck, color: 'text-blue-600', statuses: ['pending_multi_party_approval'] },
    { step: 4, label: 'Finance Approval', icon: CreditCard, color: 'text-yellow-600', statuses: ['pending_dual_approval', 'finance_approved_seller_pending', 'seller_approved_finance_pending', 'paid'] },
    { step: 5, label: 'Confirmed', icon: CheckCircle2, color: 'text-green-600', statuses: ['confirmed'] },
    { step: 6, label: 'In Transit', icon: Truck, color: 'text-blue-600', statuses: ['in_transit'] },
    { step: 7, label: 'Receive & Confirm', icon: PackageCheck, color: 'text-green-700', statuses: ['delivered', 'completed'] }
  ];

  const logisticsFlow = [
    { step: 1, label: 'Assigned', icon: Package, color: 'text-blue-600', statuses: ['seller_acknowledged', 'pending_multi_party_approval'] },
    { step: 2, label: 'Accept Delivery', icon: CheckCircle2, color: 'text-purple-600', statuses: ['awaiting_payment'] },
    { step: 3, label: 'Await Payment', icon: CreditCard, color: 'text-yellow-600', statuses: ['paid'] },
    { step: 4, label: 'Ready for Pickup', icon: CheckCircle2, color: 'text-green-600', statuses: ['confirmed'] },
    { step: 5, label: 'Confirm Pickup', icon: PackageCheck, color: 'text-blue-600', statuses: ['in_transit'] },
    { step: 6, label: 'Mark Delivered', icon: Truck, color: 'text-purple-600', statuses: ['delivered'] },
    { step: 7, label: 'Complete', icon: CheckCircle2, color: 'text-green-700', statuses: ['completed'] }
  ];

  const financeFlow = [
    { step: 1, label: 'Request Received', icon: Package, color: 'text-blue-600', statuses: ['pending_multi_party_approval', 'pending_dual_approval'] },
    { step: 2, label: 'Review Details', icon: Eye, color: 'text-purple-600', statuses: ['seller_approved_finance_pending'] },
    { step: 3, label: 'Approve Financing', icon: CheckCircle2, color: 'text-green-600', statuses: ['finance_approved_seller_pending'] },
    { step: 4, label: 'Payment Processed', icon: CreditCard, color: 'text-yellow-600', statuses: ['paid', 'confirmed'] },
    { step: 5, label: 'Order Confirmed', icon: CheckCircle2, color: 'text-green-700', statuses: ['in_transit', 'delivered', 'completed'] }
  ];

  // Determine which flow to show
  const getFlow = () => {
    if (role === 'logistics_agent' || role === 'logistics-agent') {
      return logisticsFlow;
    } else if (role === 'financial_agent' || role === 'financial') {
      return financeFlow;
    } else if (role === 'supplier') {
      return order.financialAgentId ? sellerFinanceFlow : sellerDirectFlow;
    } else if (role === 'retailer' || role === 'trader') {
      return order.financialAgentId ? buyerFinanceFlow : buyerDirectFlow;
    }
    return sellerDirectFlow;
  };

  const flow = getFlow();

  // Status order for determining completion
  const statusOrder = [
    'pending_seller_ack',
    'seller_acknowledged',
    'pending_multi_party_approval',
    'awaiting_payment',
    'pending_dual_approval',
    'seller_approved_finance_pending',
    'finance_approved_seller_pending',
    'paid',
    'confirmed',
    'in_transit',
    'delivered',
    'completed'
  ];

  // Determine step state based on order status
  const getStepState = (step: any) => {
    const orderStatus = order.status;
    
    // Special case: if order is completed, mark ALL steps as completed
    if (orderStatus === 'completed') {
      return 'completed';
    }
    
    // Check if this step's status matches current order status
    if (step.statuses.includes(orderStatus)) {
      return 'current';
    }
    
    // Check if this step is completed
    const currentStatusIndex = statusOrder.indexOf(orderStatus);
    const stepStatusIndices = step.statuses.map((s: string) => statusOrder.indexOf(s)).filter(i => i !== -1);
    
    if (stepStatusIndices.length === 0) return 'pending';
    
    const maxStepIndex = Math.max(...stepStatusIndices);
    
    if (currentStatusIndex > maxStepIndex) {
      return 'completed';
    }
    
    return 'pending';
  };

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          Order Progress {order.financialAgentId && <span className="text-xs text-purple-600 font-normal">(via Financial Agent)</span>}
        </h4>
        
        <div className="flex items-center justify-between gap-1">
          {flow.map((item, idx) => {
            const Icon = item.icon;
            const state = getStepState(item);
            
            // Dynamic styling
            const circleClass = state === 'completed' 
              ? 'bg-green-600 border-green-600' 
              : state === 'current'
              ? `border-2 ${item.color} bg-white`
              : 'bg-gray-200 border-gray-300';
            
            const iconClass = state === 'completed'
              ? 'text-white'
              : state === 'current'
              ? item.color
              : 'text-gray-400';
            
            const labelClass = state === 'completed' || state === 'current'
              ? 'text-gray-900 font-medium'
              : 'text-gray-500';
            
            const lineClass = state === 'completed'
              ? 'bg-green-600'
              : 'bg-gray-300';
            
            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full border-2 ${circleClass} flex items-center justify-center mb-1.5 flex-shrink-0 transition-all ${state === 'current' ? 'ring-2 ring-offset-2 ring-blue-400 animate-pulse' : ''}`}>
                    {state === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <Icon className={`h-4 w-4 ${iconClass}`} />
                    )}
                  </div>
                  <span className={`text-xs text-center leading-tight ${labelClass}`}>{item.label}</span>
                </div>
                {idx < flow.length - 1 && (
                  <div className={`flex-shrink-0 w-8 h-0.5 ${lineClass} -mx-1 mt-[-20px] transition-all`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

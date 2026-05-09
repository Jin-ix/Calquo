import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Clock, Package, Truck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { resolveImageUrl } from '../../utils/imageUtils';

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: {
    orderNumber: string;
    itemName: string;
    quantity: number;
    buyerName: string;
    unitPrice?: number;
    totalAmount?: number;
    status: string;
    itemImage?: string;
  } | null;
}

interface OrderStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  description: string;
}

export function OrderConfirmationDialog({ isOpen, onClose, orderDetails }: OrderConfirmationDialogProps) {
  if (!orderDetails) {
    return null;
  }

  const orderStages: OrderStage[] = [
    {
      id: 'placed',
      label: 'Order Placed',
      icon: <CheckCircle className="h-4 w-4" />,
      status: 'completed',
      description: 'Order successfully created'
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      icon: <Clock className="h-4 w-4" />,
      status: 'current',
      description: 'Awaiting supplier confirmation'
    },
    {
      id: 'processing',
      label: 'Processing',
      icon: <Package className="h-4 w-4" />,
      status: 'pending',
      description: 'Items being prepared'
    },
    {
      id: 'shipped',
      label: 'Shipped',
      icon: <Truck className="h-4 w-4" />,
      status: 'pending',
      description: 'Items dispatched'
    },
    {
      id: 'delivered',
      label: 'Delivered',
      icon: <Star className="h-4 w-4" />,
      status: 'pending',
      description: 'Order completed'
    }
  ];

  const getStageColor = (status: OrderStage['status']) => {
    switch (status) {
      case 'completed':
        return 'text-white border-black bg-black';
      case 'current':
        return 'text-black border-black bg-white ring-1 ring-black ring-offset-2';
      case 'pending':
        return 'text-zinc-300 border-zinc-200 bg-zinc-50';
    }
  };

  const getLineColor = (fromStatus: OrderStage['status'], toStatus: OrderStage['status']) => {
    if (fromStatus === 'completed') {
      return 'bg-black';
    }
    return 'bg-zinc-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 rounded-none border border-zinc-200 shadow-2xl overflow-hidden bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Order Confirmation</DialogTitle>
          <DialogDescription>Order confirmation dialog showing order details and progress tracking</DialogDescription>
        </DialogHeader>

        {/* Order Number Banner with Contrast */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black text-white p-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-3xl tracking-tight">Order Confirmed</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-2">Your order has been successfully placed</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Order Reference</p>
              <p className="font-mono text-xl tracking-widest">{orderDetails.orderNumber || 'N/A'}</p>
            </div>
          </div>
        </motion.div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-zinc-200"
          >
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-900">Order Information</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
              <div className="flex gap-4 col-span-2 sm:col-span-1">
                <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 shrink-0 overflow-hidden">
                  {orderDetails.itemImage ? (
                    <img
                      src={resolveImageUrl(orderDetails.itemImage)}
                      alt={orderDetails.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <Package className="h-6 w-6 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Item Name</span>
                  <p className="font-serif text-lg text-zinc-900 truncate">{orderDetails.itemName || 'N/A'}</p>
                </div>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Quantity</span>
                <p className="font-medium text-zinc-900">{orderDetails.quantity || 0} units</p>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Buyer</span>
                <p className="font-medium text-zinc-900">{orderDetails.buyerName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Unit Price</span>
                <p className="font-medium text-zinc-900">₹{orderDetails.unitPrice?.toLocaleString() || '0'}</p>
              </div>

              <div className="col-span-2 pt-6 mt-2 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-900">Total Amount</span>
                  <p className="font-serif text-2xl text-zinc-900">₹{orderDetails.totalAmount?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Progress Line Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-zinc-200 p-6 bg-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-8">
              <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900">
                <Truck className="h-4 w-4" strokeWidth={1.5} />
                Order Progress
              </h3>
            </div>

            {/* Progress Line Graph */}
            <div className="relative mb-4">
              {/* Horizontal line container */}
              <div className="flex items-center justify-between relative">
                {orderStages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    {/* Stage Node */}
                    <div className="flex flex-col items-center relative z-10 w-24">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`
                          w-12 h-12 rounded-none border flex items-center justify-center
                          ${getStageColor(stage.status)}
                        `}
                      >
                        {React.cloneElement(stage.icon as React.ReactElement, { strokeWidth: stage.status === 'completed' ? 2 : 1.5 })}
                      </motion.div>

                      {/* Label */}
                      <div className="mt-4 text-center">
                        <p className={`text-[9px] uppercase font-bold tracking-widest leading-tight ${stage.status === 'completed' ? 'text-zinc-900' :
                          stage.status === 'current' ? 'text-black' :
                            'text-zinc-400'
                          }`}>
                          {stage.label}
                        </p>
                        <p className="text-[8px] uppercase tracking-widest font-bold text-zinc-400 mt-1 leading-tight max-w-[80px] mx-auto">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    {/* Connecting Line */}
                    {index < orderStages.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                        className={`
                          flex-1 h-[1px] absolute top-6 -z-0 origin-left
                          ${getLineColor(stage.status, orderStages[index + 1].status)}
                        `}
                        style={{
                          left: `calc(${(index * 100) / (orderStages.length - 1)}% + 3rem)`,
                          width: `calc(${100 / (orderStages.length - 1)}% - 6rem)`
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Current Status Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-10 pt-6 border-t border-zinc-100 flex items-start gap-4"
            >
              <div className="bg-zinc-50 border border-zinc-200 p-2 shrink-0">
                <Clock className="h-4 w-4 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-900 mb-1">
                  Current Status: Awaiting supplier confirmation
                </p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  You will receive notifications as your order progresses.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex gap-4 pt-4 border-t border-zinc-100"
          >
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold"
              onClick={onClose}
            >
              Continue Shopping
            </Button>
            <Button
              className="flex-1 h-12 rounded-none bg-black text-white hover:bg-zinc-900 border border-black uppercase tracking-[0.2em] text-[10px] font-bold"
            >
              Track Order
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

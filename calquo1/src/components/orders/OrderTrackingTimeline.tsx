import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Settings,
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';

export type OrderStatus = 'ordered' | 'processed' | 'shipped' | 'out-for-delivery' | 'delivered' | 'request_sent' | 'accepted' | 'confirmed' | 'rejected' | 'cancelled';

interface OrderStage {
  id: OrderStatus;
  label: string;
  icon: any;
  description: string;
}

interface OrderTrackingTimelineProps {
  currentStatus: OrderStatus;
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

const ORDER_STAGES: OrderStage[] = [
  {
    id: 'ordered',
    label: 'Ordered',
    icon: ShoppingCart,
    description: 'Order has been placed successfully'
  },
  {
    id: 'processed',
    label: 'Processed',
    icon: Settings,
    description: 'Order is being prepared for shipping'
  },
  {
    id: 'shipped',
    label: 'Shipped',
    icon: Package,
    description: 'Package has been dispatched'
  },
  {
    id: 'out-for-delivery',
    label: 'Out for Delivery',
    icon: Truck,
    description: 'Package is out for delivery'
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: CheckCircle,
    description: 'Package has been delivered'
  }
];

export function OrderTrackingTimeline({
  currentStatus,
  orderDate,
  estimatedDelivery,
  trackingNumber,
  className = '',
  layout = 'horizontal'
}: OrderTrackingTimelineProps) {
  const currentStageIndex = ORDER_STAGES.findIndex(stage => stage.id === currentStatus);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageStatus = (stageIndex: number) => {
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'current';
    return 'pending';
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-white bg-black border-black';
      case 'current':
        return 'text-black bg-white border-black';
      default:
        return 'text-zinc-300 bg-zinc-50 border-zinc-200';
    }
  };

  const getConnectorColor = (fromStatus: string, toStatus: string) => {
    if (fromStatus === 'completed') return 'bg-black';
    if (fromStatus === 'current' && toStatus !== 'pending') return 'bg-black';
    return 'bg-zinc-200';
  };

  if (layout === 'vertical') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-serif text-2xl tracking-tight text-zinc-900 mb-2">Order Tracking</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                  Ordered on {formatDate(orderDate)}
                </p>
              </div>
              {trackingNumber && (
                <Badge variant="outline" className="gap-2 rounded-none border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-widest font-mono text-zinc-600">
                  <MapPin className="h-3 w-3" strokeWidth={2} />
                  {trackingNumber}
                </Badge>
              )}
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-4">
              {ORDER_STAGES.map((stage, index) => {
                const status = getStageStatus(index);
                const IconComponent = stage.icon;
                const isLast = index === ORDER_STAGES.length - 1;

                return (
                  <div key={stage.id} className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-10 h-10 rounded-none border flex items-center justify-center transition-all duration-300 shadow-sm',
                        getStageColor(status),
                        status === 'current' && 'ring-1 ring-black ring-offset-2'
                      )}>
                        <IconComponent className="h-4 w-4" strokeWidth={status === 'completed' ? 2 : 1.5} />
                      </div>
                      {!isLast && (
                        <div className="w-[1px] h-8 mt-2 relative overflow-hidden bg-zinc-200">
                          {getConnectorColor(status, getStageStatus(index + 1)) !== 'bg-zinc-200' && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "100%" }}
                              transition={{ duration: 0.8, delay: index * 0.3, ease: "easeInOut" }}
                              className={cn(
                                'absolute top-0 left-0 w-full',
                                getConnectorColor(status, getStageStatus(index + 1))
                              )}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8 mt-0.5">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={cn(
                          'font-serif text-lg tracking-tight transition-colors',
                          status === 'completed' ? 'text-zinc-900' :
                            status === 'current' ? 'text-black' : 'text-zinc-400'
                        )}>
                          {stage.label}
                        </h4>
                        {status === 'current' && (
                          <Badge variant="secondary" className="rounded-none bg-black text-white text-[9px] uppercase tracking-widest font-bold">
                            Current
                          </Badge>
                        )}
                        {status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-black" strokeWidth={1.5} />
                        )}
                      </div>
                      <p className={cn(
                        'text-[10px] uppercase font-bold tracking-widest transition-colors',
                        status === 'pending' ? 'text-zinc-300' : 'text-zinc-500'
                      )}>
                        {stage.description}
                      </p>
                      {status === 'current' && stage.id === 'ordered' && (
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-900 mt-2 flex items-center gap-1.5 border border-zinc-200 w-fit px-2 py-1 bg-zinc-50">
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          Processing your order...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estimated Delivery */}
            {estimatedDelivery && (
              <div className="mt-8 p-4 bg-zinc-50 border border-zinc-200">
                <div className="flex items-center gap-3 text-zinc-900">
                  <Clock className="h-5 w-5" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    Estimated Delivery: {formatDate(estimatedDelivery)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Horizontal layout (default)
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-4 border-b border-zinc-100">
            <div>
              <h3 className="font-serif text-2xl tracking-tight text-zinc-900 mb-2">Order Tracking</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                Ordered on {formatDate(orderDate)}
              </p>
            </div>
            {trackingNumber && (
              <Badge variant="outline" className="gap-2 rounded-none border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-widest font-mono text-zinc-600">
                <MapPin className="h-3 w-3" strokeWidth={2} />
                {trackingNumber}
              </Badge>
            )}
          </div>

          {/* Horizontal Timeline */}
          <div className="flex items-center justify-between">
            {ORDER_STAGES.map((stage, index) => {
              const status = getStageStatus(index);
              const IconComponent = stage.icon;
              const isLast = index === ORDER_STAGES.length - 1;

              return (
                <React.Fragment key={stage.id}>
                  <div className="flex flex-col items-center text-center max-w-[120px]">
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-none border flex items-center justify-center mb-4 transition-all duration-300 shadow-sm',
                      getStageColor(status),
                      status === 'current' && 'ring-1 ring-black ring-offset-2 scale-110'
                    )}>
                      <IconComponent className="h-5 w-5" strokeWidth={status === 'completed' ? 2 : 1.5} />
                    </div>

                    {/* Label */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <h4 className={cn(
                          'font-serif tracking-tight text-base transition-colors',
                          status === 'completed' ? 'text-zinc-900' :
                            status === 'current' ? 'text-black' : 'text-zinc-400'
                        )}>
                          {stage.label}
                        </h4>
                        {status === 'completed' && (
                          <CheckCircle className="h-3 w-3 text-black" strokeWidth={2} />
                        )}
                      </div>
                      <p className={cn(
                        'text-[8px] uppercase tracking-widest font-bold leading-tight transition-colors',
                        status === 'pending' ? 'text-zinc-300' : 'text-zinc-500'
                      )}>
                        {stage.description}
                      </p>
                      {status === 'current' && (
                        <Badge variant="secondary" className="rounded-none bg-black text-white text-[8px] uppercase tracking-widest font-bold w-fit mx-auto mt-2">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="flex-1 flex items-center px-2">
                      <div className="w-full h-[1px] relative overflow-hidden bg-zinc-200">
                        {getConnectorColor(status, getStageStatus(index + 1)) !== 'bg-zinc-200' && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, delay: index * 0.3, ease: "easeInOut" }}
                            className={cn(
                              'absolute top-0 left-0 h-full',
                              getConnectorColor(status, getStageStatus(index + 1))
                            )}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Estimated Delivery */}
          {estimatedDelivery && (
            <div className="mt-8 p-4 bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-center gap-3 text-zinc-900">
                <Clock className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  Estimated Delivery: {formatDate(estimatedDelivery)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

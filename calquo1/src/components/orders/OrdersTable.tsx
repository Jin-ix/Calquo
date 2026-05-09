import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { OrderRequest } from './OrderDialog';
import { Eye, CreditCard, Truck } from 'lucide-react';

// Local helper as a fallback to prevent "is not a function" errors
const getSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.name || value.id || 'N/A';
  }
  return String(value);
};

interface OrdersTableProps {
  title: string;
  orders: OrderRequest[];
  showSupplierColumn?: boolean;
  showBuyerColumn?: boolean;
  onUpdateStatus?: (orderId: string, status: OrderRequest['status']) => void;
  onProcessPayment?: (orderId: string) => void;
}

export function OrdersTable({ 
  title, 
  orders, 
  showSupplierColumn = false,
  showBuyerColumn = false,
  onUpdateStatus,
  onProcessPayment 
}: OrdersTableProps) {
  const getStatusBadgeVariant = (status: OrderRequest['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: OrderRequest['paymentStatus']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">{orders.length} orders</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Amount</TableHead>
                  {showSupplierColumn && <TableHead>Supplier</TableHead>}
                  {showBuyerColumn && <TableHead>Buyer</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      #{order.id.slice(-8)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {getSafeString(order.stockName)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.quantity} pcs
                    </TableCell>
                    <TableCell className="text-sm">
                      ₹{order.totalAmount.toLocaleString()}
                    </TableCell>
                    {showSupplierColumn && (
                      <TableCell className="text-sm">{getSafeString(order.supplierName)}</TableCell>
                    )}
                    {showBuyerColumn && (
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{getSafeString(order.buyerName)}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{getSafeString(order.buyerCompany)}</div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} className="text-[10px] h-5">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="text-[10px] h-5">
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {order.paymentMethod === 'upi' ? 'UPI' : 'Bank'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {onProcessPayment && order.paymentStatus === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onProcessPayment(order.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onUpdateStatus && order.status === 'confirmed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onUpdateStatus(order.id, 'shipped')}
                            className="h-8 w-8 p-0"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

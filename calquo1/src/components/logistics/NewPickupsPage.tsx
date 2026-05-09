import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { MapPin, Package, ArrowLeft } from 'lucide-react';
import { updateOrderStatus } from './utils';

interface NewPickupsPageProps {
  onBack: () => void;
}

export function NewPickupsPage({ onBack }: NewPickupsPageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profile?.gstNumber || !firebaseDb) return;

    const q = query(
      collection(firebaseDb, 'orders'),
      where('logisticsAgentGst', '==', user.profile.gstNumber),
      where('status', '==', 'confirmed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatAddress = (order: any) => {
    if (order.pickupAddress) return order.pickupAddress;
    if (order.sellerAddress) return `${order.sellerAddress.street}, ${order.sellerAddress.city}`;
    return 'Address not available';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Pickups</h1>
          <p className="text-sm text-gray-500">Orders waiting for acceptance</p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Pickup Address</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No new pickup requests
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId || order.id.slice(0, 8)}</TableCell>
                    <TableCell>{order.buyerCompany || order.retailerName}</TableCell>
                    <TableCell>{order.sellerCompany || order.manufacturerName}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={formatAddress(order)}>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {formatAddress(order)}
                      </div>
                    </TableCell>
                    <TableCell>₹{order.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        className="text-white hover:opacity-90 bg-[#FF8C42]"
                        onClick={() => updateOrderStatus(order.id, 'pickup_scheduled')}
                      >
                        Accept Pickup
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

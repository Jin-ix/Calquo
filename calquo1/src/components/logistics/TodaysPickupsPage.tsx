import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { MapPin, ArrowLeft, Truck } from 'lucide-react';
import { updateOrderStatus } from './utils';

interface TodaysPickupsPageProps {
  onBack: () => void;
}

export function TodaysPickupsPage({ onBack }: TodaysPickupsPageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profile?.gstNumber || !firebaseDb) return;

    // Fetch orders that are scheduled for pickup
    const q = query(
      collection(firebaseDb, 'orders'),
      where('logisticsAgentGst', '==', user.profile.gstNumber),
      where('status', '==', 'pickup_scheduled')
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
          <h1 className="text-2xl font-bold text-gray-900">Today's Pickups</h1>
          <p className="text-sm text-gray-500">Scheduled for pickup</p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No scheduled pickups
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId || order.id.slice(0, 8)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {formatAddress(order)}
                      </div>
                    </TableCell>
                    <TableCell>{order.sellerCompany}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        Scheduled
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        onClick={() => updateOrderStatus(order.id, 'picked_up')}
                      >
                        Mark Picked Up
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

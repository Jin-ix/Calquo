import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { MapPin, ArrowLeft, Clock } from 'lucide-react';
import { updateOrderStatus } from './utils';

interface InTransitPageProps {
  onBack: () => void;
}

export function InTransitPage({ onBack }: InTransitPageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profile?.gstNumber || !firebaseDb) return;

    const q = query(
      collection(firebaseDb, 'orders'),
      where('logisticsAgentGst', '==', user.profile.gstNumber),
      where('status', '==', 'picked_up')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">In Transit</h1>
          <p className="text-sm text-gray-500">Orders currently on the way</p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Picked Up</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No orders in transit
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId || order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                       <span className="flex items-center gap-1 text-sm text-gray-500">
                         <MapPin className="h-3 w-3" />
                         Customer Location
                       </span>
                    </TableCell>
                    <TableCell>{order.buyerCompany}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(order.updatedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        className="text-white hover:opacity-90 bg-[#FF8C42]"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                      >
                        Mark Delivered
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

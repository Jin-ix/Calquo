import React, { useEffect } from 'react';
import { useNotifications } from './NotificationSystem';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// This component demonstrates major notifications and can be used for testing
export const DemoNotifications: React.FC = () => {
  const { 
    notifyOrderConfirmed,
    notifyOrderShipped,
    notifyOrderDelivered,
    notifyPurchaseRequestAccepted,
    notifyPurchaseRequestRejected,
    notifyStockAvailable,
    notifySystemAnnouncement
  } = useNotifications();
  
  const { user } = useAuth();

  // Simulate some initial notifications based on user role
  useEffect(() => {
    if (!user) return;

    // Add a welcome notification
    const timer = setTimeout(() => {
      notifySystemAnnouncement(
        'Welcome to CALICO!',
        `Welcome back, ${user.profile.fullName}! Check out the latest updates in your dashboard.`,
        'medium'
      );
    }, 2000);

    // Add role-specific demo notifications
    const roleTimer = setTimeout(() => {
      if (user.role === 'retailer') {
        notifyOrderConfirmed(
          'ORD-001',
          'Cotton Blend Fabrics (Mixed Colors)',
          15600,
          'retailer'
        );
        
        setTimeout(() => {
          notifyStockAvailable(
            'Silk Scarves Collection',
            50,
            'Bangalore Silk House',
            'retailer'
          );
        }, 3000);
      } else if (user.role === 'manufacturer') {
        notifyPurchaseRequestAccepted(
          'REQ-001',
          'Denim Fabric Rolls',
          'Ahmedabad Denim Co.',
          'manufacturer'
        );
      } else if (user.role === 'financial') {
        notifySystemAnnouncement(
          'Payment Processing Update',
          'New payment requests are pending approval. Please review them in your dashboard.',
          'high'
        );
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(roleTimer);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Demo Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifyOrderConfirmed('ORD-' + Date.now(), 'Premium Cotton Fabric', 25000)}
        >
          🎉 Trigger Order Confirmed
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifyOrderShipped('ORD-' + Date.now(), 'Silk Blend Textiles', 'TRK-' + Date.now())}
        >
          📦 Trigger Order Shipped
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifyOrderDelivered('ORD-' + Date.now(), 'Designer Fabrics Set')}
        >
          ✅ Trigger Order Delivered
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifyPurchaseRequestAccepted('REQ-' + Date.now(), 'Handloom Textiles', 'Chennai Weavers')}
        >
          ✅ Trigger Purchase Accepted
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifyPurchaseRequestRejected('REQ-' + Date.now(), 'Synthetic Fabrics', 'Insufficient stock availability')}
        >
          ❌ Trigger Purchase Rejected
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifyStockAvailable('Premium Wool Collection', 200, 'Kashmir Textiles')}
        >
          📦 Trigger Stock Available
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => notifySystemAnnouncement('System Maintenance', 'Scheduled maintenance on Sunday from 2-4 AM IST', 'high')}
        >
          📢 Trigger System Announcement
        </Button>
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useBanner } from '../context/BannerProvider';
import { useAuth } from '../auth/AuthProvider';
import { Eye, EyeOff, Users, RefreshCw } from 'lucide-react';

/**
 * Test component to demonstrate banner synchronization across roles
 * This shows how banners updated by Admin are immediately visible to all roles
 */
export function BannerTestComponent() {
  const { banners } = useBanner();
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [updateCount, setUpdateCount] = useState<number>(0);

  // Listen for banner update events to show real-time synchronization
  useEffect(() => {
    const handleBannerUpdate = () => {
      setLastUpdate(Date.now());
      setUpdateCount(prev => prev + 1);
    };

    const handleBannerPublished = () => {
      setLastUpdate(Date.now());
      setUpdateCount(prev => prev + 1);
    };

    const handleCrossTabUpdate = () => {
      setLastUpdate(Date.now());
      setUpdateCount(prev => prev + 1);
    };

    window.addEventListener('banner-updated', handleBannerUpdate);
    window.addEventListener('banner-published', handleBannerPublished);
    window.addEventListener('banner-cross-tab-update', handleCrossTabUpdate);
    
    return () => {
      window.removeEventListener('banner-updated', handleBannerUpdate);
      window.removeEventListener('banner-published', handleBannerPublished);
      window.removeEventListener('banner-cross-tab-update', handleCrossTabUpdate);
    };
  }, []);

  // Filter banners for the current user role (same logic as AnnouncementBanner)
  const relevantBanners = banners.filter(banner => {
    if (user?.role === 'admin' || user?.role === 'super-admin') return true; // Admin can see all banners
    return banner.isActive && banner.targetRoles.includes(user?.role || 'retailer');
  });

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Banner Synchronization Status
          {updateCount > 0 && (
            <Badge variant="outline" className="text-xs ml-auto flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {updateCount} updates
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live view of banners visible to <Badge variant="outline">{user?.role}</Badge> role
          {updateCount > 0 && (
            <span className="ml-2 text-xs text-green-600">
              • Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Total Banners in System:</span>
            <Badge variant="secondary">{banners.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Active Banners:</span>
            <Badge variant="outline">{banners.filter(b => b.isActive).length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Visible to Current Role:</span>
            <Badge variant="default">{relevantBanners.length}</Badge>
          </div>
          
          {relevantBanners.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Visible Banners:</h4>
              <div className="space-y-2">
                {relevantBanners.map((banner) => (
                  <div 
                    key={banner.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{banner.title}</p>
                      <p className="text-xs text-muted-foreground">{banner.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {banner.isActive ? (
                        <Eye className="h-3 w-3 text-green-600" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {banner.targetRoles.length} roles
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700">
              ✅ <strong>Synchronization Active:</strong> Changes made by Admin are instantly reflected here and in the announcement banner above.
            </p>
          </div>
          
          {updateCount > 0 && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <RefreshCw className="h-3 w-3 inline mr-1" />
                <strong>Real-time Updates:</strong> {updateCount} events • Last: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

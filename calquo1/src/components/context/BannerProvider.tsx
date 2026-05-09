import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  action: string;
  actionText: string;
  badge?: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  targetRoles: string[];
}

interface BannerContextType {
  banners: BannerItem[];
  setBanners: (banners: BannerItem[]) => void;
  addBanner: (banner: BannerItem) => void;
  updateBanner: (bannerId: string, updates: Partial<BannerItem>) => void;
  deleteBanner: (bannerId: string) => void;
  toggleBannerStatus: (bannerId: string) => void;
  publishBannerChanges: (banner: BannerItem) => Promise<void>;
  isPublishing: boolean;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function useBanner() {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}

// Mock initial banner data - in production this would come from your backend API
const initialBanners: BannerItem[] = [
  {
    id: '1',
    title: 'Festival Season Sale',
    subtitle: 'Up to 50% Off on Premium Apparels',
    description: 'Celebrate this festive season with exclusive discounts on ethnic wear, designer collections, and traditional garments from verified manufacturers.',
    image: 'https://images.unsplash.com/photo-1734509604063-0908ef21fa7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmZXN0aXZhbCUyMGNsb3RoaW5nJTIwYmFubmVyfGVufDF8fHx8MTc1NzE2ODcxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    action: 'browse-stock',
    actionText: 'Shop Festival Collection',
    badge: 'Limited Time',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-pink-600',
    textColor: 'text-white',
    isActive: true,
    validFrom: '2024-10-01',
    validTo: '2024-11-15',
    targetRoles: ['retailer', 'trader']
  },
  {
    id: '2',
    title: 'Sustainable Fashion Initiative',
    subtitle: 'Go Green with Eco-Friendly Apparel',
    description: 'Join the sustainable fashion movement. Discover eco-friendly fabrics, organic cotton, and zero-waste manufacturing processes.',
    image: 'https://images.unsplash.com/photo-1588770238925-31c80ffccb9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb24lMjBlY28lMjBmcmllbmRseXxlbnwxfHx8fDE3NTcxNTQ2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    action: 'suppliers',
    actionText: 'Find Eco Suppliers',
    badge: 'Eco Friendly',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    textColor: 'text-white',
    isActive: true,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    targetRoles: ['manufacturer', 'retailer', 'trader']
  },
  {
    id: '3',
    title: 'New Supplier Onboarding',
    subtitle: 'Join 10,000+ Verified Suppliers',
    description: 'Expand your business network. Connect with manufacturers, traders, and retailers across India. Multi-language support available.',
    image: 'https://images.unsplash.com/photo-1683735450924-ee9bc0a0cdf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN8aHx3aG9sZXNhbGUlMjBjbG90aGluZyUyMGJ1c2luZXNzfGVufDF8fHx8MTc1NzE2ODcyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    action: 'suppliers',
    actionText: 'Explore Network',
    badge: 'Growing',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
    textColor: 'text-white',
    isActive: true,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    targetRoles: ['retailer', 'trader', 'manufacturer']
  },
  {
    id: '4',
    title: 'Advanced Analytics Dashboard',
    subtitle: 'Make Data-Driven Decisions',
    description: 'Get insights into your sales, inventory, and market trends. Advanced reporting tools to help grow your apparel business.',
    image: 'https://images.unsplash.com/photo-1684259499086-93cb3e555803?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN8aHx0ZXh0aWxlJTIwbWFudWZhY3R1cmVyJTIwcHJvbW90aW9ufGVufDF8fHx8MTc1NzE2ODcxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    action: 'dashboard',
    actionText: 'View Analytics',
    badge: 'Pro Feature',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
    textColor: 'text-white',
    isActive: true,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    targetRoles: ['manufacturer', 'trader', 'retailer']
  },
  {
    id: '5',
    title: 'Multi-Language Support',
    subtitle: 'Shop in Your Native Language',
    description: 'Experience CALIQUO in 8 major Indian languages. Hindi, English, Tamil, Telugu, Gujarati, Marathi, Bengali, and Kannada supported.',
    image: 'https://images.unsplash.com/photo-1464854860390-e95991b46441?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHN8aHxmYXNoaW9uJTIwYXBwYXJlbCUyMHNhbGUlMjBiYW5uZXJ8ZW58MXx8fHwxNzU3MTY4NzEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    action: 'settings',
    actionText: 'Change Language',
    badge: '8 Languages',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-cyan-600',
    textColor: 'text-white',
    isActive: true,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    targetRoles: ['retailer', 'trader', 'manufacturer', 'financial', 'admin']
  }
];

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBannersState] = useState<BannerItem[]>(initialBanners);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load banners from localStorage on mount (simulating API call)
  useEffect(() => {
    const savedBanners = localStorage.getItem('calico-banners');
    if (savedBanners) {
      try {
        const parsed = JSON.parse(savedBanners);
        // Ensure backwards compatibility with older local storage data
        const patchedBanners = parsed.map((banner: BannerItem, index: number) => ({
          ...banner,
          gradientFrom: banner.gradientFrom || initialBanners[index % initialBanners.length].gradientFrom,
          gradientTo: banner.gradientTo || initialBanners[index % initialBanners.length].gradientTo,
          textColor: banner.textColor || 'text-white'
        }));
        setBannersState(patchedBanners);
      } catch (error) {
        console.warn('Failed to parse saved banners, using defaults');
        setBannersState(initialBanners);
      }
    }
  }, []);

  // Save banners to localStorage whenever they change (simulating API persistence)
  useEffect(() => {
    try {
      localStorage.setItem('calico-banners', JSON.stringify(banners));

      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(new CustomEvent('banner-storage-update', {
        detail: { banners, timestamp: Date.now() }
      }));
    } catch (error) {
      console.warn('Failed to save banners to localStorage:', error);
    }
  }, [banners]);

  // Listen for cross-tab changes (simplified)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'calico-banners' && event.newValue) {
        try {
          const updatedBanners = JSON.parse(event.newValue);
          setBannersState(updatedBanners);

          // Simple notification to other components
          window.dispatchEvent(new CustomEvent('banner-cross-tab-update'));
        } catch (error) {
          console.warn('Failed to sync banners from other tab');
        }
      }
    };

    const handleCustomUpdate = (event: CustomEvent) => {
      if (event.detail?.banners && event.detail.banners !== banners) {
        setBannersState(event.detail.banners);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('banner-storage-update', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('banner-storage-update', handleCustomUpdate as EventListener);
    };
  }, [banners]);

  const setBanners = (newBanners: BannerItem[]) => {
    setBannersState(newBanners);
  };

  const addBanner = (banner: BannerItem) => {
    setBannersState(prev => [...prev, banner]);
    toast.success('Banner added successfully', {
      description: 'The new banner has been created and is ready for editing.'
    });
  };

  const updateBanner = (bannerId: string, updates: Partial<BannerItem>) => {
    setBannersState(prev =>
      prev.map(banner =>
        banner.id === bannerId ? { ...banner, ...updates } : banner
      )
    );
  };

  const deleteBanner = (bannerId: string) => {
    const bannerToDelete = banners.find(b => b.id === bannerId);
    if (!bannerToDelete) return;

    if (window.confirm(`Are you sure you want to delete "${bannerToDelete.title}"? This action cannot be undone.`)) {
      setBannersState(prev => prev.filter(banner => banner.id !== bannerId));
      toast.success('Banner deleted successfully', {
        description: `"${bannerToDelete.title}" has been removed from all role dashboards.`
      });
    }
  };

  const toggleBannerStatus = (bannerId: string) => {
    const bannerToToggle = banners.find(b => b.id === bannerId);
    if (!bannerToToggle) return;

    const newStatus = !bannerToToggle.isActive;

    setBannersState(prev =>
      prev.map(banner =>
        banner.id === bannerId
          ? { ...banner, isActive: newStatus }
          : banner
      )
    );

    // Dispatch event to notify all components immediately
    window.dispatchEvent(new CustomEvent('banner-updated', {
      detail: { bannerId, isActive: newStatus }
    }));

    toast.success(
      `Banner ${bannerToToggle.isActive ? 'deactivated' : 'activated'}`, {
      description: `"${bannerToToggle.title}" is now ${newStatus ? 'visible to' : 'hidden from'} all user dashboards.`
    }
    );
  };

  const publishBannerChanges = async (banner: BannerItem): Promise<void> => {
    setIsPublishing(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the banner in the global state
      updateBanner(banner.id, banner);

      // Single event to notify all components
      window.dispatchEvent(new CustomEvent('banner-published', {
        detail: { bannerId: banner.id, banner }
      }));

      toast.success('Banner published successfully!', {
        description: 'Changes are now live across all user dashboards.'
      });

    } catch (error) {
      toast.error('Failed to publish banner changes', {
        description: 'Please try again.'
      });
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  const value: BannerContextType = {
    banners,
    setBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    publishBannerChanges,
    isPublishing
  };

  return (
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Star, Sparkles, ArrowRight, Edit, Save, Plus, Upload, Trash2, Eye, EyeOff, Image, Copy } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useBanner, BannerItem } from '../context/BannerProvider';
import { cn } from '../ui/utils';
import { safeDispatchEvent } from '../utils/timeout-protection';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// Custom CSS for hidden scrollbar
const style = document.createElement('style');
style.innerHTML = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

// --- Subcomponent for Individual Scrolling Banner ---
const ScrollBannerItem = ({
  banner,
  index,
  isAdmin,
  isActiveBanner,
  onEdit,
  onClone,
  onToggleStatus,
  onDelete,
  onClick,
  onInView
}: {
  banner: BannerItem;
  index: number;
  isAdmin: boolean;
  isActiveBanner: boolean;
  onEdit: () => void;
  onClone: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onClick: () => void;
  onInView: (index: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Track when this specific banner is mostly visible in the scroll container
  const isInView = useInView(ref, { amount: 0.6 });

  useEffect(() => {
    if (isInView) {
      onInView(index);
    }
  }, [isInView, index, onInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: isActiveBanner ? 1 : 0.6, 
        scale: isActiveBanner ? 1 : 0.92,
        y: 0,
        filter: isActiveBanner ? 'blur(0px)' : 'blur(4px)'
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex-none w-[92vw] md:w-[85vw] lg:w-[950px] h-[450px] md:h-[500px] snap-center shrink-0 rounded-3xl overflow-hidden group/banner bg-zinc-950 border transition-colors duration-700",
        isActiveBanner ? "border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]" : "border-white/5"
      )}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer flex flex-col justify-end overflow-hidden"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Parallax Background Image with slow continuous zoom */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner.image})` }}
          animate={{ scale: isActiveBanner ? [1.05, 1.1] : 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        />

        {/* Protection Gradients for Text - Extremely dark for 100% readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent" />

        {/* Shimmering Overlay Effect */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

        {/* Advanced Glowing Orbs inside the card */}
        <motion.div 
          className={cn(`absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br ${banner.gradientFrom} rounded-full mix-blend-screen filter blur-[100px] opacity-40`)}
          animate={{ 
            x: isActiveBanner ? [0, 50, 0] : 0, 
            y: isActiveBanner ? [0, 30, 0] : 0 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className={cn(`absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl ${banner.gradientTo} rounded-full mix-blend-screen filter blur-[100px] opacity-40`)}
          animate={{ 
            x: isActiveBanner ? [0, -40, 0] : 0, 
            y: isActiveBanner ? [0, -50, 0] : 0 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-end md:justify-center p-6 md:p-14 z-30 w-full max-w-7xl mx-auto">
          
          <div className="relative w-full md:max-w-[70%] lg:max-w-[60%] flex flex-col justify-center">
            
            <AnimatePresence>
              {isActiveBanner && (
                <>
                  {/* Animated Badge */}
                  {banner.badge && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="mb-6 md:mb-8 self-start flex-shrink-0 relative"
                    >
                      <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                      <Badge variant="secondary" className="bg-white/10 backdrop-blur-xl border border-white/30 text-white px-5 py-2 md:px-6 md:py-2.5 font-black tracking-[0.25em] uppercase text-xs rounded-full shadow-2xl relative z-10">
                        <Sparkles className="h-4 w-4 mr-3 text-white inline-block animate-pulse" />
                        {banner.badge}
                      </Badge>
                    </motion.div>
                  )}

                  {/* High-Impact Title */}
                  <motion.h2
                    className="font-black tracking-tighter leading-[1.05] text-white mb-4 md:mb-6 text-5xl md:text-6xl lg:text-7xl font-sans"
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
                  >
                    {banner.title}
                  </motion.h2>

                  {/* Bright, Readable Subtitle */}
                  {banner.subtitle && (
                    <motion.h3
                      className="text-[#E2E8F0] font-bold tracking-wide mb-6 md:mb-8 text-xl md:text-3xl"
                      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {banner.subtitle}
                    </motion.h3>
                  )}

                  {/* Description */}
                  {banner.description && (
                    <motion.p
                      className="text-zinc-300 leading-relaxed font-medium text-base md:text-lg mb-10 max-w-xl"
                      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {banner.description}
                    </motion.p>
                  )}

                  {/* Action Area */}
                  <motion.div
                    className="mt-auto flex items-center justify-start"
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {!isAdmin && (
                      <Button
                        variant="default"
                        className="bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.15em] h-14 md:h-16 px-8 md:px-10 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] text-sm md:text-base relative overflow-hidden group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                        <span className="relative z-10">{banner.actionText || 'Explore Selection'}</span>
                        <ArrowRight className="h-5 w-5 ml-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Admin Overlay Controls */}
        {isAdmin && (
          <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50 flex gap-3 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500">
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-2xl border border-white/20 text-white shadow-2xl transition-all hover:scale-110" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-2xl border border-white/20 text-white shadow-2xl transition-all hover:scale-110" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClone(); }}>
              <Copy className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-2xl border border-white/20 text-white shadow-2xl transition-all hover:scale-110" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleStatus(); }}>
              {banner.isActive ? <EyeOff className="h-5 w-5 text-orange-300" /> : <Eye className="h-5 w-5 text-green-300" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-black/60 hover:bg-red-500/90 backdrop-blur-2xl border border-white/20 text-white shadow-2xl transition-all hover:scale-110" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Status Indicator for Admin */}
        {isAdmin && (
          <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
            <Badge className={cn("backdrop-blur-2xl shadow-2xl border px-4 py-2 text-xs uppercase tracking-[0.2em] font-black", banner.isActive ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-black/80 text-white/50 border-white/20")}>
              {banner.isActive ? 'Live' : 'Draft'}
            </Badge>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const {
    banners,
    addBanner,
    publishBannerChanges,
    toggleBannerStatus,
    deleteBanner,
    isPublishing
  } = useBanner();

  const [isEditing, setIsEditing] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());

  // State to track which banner is currently dominating the view
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBannerUpdate = () => setLastUpdateTimestamp(Date.now());
    const handleBannerPublished = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail) {
        setLastUpdateTimestamp(Date.now());
        if (!isAdmin && event.detail.banner?.isActive) {
          toast.success('New announcement available!');
        }
      }
    };
    window.addEventListener('banner-updated', handleBannerUpdate);
    window.addEventListener('banner-published', handleBannerPublished);
    window.addEventListener('banner-cross-tab-update', handleBannerUpdate);
    return () => {
      window.removeEventListener('banner-updated', handleBannerUpdate);
      window.removeEventListener('banner-published', handleBannerPublished);
      window.removeEventListener('banner-cross-tab-update', handleBannerUpdate);
    };
  }, [isAdmin]);

  const activeBanners = useMemo(() => {
    const filtered = banners.filter(banner => {
      if (isAdmin) return true;
      return banner.isActive && banner.targetRoles.includes(user?.role || 'retailer');
    });
    // Duplicate banners for infinite carousel scroll effect
    return [...filtered, ...filtered];
  }, [banners, isAdmin, user?.role, lastUpdateTimestamp]);

  // Continuous auto-scroll logic
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activeBanners.length === 0) return;

    let animationId: number;
    // Base scroll speed (pixels per frame)
    const speed = 0.5;

    const scrollLoop = () => {
      // Pause if user is hovering or touching
      if (container.dataset.hovered !== 'true') {
        container.scrollLeft += speed;
        
        // Infinite loop logic: if we've scrolled past the midpoint (the first set of banners)
        // silently jump back to the beginning.
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scrollLoop);
    };

    animationId = requestAnimationFrame(scrollLoop);

    return () => cancelAnimationFrame(animationId);
  }, [activeBanners.length]);

  const handleBannerClick = (action: string) => {
    if (!isAdmin) {
      safeDispatchEvent(window, new CustomEvent('navigate', { detail: action }));
    }
  };

  // removed scroll functions as carousel uses CSS animation

  const handleEditBanner = (banner: BannerItem) => {
    setEditingBanner({ ...banner });
    setIsEditing(true);
  };

  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    try {
      await publishBannerChanges(editingBanner);
      setIsEditing(false);
      setEditingBanner(null);
    } catch (error) { }
  };

  const handleAddNewBanner = () => {
    const newBanner: BannerItem = {
      id: Date.now().toString(),
      title: 'New Premium Event',
      subtitle: 'Exclusive Collection',
      description: 'Discover the latest premium trends and apparel hand-picked for quality and elegance.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80',
      action: 'browse-stock',
      actionText: 'Explore Collection',
      badge: 'Premium',
      gradientFrom: 'from-zinc-800',
      gradientTo: 'to-zinc-900',
      textColor: 'text-white',
      isActive: false,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetRoles: ['retailer', 'trader', 'manufacturer']
    };
    addBanner(newBanner);
    setEditingBanner(newBanner);
    setIsEditing(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingBanner) return;
    if (!file.type.startsWith('image/')) { toast.error("Please select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image file must be less than 5MB"); return; }
    setUploadingImage(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const imageUrl = URL.createObjectURL(file);
      setEditingBanner({ ...editingBanner, image: imageUrl });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    if (!editingBanner) return;
    setEditingBanner({ ...editingBanner, image: url });
  };

  if (activeBanners.length === 0) {
    if (isAdmin) {
      return (
        <div className="relative w-full mb-8 lg:mb-16">
          <div className="bg-zinc-50/50 backdrop-blur-2xl border border-zinc-200/50 rounded-[3rem] px-6 py-24 text-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.02)]">
            <div className="space-y-6 max-w-md mx-auto flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-xl border border-zinc-100 mb-4 transition-transform hover:scale-110 duration-500">
                <Star className="h-10 w-10 text-zinc-900" />
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black tracking-tighter text-zinc-900">Curate Your Homepage</h3>
                <p className="text-base text-zinc-500 mt-3 font-medium leading-relaxed">
                  Design stunning, cinematic announcements to engage your audience. Let's create an immersive brand experience.
                </p>
              </div>
              <Button onClick={handleAddNewBanner} className="mt-8 rounded-full px-10 py-7 h-16 bg-black text-white hover:bg-zinc-800 transition-all duration-500 shadow-2xl shadow-black/20 hover:shadow-black/30 hover:-translate-y-1 font-bold tracking-widest uppercase text-sm">
                <Plus className="h-5 w-5 mr-3" />
                Launch Campaign
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Adaptive background effect based on the currently viewed banner
  const currentBanner = activeBanners[activeBannerIndex] || activeBanners[0];
  const ambientFrom = currentBanner?.gradientFrom || 'from-zinc-900';
  const ambientTo = currentBanner?.gradientTo || 'to-black';

  return (
    <div className="relative w-full mb-12 lg:mb-24 overflow-hidden py-10">

      {/* 
        Ultra-Premium Ambient Background Glow
        This div sits behind the carousel and softly bleeds the colors of the active banner
        into the surrounding page layout for a cohesive clothing-brand "lookbook" feel.
      */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] rounded-full opacity-10 blur-[120px] mix-blend-multiply bg-gradient-to-br",
            ambientFrom,
            ambientTo
          )}
          layout
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>

      {/* Header & Controls Container */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-4 md:px-8 lg:px-12 max-w-[1800px] mx-auto">
        <div>
          {isAdmin ? (
            <div className="flex flex-col">
              <h3 className="font-black text-2xl md:text-3xl tracking-tighter flex items-center gap-3">
                <Badge variant="outline" className="bg-black text-white border-black uppercase tracking-[0.2em] text-[10px] md:text-xs font-black px-3 pb-0.5 pt-1">Admin Edit</Badge>
                Storefront Canvas
              </h3>
              <p className="text-sm md:text-base text-zinc-500 mt-2 font-medium tracking-tight">Managing cinematic storefront banners. <span className="text-black font-black ml-1">{banners.filter(b => b.isActive).length} Live</span></p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 md:gap-4 self-end md:self-auto">
          {isAdmin && (
            <Button onClick={handleAddNewBanner} className="rounded-none bg-black text-white hover:bg-zinc-800 shadow-none font-black tracking-widest uppercase text-xs px-6 md:px-8 h-12 md:h-14 transition-all hover:scale-[0.98]">
              <Plus className="h-4 w-4 mr-2" />
              New Drop
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Carousel */}
      <div className="relative z-10 w-full max-w-full overflow-hidden mx-auto">
        <div
          ref={scrollContainerRef}
          className="flex gap-6 md:gap-8 pb-12 pt-4 px-4 md:px-8 lg:px-12 hide-scrollbar overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onMouseEnter={() => {
            if (scrollContainerRef.current) scrollContainerRef.current.dataset.hovered = 'true';
          }}
          onMouseLeave={() => {
            if (scrollContainerRef.current) scrollContainerRef.current.dataset.hovered = 'false';
          }}
          onTouchStart={() => {
            if (scrollContainerRef.current) scrollContainerRef.current.dataset.hovered = 'true';
          }}
          onTouchEnd={() => {
            if (scrollContainerRef.current) scrollContainerRef.current.dataset.hovered = 'false';
          }}
        >
          <AnimatePresence>
            {/* Render 4 sets of banners to guarantee infinite scrolling width */}
            {[...activeBanners, ...activeBanners].map((banner, index) => (
              <ScrollBannerItem
                key={banner.id + index.toString()}
                banner={banner}
                index={index}
                isAdmin={isAdmin}
                isActiveBanner={activeBannerIndex === index}
                onEdit={() => handleEditBanner(banner)}
                onClone={() => {
                  const clonedBanner = {
                    ...banner,
                    id: Date.now().toString(),
                    title: `${banner.title} (Copy)`,
                    isActive: false
                  };
                  addBanner(clonedBanner);
                }}
                onToggleStatus={() => toggleBannerStatus(banner.id)}
                onDelete={() => deleteBanner(banner.id)}
                onClick={() => handleBannerClick(banner.action)}
                onInView={(idx) => setActiveBannerIndex(idx)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Form Dialog (Admin Only) */}
      {isAdmin && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-12 border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
            <DialogHeader className="mb-10 border-b border-zinc-100 pb-8">
              <DialogTitle className="text-4xl font-black tracking-tighter text-zinc-900">Design Campaign</DialogTitle>
              <DialogDescription className="text-lg text-zinc-500 font-medium mt-2">
                Craft the aesthetics of your storefront banner. Changes merge directly into the lookbook.
              </DialogDescription>
            </DialogHeader>

            {editingBanner && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3.5">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Headline</label>
                    <Input
                      value={editingBanner.title}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      placeholder="e.g. The Fall Edit"
                      className="rounded-3xl h-16 bg-zinc-50 border-transparent hover:bg-zinc-100 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all font-bold text-xl px-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                    />
                  </div>
                  <div className="space-y-3.5">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Subheadline</label>
                    <Input
                      value={editingBanner.subtitle || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      placeholder="e.g. Redefining modern staples."
                      className="rounded-3xl h-16 bg-zinc-50 border-transparent hover:bg-zinc-100 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all font-bold text-lg px-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                    />
                  </div>
                </div>

                <div className="space-y-3.5">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Story/Description</label>
                  <Textarea
                    value={editingBanner.description || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                    placeholder="Enter full campaign details..."
                    rows={4}
                    className="rounded-3xl resize-none bg-zinc-50 border-transparent hover:bg-zinc-100 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all font-medium text-base p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  />
                </div>

                <div className="bg-zinc-50 p-8 md:p-10 rounded-[2.5rem] border border-zinc-100/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-200/40 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 block ml-2">Visual Asset</label>
                  <div className="space-y-8 relative z-10">
                    {/* Image Preview */}
                    {editingBanner.image && (
                      <div className="relative w-full h-80 bg-zinc-200 rounded-[2rem] overflow-hidden shadow-lg group border border-white">
                        <img
                          src={editingBanner.image}
                          alt="Banner preview"
                          className="w-full h-full object-cover transition-transform duration-[1500ms] ease-[0.16,1,0.3,1] group-hover:scale-110"
                          onError={(e: any) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm">
                          <p className="text-white font-black tracking-[0.2em] uppercase text-sm border-2 border-white/50 rounded-full px-6 py-2 pb-1.5 bg-white/10">Active Look</p>
                        </div>
                      </div>
                    )}

                    {/* Image Upload Options */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-16 rounded-3xl bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 focus:ring-4 focus:ring-zinc-900/5 text-zinc-900 font-bold shadow-sm transition-all"
                          disabled={uploadingImage}
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          {uploadingImage ? (
                            <><div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full mr-3" /> Processing Asset...</>
                          ) : (
                            <><Upload className="h-5 w-5 mr-3" /> Upload Editorial Image</>
                          )}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-16 px-8 rounded-3xl bg-white border-zinc-200 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 font-bold text-zinc-900 transition-all"
                        onClick={() => {
                          const input = prompt("Enter High-Res Image URL:", editingBanner.image);
                          if (input !== null) handleImageUrlChange(input);
                        }}
                      >
                        <Image className="h-5 w-5 mr-3" />
                        External URL
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Additional Settings Group */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3.5">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Vibe / Key Color (From)</label>
                      <Select
                        value={editingBanner.gradientFrom}
                        onValueChange={(value: string) => setEditingBanner({ ...editingBanner, gradientFrom: value })}
                      >
                        <SelectTrigger className="rounded-3xl h-16 bg-zinc-50 border-transparent font-bold px-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] focus:ring-4 focus:ring-zinc-900/5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                          <SelectItem value="from-zinc-800" className="font-medium cursor-pointer py-3">Monochrome Dark</SelectItem>
                          <SelectItem value="from-emerald-800" className="font-medium cursor-pointer py-3">Deep Emerald</SelectItem>
                          <SelectItem value="from-blue-900" className="font-medium cursor-pointer py-3">Midnight Navy</SelectItem>
                          <SelectItem value="from-rose-900" className="font-medium cursor-pointer py-3">Burgundy Wine</SelectItem>
                          <SelectItem value="from-amber-900" className="font-medium cursor-pointer py-3">Burnt Amber</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3.5">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Vibe / Shadow Color (To)</label>
                      <Select
                        value={editingBanner.gradientTo}
                        onValueChange={(value: string) => setEditingBanner({ ...editingBanner, gradientTo: value })}
                      >
                        <SelectTrigger className="rounded-3xl h-16 bg-zinc-50 border-transparent font-bold px-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] focus:ring-4 focus:ring-zinc-900/5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                          <SelectItem value="to-black" className="font-medium cursor-pointer py-3">Pitch Black</SelectItem>
                          <SelectItem value="to-zinc-900" className="font-medium cursor-pointer py-3">Charcoal</SelectItem>
                          <SelectItem value="to-indigo-950" className="font-medium cursor-pointer py-3">Deep Indigo</SelectItem>
                          <SelectItem value="to-neutral-950" className="font-medium cursor-pointer py-3">Warm Black</SelectItem>
                          <SelectItem value="to-transparent" className="font-medium cursor-pointer py-3">Faded Edge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3.5">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Top Label</label>
                      <Input
                        value={editingBanner.badge || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                        placeholder="e.g. EXCLUSIVE"
                        className="rounded-3xl h-16 bg-zinc-50 border-transparent font-bold px-6 uppercase tracking-wider"
                      />
                    </div>
                    <div className="space-y-3.5 flex flex-col justify-center">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 mb-1">State</label>
                      <div className="flex items-center space-x-4 p-4 bg-zinc-50 rounded-3xl border border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] overflow-hidden">
                        <Switch
                          id="banner-active"
                          checked={editingBanner.isActive}
                          onCheckedChange={(checked: boolean) => setEditingBanner({ ...editingBanner, isActive: checked })}
                          className="data-[state=checked]:bg-black scale-110 ml-2"
                        />
                        <Label htmlFor="banner-active" className="text-sm font-black cursor-pointer select-none">
                          {editingBanner.isActive ? <span className="text-black tracking-[0.1em] uppercase">Published</span> : <span className="text-zinc-400 tracking-[0.1em] uppercase">Draft Mode</span>}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3.5">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Action Button</label>
                      <Input
                        value={editingBanner.actionText || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, actionText: e.target.value })}
                        placeholder="e.g. Shop Collection"
                        className="rounded-3xl h-16 bg-zinc-50 border-transparent font-bold px-6"
                      />
                    </div>
                    <div className="space-y-3.5">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Destination</label>
                      <Select
                        value={editingBanner.action}
                        onValueChange={(value: string) => setEditingBanner({ ...editingBanner, action: value })}
                      >
                        <SelectTrigger className="rounded-3xl h-16 bg-zinc-50 border-transparent font-bold px-6">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                          <SelectItem value="browse-stock" className="font-medium cursor-pointer py-3">Store Catalog</SelectItem>
                          <SelectItem value="suppliers" className="font-medium cursor-pointer py-3">Brand Directory</SelectItem>
                          <SelectItem value="dashboard" className="font-medium cursor-pointer py-3">Overview</SelectItem>
                          <SelectItem value="settings" className="font-medium cursor-pointer py-3">Preferences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] block ml-2 border-t border-zinc-100 pt-6">Target Curations</label>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {['retailer', 'trader', 'manufacturer', 'financial', 'admin', 'logistics'].map(role => {
                        const isSelected = editingBanner.targetRoles.includes(role);
                        return (
                          <Badge
                            key={role}
                            variant="outline"
                            className={cn(
                              "cursor-pointer px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 border-2",
                              isSelected
                                ? "bg-black text-white border-black hover:bg-zinc-800 hover:border-zinc-800 shadow-lg"
                                : "bg-transparent text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800"
                            )}
                            onClick={() => {
                              const roles = isSelected
                                ? editingBanner.targetRoles.filter(r => r !== role)
                                : [...editingBanner.targetRoles, role];
                              setEditingBanner({ ...editingBanner, targetRoles: roles });
                            }}
                          >
                            {role}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-12 pt-8 border-t border-zinc-100 flex items-center justify-end gap-4 sm:gap-6">
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isPublishing}
                className="rounded-3xl h-16 px-8 font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all uppercase tracking-wider text-sm"
              >
                Discard
              </Button>
              <Button
                onClick={handleSaveBanner}
                disabled={isPublishing}
                className="rounded-3xl h-16 px-10 bg-black text-white hover:bg-zinc-800 font-black tracking-[0.15em] uppercase text-sm shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full mr-3" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-3" />
                    Publish Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

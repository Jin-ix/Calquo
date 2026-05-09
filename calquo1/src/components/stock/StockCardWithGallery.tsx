import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Heart, Video, Play, Clock, TrendingUp, MapPin } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { StockItem, StockCard } from './StockCard';
import { cn } from '../ui/utils';
import { Rating } from '../rating/RatingSystem';

import { Checkbox } from '../ui/checkbox';

interface StockCardWithGalleryProps {
  stock: StockItem | any; // Allow both StockItem and EnhancedStockItem
  onOrder?: (stock: StockItem) => void;
  onEdit?: (stock: StockItem) => void;
  onRemoveOffer?: (stockId: string) => void;
  showActions?: boolean;
  isOwner?: boolean;
  isFromPreferred?: boolean;
  showAddToCart?: boolean;
  // New props for enhanced sorting display
  showDistance?: boolean;
  distance?: number;
  showDeliveryTime?: boolean;
  // Selection props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function StockCardWithGallery({ 
  stock, 
  onOrder, 
  onEdit, 
  onRemoveOffer,
  showActions = true,
  isOwner = false,
  isFromPreferred = false,
  showAddToCart = true,
  showDistance = false,
  distance,
  showDeliveryTime = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection
}: StockCardWithGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showingVideo, setShowingVideo] = useState(false);

  // Helper function to get images from both old and new stock formats
  const getStockImages = (): string[] => {
    const allImages: string[] = [];
    
    // Priority 1: Enhanced stock format with mainImages (from Basic Information section)
    if (stock.mainImages && Array.isArray(stock.mainImages) && stock.mainImages.length > 0) {
      allImages.push(...stock.mainImages);
    }

    // Priority 2: Basic stock format images (from AddStockForm imageUrls)
    if (stock.images && Array.isArray(stock.images) && stock.images.length > 0) {
      allImages.push(...stock.images);
    }

    // Priority 3: Enhanced stock format with color-specific images
    if (stock.colors && Array.isArray(stock.colors)) {
      stock.colors.forEach((color: any) => {
        // Add pattern image if available
        if (color.patternImage && typeof color.patternImage === 'string') {
          allImages.push(color.patternImage);
        }
        // Add color-specific images
        if (color.images && Array.isArray(color.images) && color.images.length > 0) {
          allImages.push(...color.images);
        }
      });
    }

    // Priority 4: Enhanced stock format with combination-specific images
    if (stock.combinations && Array.isArray(stock.combinations)) {
      stock.combinations.forEach((combo: any) => {
        if (combo.images && Array.isArray(combo.images) && combo.images.length > 0) {
          allImages.push(...combo.images);
        }
      });
    }

    // Remove duplicates and filter out invalid URLs
    const uniqueImages = [...new Set(allImages)].filter(img => 
      img && typeof img === 'string' && img.trim().length > 0
    );

    return uniqueImages;
  };

  const stockImages = getStockImages();
  
  const formatVideoDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasVideos = stock.videos && stock.videos.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % stockImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + stockImages.length) % stockImages.length);
  };

  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
    setShowingVideo(false);
  };

  const selectVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setShowingVideo(true);
  };

  const switchToImages = () => {
    setShowingVideo(false);
  };

  const switchToVideos = () => {
    if (hasVideos) {
      setShowingVideo(true);
    }
  };

  return (
    <div className="h-full">
      {/* Media Gallery - added on top of the regular StockCard */}
      <Card className={cn("mb-4 overflow-hidden transition-all", isSelected && "ring-2 ring-primary border-primary")}>
        <div className="relative h-64 bg-muted">
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div className="absolute top-2 left-2 z-50">
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={() => onToggleSelection?.()}
                className="bg-white border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-5 w-5 shadow-sm"
              />
            </div>
          )}

          {/* Image/Video toggle */}
          {hasVideos && (
            <div className={cn(
              "absolute z-10 flex bg-black/70 rounded-md overflow-hidden transition-all",
              isSelectionMode ? "top-2 left-10" : "top-2 left-2"
            )}>
              <button
                onClick={switchToImages}
                className={cn(
                  "px-3 py-1 text-xs transition-colors",
                  !showingVideo ? "bg-white text-black" : "text-white hover:bg-white/20"
                )}
              >
                <ImageIcon className="h-3 w-3 mr-1 inline" />
                Photos
              </button>
              <button
                onClick={switchToVideos}
                className={cn(
                  "px-3 py-1 text-xs transition-colors",
                  showingVideo ? "bg-white text-black" : "text-white hover:bg-white/20"
                )}
              >
                <Video className="h-3 w-3 mr-1 inline" />
                Videos
              </button>
            </div>
          )}

          {/* Trending and Preferred indicators */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
            {stock.isTrending && (
              <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
            {isFromPreferred && (
              <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Preferred
              </Badge>
            )}
          </div>

          {!showingVideo ? (
            // Image view
            stockImages.length > 0 ? (
              <>
                <ImageWithFallback
                  src={stockImages[currentImageIndex]}
                  alt={`${stock.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation arrows */}
                {stockImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {stockImages.length}
                </div>
                
                {/* Trending text overlay */}
                {stock.isTrending && stock.trendingText && (
                  <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded">
                    {stock.trendingText}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                <div className="text-center p-4">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium mb-1">No images uploaded</p>
                  <p className="text-xs opacity-75">
                    Images uploaded during "Add Stock" will appear here
                  </p>
                </div>
              </div>
            )
          ) : (
            // Video view
            hasVideos && stock.videos && stock.videos.length > 0 ? (
              <>
                <video
                  src={stock.videos[currentVideoIndex].url}
                  controls
                  className="w-full h-full object-cover"
                  poster={stock.videos[currentVideoIndex].thumbnail}
                />
                
                {/* Video info overlay */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatVideoDuration(stock.videos[currentVideoIndex].duration)}
                  {stock.videos.length > 1 && (
                    <span className="ml-1">({currentVideoIndex + 1}/{stock.videos.length})</span>
                  )}
                </div>

                {/* Video navigation arrows */}
                {stock.videos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setCurrentVideoIndex((prev) => (prev - 1 + stock.videos!.length) % stock.videos!.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setCurrentVideoIndex((prev) => (prev + 1) % stock.videos!.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">No videos available</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Media thumbnails */}
        {(stockImages.length > 1 || hasVideos) && (
          <div className="p-3">
            <div className="flex gap-2 overflow-x-auto">
              {/* Image thumbnails */}
              {stockImages.map((image, index) => (
                <button
                  key={`img-${index}`}
                  onClick={() => selectImage(index)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all relative",
                    !showingVideo && currentImageIndex === index 
                      ? "border-primary shadow-md" 
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${stock.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Photo indicator */}
                  <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1 rounded-tl">
                    <ImageIcon className="h-2 w-2" />
                  </div>
                </button>
              ))}
              
              {/* Video thumbnails */}
              {hasVideos && stock.videos && stock.videos.map((video, index) => (
                <button
                  key={`vid-${index}`}
                  onClick={() => selectVideo(index)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all relative bg-black",
                    showingVideo && currentVideoIndex === index 
                      ? "border-primary shadow-md" 
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                >
                  {/* Video thumbnail placeholder */}
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Play className="h-4 w-4" />
                  </div>
                  {/* Video indicator */}
                  <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded-tl flex items-center gap-0.5">
                    <Video className="h-2 w-2" />
                    <span className="text-[10px]">{formatVideoDuration(video.duration)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Enhanced sorting information display */}
      {(showDeliveryTime || showDistance) && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              {showDeliveryTime && stock.deliveryTime && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Delivery: {stock.deliveryTime}</span>
                </div>
              )}
              {showDistance && distance !== undefined && distance !== Infinity && (
                <div className="flex items-center gap-2 text-green-600">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    {distance < 1 
                      ? `${Math.round(distance * 1000)}m away`
                      : `${distance.toFixed(1)}km away`
                    }
                  </span>
                </div>
              )}
              {showDistance && (distance === undefined || distance === Infinity) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">Distance unknown</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Use the enhanced StockCard component with all special offer features */}
      <StockCard 
        stock={stock}
        onOrder={onOrder}
        onEdit={onEdit}
        onRemoveOffer={onRemoveOffer}
        showActions={showActions}
        isOwner={isOwner}
        showAddToCart={showAddToCart}
      />
    </div>
  );
}

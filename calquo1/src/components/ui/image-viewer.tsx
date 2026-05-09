import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Button } from './button';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  onImageChange?: (index: number) => void;
}

export function ImageViewer({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex = 0,
  onImageChange 
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setRotation(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (onImageChange) {
      onImageChange(currentIndex);
    }
  }, [currentIndex, onImageChange]);

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const currentImage = images[currentIndex];
      const link = document.createElement('a');
      
      if (currentImage.startsWith('data:') || currentImage.startsWith('blob:')) {
        // For data URLs or blob URLs, direct download
        link.href = currentImage;
        link.download = `image-${currentIndex + 1}.jpg`;
      } else {
        // For external URLs, create a downloadable blob
        const response = await fetch(currentImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `image-${currentIndex + 1}.jpg`;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL if created
      if (!currentImage.startsWith('data:') && !currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(link.href);
      }
      
      toast.success('Image downloaded successfully');
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download error:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        handleRotate();
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex]);

  const getImageInfo = (imageUrl: string) => {
    const isDataUrl = imageUrl.startsWith('data:');
    const isExternalUrl = imageUrl.startsWith('http');
    const isBlobUrl = imageUrl.startsWith('blob:');
    
    let source = 'Unknown';
    if (isDataUrl) source = 'Uploaded File';
    if (isExternalUrl) source = 'External URL';
    if (isBlobUrl) source = 'Camera Capture';
    
    return {
      index: currentIndex + 1,
      total: images.length,
      source,
      url: imageUrl
    };
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageInfo = getImageInfo(currentImage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none" aria-describedby="image-viewer-description">
        {/* Hidden accessibility description */}
        <div id="image-viewer-description" className="sr-only">
          Image viewer showing {images.length > 0 ? `${currentIndex + 1} of ${images.length} images` : 'product image'}. 
          Use arrow keys or navigation buttons to browse through images.
        </div>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-none"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-none"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-none"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20 border-none h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20 border-none h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-white/30 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20 border-none h-8 w-8 p-0"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 border-none h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-white hover:bg-white/20 border-none h-8 w-8 p-0"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Info Panel */}
          {showInfo && (
            <div className="absolute top-4 left-4 z-50 bg-black/70 text-white rounded-lg p-4 max-w-xs">
              <h3 className="font-medium mb-2">Image Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-300">Image:</span> {imageInfo.index} of {imageInfo.total}</p>
                <p><span className="text-gray-300">Source:</span> {imageInfo.source}</p>
                <p><span className="text-gray-300">Zoom:</span> {Math.round(zoom * 100)}%</p>
                <p><span className="text-gray-300">Rotation:</span> {rotation}°</p>
              </div>
            </div>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white rounded-full px-3 py-1 text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Image */}
          <div className="flex items-center justify-center w-full h-full p-8">
            <img
              src={currentImage}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                cursor: zoom > 1 ? 'move' : 'default'
              }}
              onError={() => {
                toast.error('Failed to load image');
              }}
            />
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="absolute bottom-16 left-4 z-40 text-white/70 text-xs space-y-1">
            <p>← → Navigate</p>
            <p>+ - Zoom</p>
            <p>R Rotate</p>
            <p>ESC Close</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

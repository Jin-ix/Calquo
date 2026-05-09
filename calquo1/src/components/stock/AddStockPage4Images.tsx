import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImagePlus, Star, Upload, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { Variant, VariantGroup } from './AddStockWizard';

interface AddStockPage4ImagesProps {
  productImages: string[];
  setProductImages: (images: string[]) => void;
  mainImageIndex: number;
  setMainImageIndex: (index: number) => void;
  variants?: Variant[];
  variantGroups?: VariantGroup[];
  vtonImageUrl?: string | null;
  setVtonImageUrl?: (url: string | null) => void;
  onPreviewVton?: (patternUrl: string) => void;
}

export function AddStockPage4Images({
  productImages,
  setProductImages,
  mainImageIndex,
  setMainImageIndex,
  variants,
  variantGroups,
  vtonImageUrl,
  setVtonImageUrl,
  onPreviewVton
}: AddStockPage4ImagesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vtonFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVtonDragging, setIsVtonDragging] = useState(false);

  // Collect all variant images
  const variantImages = React.useMemo(() => {
    const images: Array<{
      url: string;
      variant: Variant;
      groupName?: string;
    }> = [];

    // DEBUG: Log incoming data
    console.log('🖼️ [AddStockPage4Images] DEBUG - Variants:', variants);
    console.log('🖼️ [AddStockPage4Images] DEBUG - Variant Groups:', variantGroups);

    // Get images from variants array
    if (variants && variants.length > 0) {
      console.log(`🖼️ [AddStockPage4Images] Processing ${variants.length} variants`);
      variants.forEach((variant, idx) => {
        console.log(`🖼️ [AddStockPage4Images] Variant ${idx}:`, {
          imageUrl: variant.imageUrl,
          images: variant.images,
          color: variant.colorOrPattern?.name,
          size: variant.size
        });
        if (variant.imageUrl) {
          images.push({ url: variant.imageUrl, variant });
        } else if (variant.images && variant.images.length > 0) {
          variant.images.forEach(imgUrl => {
            images.push({ url: imgUrl, variant });
          });
        }
      });
    }

    // Get images from variant groups
    if (variantGroups && variantGroups.length > 0) {
      console.log(`🖼️ [AddStockPage4Images] Processing ${variantGroups.length} variant groups`);
      variantGroups.forEach((group, gIdx) => {
        console.log(`🖼️ [AddStockPage4Images] Group ${gIdx} "${group.name}":`, group.variants);
        group.variants.forEach((variant, vIdx) => {
          console.log(`🖼️ [AddStockPage4Images] Group ${gIdx} Variant ${vIdx}:`, {
            imageUrl: variant.imageUrl,
            images: variant.images,
            color: variant.colorOrPattern?.name,
            size: variant.size
          });
          if (variant.imageUrl) {
            images.push({ url: variant.imageUrl, variant, groupName: group.name });
          } else if (variant.images && variant.images.length > 0) {
            variant.images.forEach(imgUrl => {
              images.push({ url: imgUrl, variant, groupName: group.name });
            });
          }
        });
      });
    }

    console.log(`🖼️ [AddStockPage4Images] Total variant images found: ${images.length}`, images);
    return images;
  }, [variants, variantGroups]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFiles(Array.from(event.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped because they are not images.');
    }

    if (validFiles.length + productImages.length > 10) {
      toast.error('You can only upload up to 10 images.');
      return;
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setProductImages([...productImages, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragDropVton = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVtonDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && setVtonImageUrl) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setVtonImageUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleVtonFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && setVtonImageUrl) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setVtonImageUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
    
    // Adjust main image index if needed
    if (index === mainImageIndex) {
      setMainImageIndex(0);
    } else if (index < mainImageIndex) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
    toast.success('Main display image updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Product Images</h2>
        <p className="text-sm text-muted-foreground">
          Upload high-quality images of your product. The first image (marked with a star) will be the main display image.
        </p>
      </div>

      {productImages.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must upload at least one image to proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-200 hover:border-primary hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="bg-primary/10 p-4 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to 5MB (Max 10 images)
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Image Grid */}
      {productImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {productImages.map((image, index) => (
            <div 
              key={index} 
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                index === mainImageIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img 
                src={image} 
                alt={`Product ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="p-1.5 bg-white/90 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {index !== mainImageIndex && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-full text-xs h-8 bg-white/90 hover:bg-white"
                    onClick={() => setMainImage(index)}
                  >
                    Set as Main
                  </Button>
                )}
              </div>

              {/* Main Image Badge */}
              {index === mainImageIndex && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                  <Star className="h-3 w-3 fill-current" />
                  Main
                </div>
              )}
            </div>
          ))}
          
          {/* Add More Button */}
          {productImages.length < 10 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors text-muted-foreground hover:text-primary"
            >
              <ImagePlus className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">Add More</span>
            </div>
          )}
        </div>
      )}

      {/* VTON Base Image Section */}
      <div className="flex flex-col gap-2 mt-8">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-indigo-500" />
          Virtual Try-On Subject Image
          <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200 bg-indigo-50">Optional</Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload a clear, front-facing image of a model wearing the base garment. This enables buyers to visually try-on your fabric patterns on this product structure.
        </p>
      </div>

      {!vtonImageUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isVtonDragging 
              ? 'border-indigo-400 bg-indigo-50' 
              : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsVtonDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsVtonDragging(false); }}
          onDrop={handleDragDropVton}
          onClick={() => vtonFileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Upload className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium text-slate-700">
                Click to upload VTON baseline image
              </p>
              <p className="text-xs text-muted-foreground">
                For best results: Clear lighting, solid background, full front view
              </p>
            </div>
          </div>
          <input
            ref={vtonFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleVtonFileSelect}
          />
        </div>
      ) : (
        <div className="relative group w-48 aspect-[3/4] rounded-lg overflow-hidden border-2 border-indigo-200 shadow-sm">
          <img 
            src={vtonImageUrl} 
            alt="Virtual Try-On Subject" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6 flex justify-between items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-white text-[10px] uppercase font-bold tracking-wider">VTON Baseline</span>
              {onPreviewVton && variantImages.length > 0 && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-7 px-2 text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white border-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewVton(variantImages[0].url);
                  }}
                >
                  Try-On Preview
                </Button>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (setVtonImageUrl) setVtonImageUrl(null);
              }}
              className="p-1.5 bg-red-500/90 rounded-full hover:bg-red-600 text-white transition-colors shadow-sm"
              title="Remove VTON Image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Variant Images Section */}
      {variantImages.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Variant Images</h3>
              <p className="text-sm text-muted-foreground">
                Images uploaded for specific color/size variants ({variantImages.length} total)
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {variantImages.length} {variantImages.length === 1 ? 'image' : 'images'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {variantImages.map((item, index) => {
              const colorName = item.variant.colorOrPattern?.name || 'Unknown';
              const size = item.variant.size || 'Unknown';
              const isMainImage = item.variant.mainImage;

              return (
                <div 
                  key={`variant-img-${index}`} 
                  className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                    isMainImage ? 'border-amber-400' : 'border-purple-200'
                  }`}
                >
                  <img 
                    src={item.url} 
                    alt={`${colorName} - ${size}`} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Variant Info Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex flex-col gap-1">
                      {item.groupName && (
                        <Badge variant="outline" className="text-[10px] bg-white/90 border-white/50 w-fit">
                          {item.groupName}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-white text-xs font-medium truncate">
                          {colorName}
                        </span>
                        <span className="text-white/70 text-xs">•</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {size}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Main Image Badge */}
                  {isMainImage && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Star className="h-3 w-3 fill-current" />
                      Main
                    </div>
                  )}

                  {/* Color Preview (if solid color) */}
                  {item.variant.colorOrPattern?.type === 'color' && (
                    <div className="absolute top-2 right-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: item.variant.colorOrPattern.value }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Note */}
          <Alert className="bg-purple-50 border-purple-200">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              These images were uploaded when creating variants. They help buyers see specific color/size combinations.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Debug Section - Show when variants exist but no images found */}
      {variantImages.length === 0 && (variants?.length ?? 0) > 0 && (
        <div className="mt-8">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Debug Info:</strong> Found {variants?.length ?? 0} variants but no variant images. 
              Check console (F12) for details. Variant images are uploaded in Step 3 when creating color/size combinations.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

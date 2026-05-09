import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { X, Upload, Star, StarOff, Image as ImageIcon } from 'lucide-react';
import { cn } from './utils';

interface ImageUploadProps {
  images: string[];
  mainImageIndex?: number;
  onImagesChange: (images: string[]) => void;
  onMainImageChange: (index: number) => void;
  maxImages?: number;
  required?: boolean;
  className?: string;
}

export function ImageUpload({
  images,
  mainImageIndex = 0,
  onImagesChange,
  onMainImageChange,
  maxImages = 10,
  required = false,
  className
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          if (imageUrl && images.length < maxImages) {
            const newImages = [...images, imageUrl];
            onImagesChange(newImages);
            // Set as main image if it's the first image
            if (images.length === 0) {
              onMainImageChange(0);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlAdd = () => {
    if (urlInput.trim() && images.length < maxImages) {
      const newImages = [...images, urlInput.trim()];
      onImagesChange(newImages);
      setUrlInput('');
      // Set as main image if it's the first image
      if (images.length === 0) {
        onMainImageChange(0);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Adjust main image index if necessary
    if (index === mainImageIndex) {
      onMainImageChange(Math.max(0, Math.min(mainImageIndex, newImages.length - 1)));
    } else if (index < mainImageIndex) {
      onMainImageChange(mainImageIndex - 1);
    }
  };

  const setMainImage = (index: number) => {
    onMainImageChange(index);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">Product Images</Label>
        {required && <span className="text-red-500">*</span>}
        <Badge variant="outline">{images.length}/{maxImages}</Badge>
      </div>

      {/* Upload Controls */}
      <div className="space-y-3">
        {/* File Upload */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxImages}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Images
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">
            or add image URL below
          </span>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter image URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
            disabled={images.length >= maxImages}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleUrlAdd}
            disabled={!urlInput.trim() || images.length >= maxImages}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Required validation message */}
      {required && images.length === 0 && (
        <p className="text-sm text-red-600">At least one image is required</p>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className={cn(
              "relative overflow-hidden",
              mainImageIndex === index && "ring-2 ring-primary"
            )}>
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NFY4NUg5NFY3NEg4N1pNNjYgMTI2VjExNUg3N1YxMjZINjZaTTEzNCAxMjZWMTE1SDE0NVYxMjZIMTM0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                    }}
                  />
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Main image toggle */}
                  <Button
                    type="button"
                    variant={mainImageIndex === index ? "default" : "secondary"}
                    size="sm"
                    className="absolute bottom-1 left-1 h-6 px-2 py-0"
                    onClick={() => setMainImage(index)}
                  >
                    {mainImageIndex === index ? (
                      <Star className="h-3 w-3 mr-1" />
                    ) : (
                      <StarOff className="h-3 w-3 mr-1" />
                    )}
                    {mainImageIndex === index ? 'Main' : 'Set Main'}
                  </Button>
                </div>

                {/* Image info */}
                <div className="mt-1 text-xs text-center">
                  <Badge variant={mainImageIndex === index ? "default" : "secondary"} className="text-xs">
                    {mainImageIndex === index ? 'Main Image' : `Image ${index + 1}`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No images added yet<br />
              {required && <span className="text-red-500">At least one image is required</span>}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

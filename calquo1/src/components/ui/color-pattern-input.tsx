import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Upload, Palette, X, Check } from 'lucide-react';

export interface ColorOrPattern {
  type: 'color' | 'pattern';
  value: string; // hex code for color, URL for pattern
  name?: string; // optional name for the color/pattern
}

interface ColorPatternInputProps {
  value?: ColorOrPattern;
  onChange: (colorOrPattern: ColorOrPattern) => void;
  label?: string;
  className?: string;
  showPreview?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  selectedColors?: ColorOrPattern[]; // Array of already selected colors to show tick marks
}

const defaultColors = [
  '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF',
  '#00FFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#FFE66D', '#FF8E53', '#6C5CE7', '#A29BFE',
  '#FD79A8', '#00B894', '#E17055', '#81ECEC', '#74B9FF',
  '#55A3FF', '#FFFFFF', '#000000', '#808080', '#800080'
];

export function ColorPatternInput({
  value,
  onChange,
  label = "Select Color",
  className = "",
  showPreview = true,
  previewSize = 'md',
  disabled = false,
  selectedColors = []
}: ColorPatternInputProps) {
  const [inputType, setInputType] = useState<'color' | 'pattern' | 'image'>('color');
  const [customColor, setCustomColor] = useState(value?.type === 'color' ? value.value : '#FF0000');
  const [patternName, setPatternName] = useState(value?.type === 'pattern' ? (value.name || '') : '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const handleTypeChange = useCallback((type: 'color' | 'pattern' | 'image') => {
    setInputType(type);
    
    // Don't auto-select anything - let user choose
    if (type === 'image') {
      // Clear when switching to image upload mode
      setPatternName('');
    }
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setCustomColor(color);
    onChange({
      type: 'color',
      value: color,
      name: `Color ${color}`
    });
  }, [onChange]);

  const handleCustomColorChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setCustomColor(color);
    onChange({
      type: 'color',
      value: color,
      name: `Color ${color}`
    });
  }, [onChange]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      event.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      event.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);

    try {
      // Create a local URL for immediate preview
      const imageUrl = URL.createObjectURL(file);
      
      // Use custom pattern name if set, otherwise use filename
      const displayName = patternName || file.name;
      
      onChange({
        type: 'pattern',
        value: imageUrl,
        name: displayName
      });

      // Reset input to allow selecting the same file again if needed
      event.target.value = '';

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      event.target.value = ''; // Reset input
    } finally {
      setIsUploading(false);
    }
  }, [onChange, patternName]);

  const handlePatternNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setPatternName(name);
    
    // Update the pattern with new name if image is already uploaded
    if (value?.type === 'pattern' && value.value) {
      onChange({
        type: 'pattern',
        value: value.value,
        name: name || 'Pattern'
      });
    }
  }, [value, onChange]);

  const handleRemovePattern = useCallback(() => {
    setPatternName('');
    onChange({
      type: 'pattern',
      value: '',
      name: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const renderPreview = () => {
    if (!showPreview) return null;

    const sizeClass = previewSizes[previewSize];

    if (value?.type === 'color' && value.value) {
      return (
        <div className="flex items-center gap-2">
          <div 
            className={`${sizeClass} rounded-md border-2 border-gray-200 shadow-sm`}
            style={{ backgroundColor: value.value }}
          />
          <span className="text-sm text-muted-foreground">{value.value}</span>
        </div>
      );
    }

    if (value?.type === 'pattern' && value.value) {
      return (
        <div className="flex items-center gap-2">
          <div className={`${sizeClass} rounded-md border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-50`}>
            <ImageWithFallback
              src={value.value}
              alt="Pattern preview"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-muted-foreground">{value.name || 'Pattern'}</span>
        </div>
      );
    }

    return (
      <div className={`${sizeClass} rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center`}>
        <span className="text-xs text-gray-400">Preview</span>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* Type Toggle */}
      <div className="flex rounded-lg border border-border bg-background p-1 gap-1">
        <Button
          type="button"
          variant={inputType === 'color' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleTypeChange('color')}
          disabled={disabled}
          className="flex-1 flex items-center gap-2"
        >
          <Palette className="w-4 h-4" />
          Color
        </Button>
        <Button
          type="button"
          variant={inputType === 'image' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleTypeChange('image')}
          disabled={disabled}
          className="flex-1 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
      </div>

      {/* Color Input */}
      {inputType === 'color' && (
        <div className="space-y-3">
          {/* Preset Colors */}
          <div className="grid grid-cols-5 gap-2">
            {defaultColors.map((color) => {
              // Check if this color is in selectedColors array
              const isSelected = selectedColors.some(c => c.type === 'color' && c.value === color);
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  disabled={disabled}
                  className={`w-10 h-10 rounded-md border-2 shadow-sm hover:scale-105 transition-transform relative ${
                    isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <Check 
                      className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                      style={{ color: color === '#FFFFFF' || color === '#FFFF00' ? '#22c55e' : '#FFFFFF' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-2">
            <Label htmlFor="custom-color" className="text-sm">Custom:</Label>
            <input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              disabled={disabled}
              className="w-12 h-8 border border-border rounded cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e)}
              disabled={disabled}
              placeholder="#FF6B6B"
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-input-background"
            />
          </div>
        </div>
      )}

      {/* Image Upload */}
      {inputType === 'image' && (
        <div className="space-y-3">
          {/* Pattern Name Input */}
          <div className="space-y-1.5">
            <Label htmlFor="pattern-name" className="text-sm">
              Pattern Name <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="pattern-name"
              type="text"
              value={patternName}
              onChange={handlePatternNameChange}
              disabled={disabled}
              placeholder="e.g., Floral Print, Stripes, Checkered"
              className="w-full"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            onChange={handleImageUpload}
            disabled={disabled || isUploading}
            className="hidden"
            id="pattern-image-upload"
            aria-label="Upload pattern image"
          />
          
          {!value?.value ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
                disabled={disabled || isUploading}
                className="w-full h-24 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">
                    {isUploading ? 'Uploading...' : 'Click to Upload Pattern Image'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG, JPEG, GIF up to 5MB
                  </span>
                </div>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Browse and select an image from your device
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <div className="w-full h-32 border border-border rounded-md overflow-hidden bg-gray-50">
                  <ImageWithFallback
                    src={value.value}
                    alt="Pattern preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                    disabled={disabled}
                    className="w-8 h-8 p-0 bg-white"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePattern}
                    disabled={disabled}
                    className="w-8 h-8 p-0 bg-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {value.name && (
                <p className="text-sm text-muted-foreground text-center">
                  {value.name}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
          {renderPreview()}
        </div>
      )}
    </div>
  );
}

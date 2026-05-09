import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Palette, Type, Upload, Link, X, ChevronDown } from 'lucide-react';
import { cn } from './utils';

interface EnhancedColorInputProps {
  value: string;
  onChange: (value: string) => void;
  colorImage?: string;
  onColorImageChange?: (imageUrl: string) => void;
  onImageUpload?: (file: File, callback: (url: string) => void) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

const predefinedColors = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 
  'Purple', 'Orange', 'Gray', 'Brown', 'Navy', 'Maroon', 'Beige',
  'Turquoise', 'Lime', 'Coral', 'Indigo', 'Teal', 'Magenta'
];

const colorHexMap: Record<string, string> = {
  'Black': '#000000', 'White': '#FFFFFF', 'Red': '#FF0000', 'Blue': '#0000FF',
  'Green': '#008000', 'Yellow': '#FFFF00', 'Pink': '#FFC0CB', 'Purple': '#800080',
  'Orange': '#FFA500', 'Gray': '#808080', 'Brown': '#A52A2A', 'Navy': '#000080',
  'Maroon': '#800000', 'Beige': '#F5F5DC', 'Turquoise': '#40E0D0', 'Lime': '#00FF00',
  'Coral': '#FF7F50', 'Indigo': '#4B0082', 'Teal': '#008080', 'Magenta': '#FF00FF'
};

export function EnhancedColorInput({ 
  value, 
  onChange, 
  colorImage,
  onColorImageChange,
  onImageUpload,
  placeholder = "Enter color name", 
  className,
  label = "Color"
}: EnhancedColorInputProps) {
  const [activeTab, setActiveTab] = useState<string>('dropdown');
  const [customImageUrl, setCustomImageUrl] = useState(colorImage || '');

  const getColorHex = (colorName: string): string => {
    return colorHexMap[colorName] || '#808080';
  };

  const handleDropdownChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleColorPickerChange = (hex: string) => {
    // Find the closest color name or use the hex value
    const colorEntry = Object.entries(colorHexMap).find(([_, hexValue]) => 
      hexValue.toLowerCase() === hex.toLowerCase()
    );
    onChange(colorEntry ? colorEntry[0] : hex);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload && onColorImageChange) {
      onImageUpload(file, (url) => {
        onColorImageChange(url);
        setCustomImageUrl(url);
        // Extract color name from image filename or use a default
        const fileName = file.name.toLowerCase();
        let colorName = 'Custom';
        for (const color of predefinedColors) {
          if (fileName.includes(color.toLowerCase())) {
            colorName = color;
            break;
          }
        }
        onChange(colorName);
      });
    }
  };

  const handleUrlSubmit = () => {
    if (customImageUrl && onColorImageChange) {
      onColorImageChange(customImageUrl);
      onChange('Custom');
    }
  };

  const removeImage = () => {
    if (onColorImageChange) {
      onColorImageChange('');
      setCustomImageUrl('');
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">{label} *</Label>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dropdown" className="text-xs">
            <ChevronDown className="h-3 w-3 mr-1" />
            Dropdown
          </TabsTrigger>
          <TabsTrigger value="picker" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Picker
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            <Link className="h-3 w-3 mr-1" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dropdown" className="space-y-2">
          <Select value={value} onValueChange={handleDropdownChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {predefinedColors.map(color => (
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300" 
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    {color}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Or type custom color name"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </TabsContent>

        <TabsContent value="picker" className="space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={getColorHex(value)}
              onChange={(e) => handleColorPickerChange(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              title="Pick a color"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Color name"
              className="flex-1"
            />
          </div>
          
          {/* Quick color palette */}
          <div className="grid grid-cols-10 gap-1">
            {predefinedColors.map(color => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform",
                  value === color && "ring-2 ring-primary ring-offset-1"
                )}
                style={{ backgroundColor: getColorHex(color) }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm"
            />
            <Input
              placeholder="Color name for this image"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            {colorImage && (
              <div className="relative w-16 h-16">
                <img 
                  src={colorImage} 
                  alt={`${value} color reference`}
                  className="w-full h-full object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleUrlSubmit}
              variant="outline"
              size="sm"
            >
              Add
            </Button>
          </div>
          <Input
            placeholder="Color name for this image"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {colorImage && (
            <div className="relative w-16 h-16">
              <img 
                src={colorImage} 
                alt={`${value} color reference`}
                className="w-full h-full object-cover rounded border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Current selection preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <div 
            className="w-4 h-4 rounded border border-gray-300" 
            style={{ backgroundColor: getColorHex(value) }}
          />
          <span className="text-sm text-gray-700">Selected: {value}</span>
          {colorImage && (
            <span className="text-xs text-blue-600">+ Image</span>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { Palette, List, Upload, Link, X } from 'lucide-react';
import { cn } from './utils';

interface EnhancedMultiColorInputProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  onImageUpload?: (file: File, callback: (url: string) => void) => void;
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

export function EnhancedMultiColorInput({ 
  selectedColors, 
  onColorsChange,
  onImageUpload,
  className,
  label = "Available Colors"
}: EnhancedMultiColorInputProps) {
  const [activeTab, setActiveTab] = useState<string>('checkboxes');
  const [customColor, setCustomColor] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [colorImages, setColorImages] = useState<Record<string, string>>({});

  const getColorHex = (colorName: string): string => {
    return colorHexMap[colorName] || '#808080';
  };

  const handleColorToggle = (color: string, checked: boolean) => {
    if (checked) {
      onColorsChange([...selectedColors, color]);
    } else {
      onColorsChange(selectedColors.filter(c => c !== color));
    }
  };

  const addCustomColor = () => {
    if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
      onColorsChange([...selectedColors, customColor.trim()]);
      setCustomColor('');
    }
  };

  const removeColor = (color: string) => {
    onColorsChange(selectedColors.filter(c => c !== color));
    // Remove associated image
    const newColorImages = { ...colorImages };
    delete newColorImages[color];
    setColorImages(newColorImages);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, color: string) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file, (url) => {
        setColorImages(prev => ({ ...prev, [color]: url }));
      });
    }
  };

  const handleUrlSubmit = (color: string) => {
    if (customImageUrl) {
      setColorImages(prev => ({ ...prev, [color]: customImageUrl }));
      setCustomImageUrl('');
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">{label} *</Label>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checkboxes" className="text-xs">
            <List className="h-3 w-3 mr-1" />
            Select
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

        <TabsContent value="checkboxes" className="space-y-3">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {predefinedColors.map(color => (
              <div key={color} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedColors.includes(color)}
                  onCheckedChange={(checked) => handleColorToggle(color, checked as boolean)}
                />
                <Label className="text-sm cursor-pointer flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded border" 
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                  {color}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add custom color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
              className="flex-1"
            />
            <Button type="button" onClick={addCustomColor} variant="outline" size="sm">
              Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="picker" className="space-y-3">
          <div className="grid grid-cols-8 gap-1">
            {predefinedColors.map(color => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-8 h-8 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform",
                  selectedColors.includes(color) && "ring-2 ring-primary ring-offset-1"
                )}
                style={{ backgroundColor: getColorHex(color) }}
                onClick={() => handleColorToggle(color, !selectedColors.includes(color))}
                title={color}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="color"
              onChange={(e) => {
                const hex = e.target.value;
                // Find closest color name or use hex
                const colorEntry = Object.entries(colorHexMap).find(([_, hexValue]) => 
                  hexValue.toLowerCase() === hex.toLowerCase()
                );
                const colorName = colorEntry ? colorEntry[0] : hex;
                if (!selectedColors.includes(colorName)) {
                  onColorsChange([...selectedColors, colorName]);
                }
              }}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              title="Pick a color"
            />
            <Input
              placeholder="Or type color name"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
              className="flex-1"
            />
            <Button type="button" onClick={addCustomColor} variant="outline" size="sm">
              Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <p className="text-xs text-muted-foreground">Upload color reference images for selected colors:</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedColors.map(color => (
              <div key={color} className="flex items-center gap-2 p-2 border rounded">
                <div 
                  className="w-4 h-4 rounded border" 
                  style={{ backgroundColor: getColorHex(color) }}
                />
                <span className="text-sm font-medium">{color}</span>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, color)}
                  className="text-xs flex-1"
                />
                {colorImages[color] && (
                  <img 
                    src={colorImages[color]} 
                    alt={color}
                    className="w-8 h-8 object-cover rounded border"
                  />
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-3">
          <p className="text-xs text-muted-foreground">Add image URLs for selected colors:</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedColors.map(color => (
              <div key={color} className="flex items-center gap-2 p-2 border rounded">
                <div 
                  className="w-4 h-4 rounded border" 
                  style={{ backgroundColor: getColorHex(color) }}
                />
                <span className="text-sm font-medium min-w-16">{color}</span>
                <Input
                  placeholder="Image URL"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button 
                  type="button" 
                  onClick={() => handleUrlSubmit(color)}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
                {colorImages[color] && (
                  <img 
                    src={colorImages[color]} 
                    alt={color}
                    className="w-8 h-8 object-cover rounded border"
                  />
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected colors preview */}
      {selectedColors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Selected Colors ({selectedColors.length}):</Label>
          <div className="flex flex-wrap gap-1">
            {selectedColors.map(color => (
              <Badge key={color} variant="secondary" className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded border" 
                  style={{ backgroundColor: getColorHex(color) }}
                />
                {color}
                {colorImages[color] && <span className="text-xs">📷</span>}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeColor(color)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

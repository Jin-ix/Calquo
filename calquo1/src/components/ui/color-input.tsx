import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Palette, Type } from 'lucide-react';
import { cn } from './utils';

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Predefined colors with their hex values
const predefinedColors = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Red': '#FF0000',
  'Blue': '#0000FF',
  'Green': '#008000',
  'Yellow': '#FFFF00',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Orange': '#FFA500',
  'Gray': '#808080',
  'Brown': '#A52A2A',
  'Navy': '#000080',
  'Maroon': '#800000',
  'Beige': '#F5F5DC',
  'Turquoise': '#40E0D0',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
  'Cyan': '#00FFFF',
  'Magenta': '#FF00FF',
  'Lime': '#00FF00'
};

// Function to convert color name to hex
const getHexFromColorName = (colorName: string): string => {
  const normalizedName = colorName.trim();
  const exactMatch = predefinedColors[normalizedName as keyof typeof predefinedColors];
  if (exactMatch) return exactMatch;

  // Try case-insensitive match
  const caseInsensitiveMatch = Object.entries(predefinedColors).find(
    ([name]) => name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (caseInsensitiveMatch) return caseInsensitiveMatch[1];

  // Return a default gray for unknown colors
  return '#808080';
};

// Function to convert hex to color name
const getColorNameFromHex = (hex: string): string => {
  const exactMatch = Object.entries(predefinedColors).find(([_, value]) => 
    value.toLowerCase() === hex.toLowerCase()
  );
  return exactMatch ? exactMatch[0] : hex;
};

// Function to check if a string is a valid hex color
const isValidHex = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

export function ColorInput({ value, onChange, placeholder = "Enter color name or select", className }: ColorInputProps) {
  const [inputMode, setInputMode] = useState<'text' | 'picker'>('text');
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleTextChange = (newValue: string) => {
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleColorPickerChange = (hex: string) => {
    const colorName = getColorNameFromHex(hex);
    setDisplayValue(colorName);
    onChange(colorName);
  };

  const getDisplayColor = (): string => {
    if (!displayValue) return '#808080';
    
    // If it's already a hex color, use it
    if (isValidHex(displayValue)) return displayValue;
    
    // Otherwise, convert color name to hex
    return getHexFromColorName(displayValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={inputMode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('text')}
          className="flex items-center gap-1"
        >
          <Type className="h-3 w-3" />
          Text
        </Button>
        <Button
          type="button"
          variant={inputMode === 'picker' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('picker')}
          className="flex items-center gap-1"
        >
          <Palette className="h-3 w-3" />
          Picker
        </Button>
      </div>

      {inputMode === 'text' ? (
        <div className="relative">
          <Input
            type="text"
            value={displayValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          {/* Color preview */}
          <div 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: getDisplayColor() }}
            title={`Preview: ${displayValue}`}
          />
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={getDisplayColor()}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            title="Pick a color"
          />
          <Input
            type="text"
            value={displayValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Color name will appear here"
            className="flex-1"
            readOnly
          />
        </div>
      )}

      {/* Quick color palette */}
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(predefinedColors).slice(0, 8).map(([name, hex]) => (
          <button
            key={name}
            type="button"
            className={cn(
              "w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform",
              displayValue.toLowerCase() === name.toLowerCase() && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ backgroundColor: hex }}
            onClick={() => {
              setDisplayValue(name);
              onChange(name);
            }}
            title={name}
          />
        ))}
      </div>
    </div>
  );
}

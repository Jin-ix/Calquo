import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { 
  ColorVariant, 
  SizeVariant, 
  SizeWithColors,
  StockCombination, 
  ItemSetType,
  PatternDefinition
} from './EnhancedStockTypes';
import { 
  X, Plus, Upload, Palette, Ruler, 
  Package, Settings, Trash2, Edit, ImagePlus, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface SizeFirstStockFormProps {
  itemSetType: ItemSetType;
  sizeWithColors: SizeWithColors[];
  setSizeWithColors: (sizes: SizeWithColors[]) => void;
  combinations: StockCombination[];
  setCombinations: (combinations: StockCombination[]) => void;
  availableSizes: SizeVariant[];
}

const predefinedColors = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Red', code: '#DC2626' },
  { name: 'Blue', code: '#2563EB' },
  { name: 'Green', code: '#16A34A' },
  { name: 'Yellow', code: '#EAB308' },
  { name: 'Pink', code: '#EC4899' },
  { name: 'Purple', code: '#9333EA' },
  { name: 'Orange', code: '#EA580C' },
  { name: 'Gray', code: '#6B7280' },
  { name: 'Brown', code: '#92400E' },
  { name: 'Navy', code: '#1E3A8A' },
  { name: 'Maroon', code: '#7F1D1D' },
  { name: 'Beige', code: '#D6D3D1' }
];

export function SizeFirstStockForm({
  itemSetType,
  sizeWithColors,
  setSizeWithColors,
  combinations,
  setCombinations,
  availableSizes
}: SizeFirstStockFormProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [customSizeName, setCustomSizeName] = useState('');
  const [sizeTab, setSizeTab] = useState<'standard' | 'custom'>('standard');
  const [showSummary, setShowSummary] = useState(false);
  
  // Color/Pattern states for adding to a size
  const [activeSizeId, setActiveSizeId] = useState<string>('');
  const [patternName, setPatternName] = useState('');
  const [patternColorCode, setPatternColorCode] = useState('#000000');
  const [selectedPredefinedColor, setSelectedPredefinedColor] = useState('');
  const [patternImage, setPatternImage] = useState('');
  
  // File handling
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createFileInputRef = (key: string) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[key] = el;
  };

  const triggerFileInput = (key: string) => {
    const input = fileInputRefs.current[key];
    if (input) {
      input.click();
    }
  };

  const handlePatternImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPatternImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSize = () => {
    let newSize: SizeVariant;
    
    if (sizeTab === 'custom') {
      if (!customSizeName.trim()) {
        toast.error('Please enter a custom size name');
        return;
      }
      newSize = {
        id: generateId(),
        name: customSizeName.trim(),
        displayName: customSizeName.trim()
      };
    } else {
      if (!selectedSize) {
        toast.error('Please select a size');
        return;
      }
      const existingSize = availableSizes.find(s => s.name === selectedSize);
      if (!existingSize) {
        toast.error('Invalid size selection');
        return;
      }
      newSize = existingSize;
    }

    // Check if size already exists
    if (sizeWithColors.some(swc => swc.size.name === newSize.name)) {
      toast.error('This size has already been added');
      return;
    }

    const newSizeWithColors: SizeWithColors = {
      id: generateId(),
      size: newSize,
      colors: []
    };

    setSizeWithColors([...sizeWithColors, newSizeWithColors]);
    
    // Reset form
    setSelectedSize('');
    setCustomSizeName('');
    
    toast.success(`Size ${newSize.displayName} added successfully`);
  };

  const removeSize = (sizeWithColorsId: string) => {
    const updatedSizes = sizeWithColors.filter(swc => swc.id !== sizeWithColorsId);
    setSizeWithColors(updatedSizes);
    
    // Remove related combinations
    const sizesToRemove = sizeWithColors.find(swc => swc.id === sizeWithColorsId);
    if (sizesToRemove) {
      const updatedCombinations = combinations.filter(c => c.sizeId !== sizesToRemove.size.id);
      setCombinations(updatedCombinations);
    }
    
    toast.success('Size removed successfully');
  };

  const addColorToSize = (sizeWithColorsId: string) => {
    const hasName = patternName.trim().length > 0;
    const hasColor = patternColorCode !== '' && patternColorCode !== '#000000';
    const hasImage = patternImage.length > 0;

    // Validate that at least one definition method is provided
    if (!hasName && !hasColor && !hasImage) {
      toast.error('Please provide at least one: Pattern Name, Color, or Image');
      return;
    }

    // Generate display name
    const displayName = hasName ? patternName.trim() : 
                       hasColor ? `Color ${Date.now().toString().slice(-4)}` : 
                       hasImage ? `Pattern ${Date.now().toString().slice(-4)}` : 
                       `Item ${Date.now().toString().slice(-4)}`;

    const newColor: ColorVariant = {
      id: generateId(),
      name: hasName ? patternName.trim() : displayName,
      colorCode: hasColor ? patternColorCode : undefined,
      patternImage: hasImage ? patternImage : undefined,
      images: hasImage ? [patternImage] : [],
      definition: {
        hasName,
        hasColorPicker: hasColor,
        hasImage
      }
    };

    // Find the size and add the color
    const updatedSizes = sizeWithColors.map(swc => {
      if (swc.id === sizeWithColorsId) {
        return {
          ...swc,
          colors: [...swc.colors, newColor]
        };
      }
      return swc;
    });

    setSizeWithColors(updatedSizes);

    // Reset color form
    setPatternName('');
    setPatternColorCode('#000000');
    setSelectedPredefinedColor('');
    setPatternImage('');
    setActiveSizeId('');

    toast.success(`Color/Pattern added to size successfully`);
  };

  const removeColorFromSize = (sizeWithColorsId: string, colorId: string) => {
    const updatedSizes = sizeWithColors.map(swc => {
      if (swc.id === sizeWithColorsId) {
        return {
          ...swc,
          colors: swc.colors.filter(c => c.id !== colorId)
        };
      }
      return swc;
    });

    setSizeWithColors(updatedSizes);

    // Remove related combinations
    const updatedCombinations = combinations.filter(c => c.colorId !== colorId);
    setCombinations(updatedCombinations);

    toast.success('Color/Pattern removed successfully');
  };

  const generateCombinations = () => {
    const newCombinations: StockCombination[] = [];

    sizeWithColors.forEach(swc => {
      swc.colors.forEach(color => {
        const newCombination: StockCombination = {
          id: generateId(),
          colorId: color.id,
          sizeId: swc.size.id,
          quantity: 0,
          availableQuantity: 0,
          images: []
        };
        newCombinations.push(newCombination);
      });
    });

    setCombinations(newCombinations);
    toast.success(`Generated ${newCombinations.length} combinations`);
  };

  const updateCombinationQuantity = (combinationId: string, quantity: number) => {
    const updatedCombinations = combinations.map(combo => {
      if (combo.id === combinationId) {
        return {
          ...combo,
          quantity: Math.max(0, quantity), // Ensure non-negative
          availableQuantity: Math.max(0, quantity) // Set available quantity same as quantity initially
        };
      }
      return combo;
    });
    setCombinations(updatedCombinations);
  };

  const getSizeDisplayName = (sizeId: string): string => {
    for (const swc of sizeWithColors) {
      if (swc.size.id === sizeId) {
        return swc.size.displayName;
      }
    }
    
    // Fallback: check if this is a custom size name stored directly
    if (sizeId && typeof sizeId === 'string' && sizeId.length > 0) {
      // If sizeId looks like a custom size name (not a UUID), return it directly
      if (!sizeId.includes('-') || sizeId.length < 10) {
        return sizeId;
      }
    }
    
    // Debug log for troubleshooting
    console.warn('Size not found:', { 
      sizeId, 
      availableSizes: sizeWithColors.map(swc => ({ id: swc.size.id, name: swc.size.displayName }))
    });
    
    return 'Unknown Size';
  };

  const getColorDisplayName = (colorId: string): string => {
    for (const swc of sizeWithColors) {
      const color = swc.colors.find(c => c.id === colorId);
      if (color) {
        return color.name;
      }
    }
    return 'Unknown Color';
  };

  const getColorInfo = (colorId: string): ColorVariant | undefined => {
    for (const swc of sizeWithColors) {
      const color = swc.colors.find(c => c.id === colorId);
      if (color) {
        return color;
      }
    }
    return undefined;
  };

  return (
    <>
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/30 to-green-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Size & Color Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure sizes and colors for your product in three simple steps
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Add Sizes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">
              1
            </div>
            <h3 className="font-medium text-blue-900">Add Sizes</h3>
            <div className="flex-1 h-px bg-blue-200"></div>
          </div>
          
          <Tabs value={sizeTab} onValueChange={(value) => setSizeTab(value as 'standard' | 'custom')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard">Available Sizes</TabsTrigger>
              <TabsTrigger value="custom">Custom Size</TabsTrigger>
            </TabsList>
            
            <TabsContent value="standard" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Size</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes
                      .filter(size => !sizeWithColors.some(swc => swc.size.name === size.name))
                      .map(size => (
                        <SelectItem key={size.id} value={size.name}>
                          {size.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                type="button"
                onClick={addSize}
                disabled={!selectedSize}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Selected Size
              </Button>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Size Name</Label>
                <Input
                  value={customSizeName}
                  onChange={(e) => setCustomSizeName(e.target.value)}
                  placeholder="Enter custom size (e.g., XL+, 44, Custom Fit)"
                />
                <p className="text-xs text-muted-foreground">
                  Add any size not available in the standard list
                </p>
              </div>
              
              <Button
                type="button"
                onClick={addSize}
                disabled={!customSizeName.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Size
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Step 2: Add Colors/Patterns for Each Size */}
        {sizeWithColors.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="flex items-center justify-center w-6 h-6 bg-orange-600 text-white rounded-full text-sm font-medium">
                  2
                </div>
                <h3 className="font-medium text-orange-900">Add Colors for Each Size</h3>
                <div className="flex-1 h-px bg-orange-200"></div>
              </div>
              
              <div className="space-y-4">
                {sizeWithColors.map((swc, index) => (
                  <div key={swc.id} className="border rounded-lg p-4 bg-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Size: {swc.size.displayName}
                        </Badge>
                        <Badge variant="outline">
                          {swc.colors.length} color{swc.colors.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSize(swc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Display existing colors for this size */}
                    {swc.colors.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {swc.colors.map((color) => (
                            <div key={color.id} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                              {color.colorCode && (
                                <div 
                                  className="w-4 h-4 rounded border border-gray-300"
                                  style={{ backgroundColor: color.colorCode }}
                                />
                              )}
                              {color.patternImage && (
                                <img 
                                  src={color.patternImage} 
                                  alt="Pattern" 
                                  className="w-4 h-4 rounded object-cover border"
                                />
                              )}
                              <span className="text-xs font-medium">{color.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeColorFromSize(swc.id, color.id)}
                                className="text-red-600 hover:text-red-700 p-1 h-auto"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add color form for this size */}
                    {activeSizeId === swc.id ? (
                      <div className="space-y-4 border-t pt-4">
                        <div className="bg-blue-50/50 rounded-lg p-3 mb-4 border border-blue-200">
                          <p className="text-sm text-blue-800 font-medium mb-1">
                            🎯 Choose ANY ONE of the following options (not all required):
                          </p>
                          <p className="text-xs text-blue-600">
                            You only need Pattern Name OR Color OR Image - just pick one!
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Option 1: Name */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Option 1</span>
                              Pattern Name
                            </Label>
                            <Input
                              value={patternName}
                              onChange={(e) => setPatternName(e.target.value)}
                              placeholder="e.g., Stripes, Floral"
                              className={patternName.trim() ? "border-green-300 bg-green-50/30" : ""}
                            />
                            {patternName.trim() && (
                              <p className="text-xs text-green-600">✓ Pattern name provided</p>
                            )}
                          </div>

                          {/* Option 2: Color Picker */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Option 2</span>
                              Color Picker
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={patternColorCode}
                                onChange={(e) => setPatternColorCode(e.target.value)}
                                className="w-16 h-10 p-1"
                              />
                              <Select value={selectedPredefinedColor} onValueChange={(value) => {
                                const predefined = predefinedColors.find(c => c.name === value);
                                if (predefined) {
                                  setPatternColorCode(predefined.code);
                                  setSelectedPredefinedColor(value);
                                }
                              }}>
                                <SelectTrigger className={`flex-1 ${patternColorCode !== '#000000' ? "border-blue-300 bg-blue-50/30" : ""}`}>
                                  <SelectValue placeholder="Or choose preset" />
                                </SelectTrigger>
                                <SelectContent>
                                  {predefinedColors.map(color => (
                                    <SelectItem key={color.name} value={color.name}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded border"
                                          style={{ backgroundColor: color.code }}
                                        />
                                        {color.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {patternColorCode !== '#000000' && (
                              <p className="text-xs text-blue-600">✓ Color selected</p>
                            )}
                          </div>

                          {/* Option 3: Image Upload */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">Option 3</span>
                              Pattern Image
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => triggerFileInput(`pattern-image-${swc.id}`)}
                              className={`w-full ${patternImage ? "border-purple-300 bg-purple-50/30" : ""}`}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </Button>
                            <input
                              type="file"
                              ref={createFileInputRef(`pattern-image-${swc.id}`)}
                              onChange={handlePatternImageUpload}
                              accept="image/*"
                              style={{ display: 'none' }}
                            />
                            {patternImage && (
                              <div className="flex items-center gap-2 p-2 bg-purple-50/50 rounded border border-purple-200">
                                <img 
                                  src={patternImage} 
                                  alt="Pattern preview" 
                                  className="w-8 h-8 rounded object-cover border"
                                />
                                <span className="text-xs text-purple-600">✓ Image uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {/* Status indicator */}
                          <div className="flex items-center gap-2 text-sm">
                            {(() => {
                              const hasName = patternName.trim().length > 0;
                              const hasColor = patternColorCode !== '#000000';
                              const hasImage = !!patternImage;
                              const hasAnyOption = hasName || hasColor || hasImage;
                              
                              if (!hasAnyOption) {
                                return (
                                  <span className="text-orange-600 flex items-center gap-1">
                                    <Settings className="h-4 w-4" />
                                    Please choose ANY ONE option above to proceed
                                  </span>
                                );
                              } else {
                                const selectedOptions = [
                                  hasName && "Pattern Name",
                                  hasColor && "Color",
                                  hasImage && "Image"
                                ].filter(Boolean);
                                
                                return (
                                  <span className="text-green-600 flex items-center gap-1">
                                    ✓ Ready to add ({selectedOptions.join(", ")} selected)
                                  </span>
                                );
                              }
                            })()}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => addColorToSize(swc.id)}
                              disabled={!patternName.trim() && patternColorCode === '#000000' && !patternImage}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Color/Pattern
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setActiveSizeId('')}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveSizeId(swc.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Color/Pattern for {swc.size.displayName}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Generate Combinations */}
        {sizeWithColors.length > 0 && sizeWithColors.some(swc => swc.colors.length > 0) && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-medium">
                  3
                </div>
                <h3 className="font-medium text-green-900">Generate Combinations</h3>
                <div className="flex-1 h-px bg-green-200"></div>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total combinations: {sizeWithColors.reduce((acc, swc) => acc + swc.colors.length, 0)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={generateCombinations}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Generate Combinations
                  </Button>
                </div>

                {combinations.length > 0 && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ {combinations.length} combinations generated successfully
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 4: Set Quantities for Each Combination */}
        {combinations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-medium">
                  4
                </div>
                <h3 className="font-medium text-purple-900">Set Quantities</h3>
                <div className="flex-1 h-px bg-purple-200"></div>
              </div>
              
              <div className="bg-white/50 rounded-lg p-4 border space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Set the quantity available for each size-color combination
                </p>
                
                <div className="grid gap-4">
                  {combinations.map((combination) => {
                    const colorInfo = getColorInfo(combination.colorId);
                    const sizeDisplayName = getSizeDisplayName(combination.sizeId);
                    const colorDisplayName = getColorDisplayName(combination.colorId);
                    
                    return (
                      <div key={combination.id} className="flex items-center gap-4 p-3 border rounded-lg bg-white/70">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Size Badge */}
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {sizeDisplayName || `Debug: ID=${combination.sizeId?.substring(0, 10)}`}
                          </Badge>
                          
                          {/* Color Info */}
                          <div className="flex items-center gap-2">
                            {colorInfo?.colorCode && (
                              <div 
                                className="w-5 h-5 rounded border border-gray-300"
                                style={{ backgroundColor: colorInfo.colorCode }}
                              />
                            )}
                            {colorInfo?.patternImage && (
                              <img 
                                src={colorInfo.patternImage} 
                                alt="Pattern" 
                                className="w-5 h-5 rounded object-cover border"
                              />
                            )}
                            <Badge variant="outline" className="bg-orange-50 text-orange-800">
                              {colorDisplayName}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Quantity Input */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium whitespace-nowrap">Qty:</Label>
                          <Input
                            type="number"
                            min="0"
                            value={combination.quantity}
                            onChange={(e) => updateCombinationQuantity(combination.id, parseInt(e.target.value) || 0)}
                            className="w-20 h-8 text-center"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary */}
                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-800 font-medium">
                        Total Units: {combinations.reduce((sum, combo) => sum + combo.quantity, 0)}
                      </p>
                      <p className="text-xs text-purple-600">
                        Combinations with stock: {combinations.filter(combo => combo.quantity > 0).length} of {combinations.length}
                      </p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const defaultQuantity = 10;
                          const updatedCombinations = combinations.map(combo => ({
                            ...combo,
                            quantity: defaultQuantity,
                            availableQuantity: defaultQuantity
                          }));
                          setCombinations(updatedCombinations);
                          toast.success(`Set all quantities to ${defaultQuantity}`);
                        }}
                        className="text-xs"
                      >
                        Set All to 10
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedCombinations = combinations.map(combo => ({
                            ...combo,
                            quantity: 0,
                            availableQuantity: 0
                          }));
                          setCombinations(updatedCombinations);
                          toast.success('Cleared all quantities');
                        }}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowSummary(true)}
                        disabled={combinations.filter(combo => combo.quantity > 0).length === 0}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        View Item Summary
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* Item Summary Dialog */}
    <Dialog open={showSummary} onOpenChange={setShowSummary}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Item Summary
          </DialogTitle>
          <DialogDescription>
            Review your stock configuration details before adding to inventory
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overview Card */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">Stock Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sizeWithColors.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sizes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sizeWithColors.reduce((acc, swc) => acc + swc.colors.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Colors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {combinations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Combinations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {combinations.reduce((sum, combo) => sum + combo.quantity, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Units</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Size & Color Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sizeWithColors.map((swc) => (
                <div key={swc.id} className="border rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Size: {swc.size.displayName}
                    </Badge>
                    <Badge variant="outline">
                      {swc.colors.length} color{swc.colors.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-2">
                    {swc.colors.map((color) => {
                      const relatedCombinations = combinations.filter(c => c.colorId === color.id && c.sizeId === swc.size.id);
                      const totalQuantity = relatedCombinations.reduce((sum, combo) => sum + combo.quantity, 0);
                      
                      return (
                        <div key={color.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            {color.colorCode && (
                              <div 
                                className="w-5 h-5 rounded border border-gray-300"
                                style={{ backgroundColor: color.colorCode }}
                              />
                            )}
                            {color.patternImage && (
                              <img 
                                src={color.patternImage} 
                                alt="Pattern" 
                                className="w-5 h-5 rounded object-cover border"
                              />
                            )}
                            <span className="font-medium">{color.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Qty: {totalQuantity}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stock Combinations with Quantities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Final Stock Combinations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Only combinations with stock quantity &gt; 0 are shown
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {combinations
                  .filter(combo => combo.quantity > 0)
                  .map((combination) => {
                    const colorInfo = getColorInfo(combination.colorId);
                    const sizeDisplayName = getSizeDisplayName(combination.sizeId);
                    const colorDisplayName = getColorDisplayName(combination.colorId);
                    
                    return (
                      <div key={combination.id} className="flex items-center justify-between p-3 border rounded-lg bg-white/70">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {sizeDisplayName}
                          </Badge>
                          
                          <div className="flex items-center gap-2">
                            {colorInfo?.colorCode && (
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: colorInfo.colorCode }}
                              />
                            )}
                            {colorInfo?.patternImage && (
                              <img 
                                src={colorInfo.patternImage} 
                                alt="Pattern" 
                                className="w-4 h-4 rounded object-cover border"
                              />
                            )}
                            <span className="text-sm font-medium">{colorDisplayName}</span>
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {combination.quantity} units
                        </Badge>
                      </div>
                    );
                  })}
              </div>
              
              {combinations.filter(combo => combo.quantity > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No combinations with stock quantity found</p>
                  <p className="text-sm">Please set quantities for at least one combination</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => setShowSummary(false)}>
            Edit Configuration
          </Button>
          <Button 
            onClick={() => {
              // Add the actual stock submission logic here
              toast.success('Stock item configuration complete! Ready to add to inventory.');
              setShowSummary(false);
            }}
            className="bg-green-600 hover:bg-green-700"
            disabled={combinations.filter(combo => combo.quantity > 0).length === 0}
          >
            Add to Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  ColorVariant, 
  SizeVariant, 
  StockCombination, 
  ItemSetType,
  PatternDefinition
} from './EnhancedStockTypes';
import { 
  X, Plus, Upload, Palette, Ruler, 
  Package, Settings, Trash2, Edit, ImagePlus, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface NewSizeInformationSectionProps {
  itemSetType: ItemSetType;
  colors: ColorVariant[];
  sizes: SizeVariant[];
  combinations: StockCombination[];
  setColors: React.Dispatch<React.SetStateAction<ColorVariant[]>>;
  setSizes: React.Dispatch<React.SetStateAction<SizeVariant[]>>;
  setCombinations: React.Dispatch<React.SetStateAction<StockCombination[]>>;
  openImageCapture: (type: 'color' | 'combination', colorId?: string, combinationId?: string) => void;
  flexibleSelectionAllowed: boolean;
  setFlexibleSelectionAllowed: React.Dispatch<React.SetStateAction<boolean>>;
  addImageToColor: (colorId: string, imageUrl: string) => void;
  addImageToCombination: (combinationId: string, imageUrl: string) => void;
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

const standardSizes = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46'
];

export function NewSizeInformationSection({
  itemSetType,
  colors,
  sizes,
  combinations,
  setColors,
  setSizes,
  setCombinations,
  openImageCapture,
  flexibleSelectionAllowed,
  setFlexibleSelectionAllowed,
  addImageToColor,
  addImageToCombination
}: NewSizeInformationSectionProps) {
  // Pattern Definition State
  const [patternName, setPatternName] = useState('');
  const [patternColorCode, setPatternColorCode] = useState('#000000');
  const [patternImage, setPatternImage] = useState<string>('');
  const [selectedPredefinedColor, setSelectedPredefinedColor] = useState('');
  
  // Other states
  const [newSizeName, setNewSizeName] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [selectedStandardSizes, setSelectedStandardSizes] = useState<string[]>([]);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [editingCombination, setEditingCombination] = useState<string | null>(null);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle file upload for pattern images
  const handlePatternImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setPatternImage(imageDataUrl);
      toast.success('Pattern image uploaded');
    };
    reader.readAsDataURL(file);

    // Reset the input
    event.target.value = '';
  };

  // Handle file upload for color/combination images
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, colorId?: string, combinationId?: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      if (colorId) {
        addImageToColor(colorId, imageDataUrl);
        toast.success('Image added to pattern/color');
      } else if (combinationId) {
        addImageToCombination(combinationId, imageDataUrl);
        toast.success('Image added to combination');
      }
    };
    reader.readAsDataURL(file);

    // Reset the input
    event.target.value = '';
  };

  // Create file input reference
  const createFileInputRef = (id: string) => {
    if (!fileInputRefs.current[id]) {
      fileInputRefs.current[id] = null;
    }
    return (ref: HTMLInputElement | null) => {
      fileInputRefs.current[id] = ref;
    };
  };

  // Trigger file input
  const triggerFileInput = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  // Add pattern with validation
  const addPattern = () => {
    const hasName = patternName.trim().length > 0;
    const hasColor = patternColorCode !== '' && patternColorCode !== '#000000';
    const hasImage = patternImage.length > 0;

    // Validate that at least one definition method is provided
    if (!hasName && !hasColor && !hasImage) {
      toast.error('Please provide at least one: Pattern Name, Color, or Image');
      return;
    }

    // Check for duplicate patterns
    const existingColor = colors.find(c => 
      (hasName && c.name && c.name?.toLowerCase() === patternName?.trim()?.toLowerCase()) ||
      (hasColor && c.colorCode === patternColorCode) ||
      (hasImage && c.patternImage === patternImage)
    );
    
    if (existingColor) {
      toast.error('This pattern/color already exists');
      return;
    }

    // Create the pattern definition
    const definition: PatternDefinition = {
      hasColorPicker: hasColor,
      hasImage: hasImage,
      hasName: hasName
    };

    // Generate a display name if no name provided
    const displayName = hasName ? patternName.trim() : 
                       hasColor ? `Color ${colors.length + 1}` : 
                       hasImage ? `Pattern ${colors.length + 1}` : 
                       `Item ${colors.length + 1}`;

    const newColor: ColorVariant = {
      id: generateId(),
      name: hasName ? patternName.trim() : undefined,
      colorCode: hasColor ? patternColorCode : undefined,
      patternImage: hasImage ? patternImage : undefined,
      images: [],
      definition
    };

    setColors(prev => [...prev, newColor]);
    
    // Reset form for next pattern
    setPatternName('');
    setPatternColorCode('#000000');
    setPatternImage('');
    setSelectedPredefinedColor('');
    
    toast.success(`Added pattern: ${displayName}`);
  };

  // Render pattern card
  const renderPatternCard = (color: ColorVariant, index: number) => {
    const { definition } = color;
    const displayName = color.name || `Pattern ${index + 1}`;
    
    return (
      <Card key={color.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {displayName}
              <div className="flex gap-1">
                {definition.hasName && <Badge variant="outline" className="text-xs">Name</Badge>}
                {definition.hasColorPicker && <Badge variant="outline" className="text-xs">Color</Badge>}
                {definition.hasImage && <Badge variant="outline" className="text-xs">Image</Badge>}
              </div>
            </CardTitle>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setCombinations(prev => prev.filter(c => c.colorId !== color.id));
                setColors(prev => prev.filter(c => c.id !== color.id));
                toast.success('Pattern removed');
              }}
              title="Delete pattern"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Pattern Preview */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              {definition.hasColorPicker && color.colorCode && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border-2 border-gray-300"
                    style={{ backgroundColor: color.colorCode }}
                  />
                  <span className="text-sm text-muted-foreground">{color.colorCode}</span>
                </div>
              )}
              
              {definition.hasImage && color.patternImage && (
                <div className="flex items-center gap-2">
                  <img 
                    src={color.patternImage} 
                    alt="Pattern" 
                    className="w-12 h-12 rounded object-cover border-2 border-gray-300"
                  />
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {definition.hasName && color.name && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{color.name}</Badge>
                </div>
              )}
            </div>

            {/* Size Selection for Pattern */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select Sizes for {displayName}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add custom size"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    className="w-32"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSizeName.trim()) {
                        // Check if size already exists for this pattern
                        const existingCombination = combinations.find(c => {
                          const existingSize = sizes.find(s => s.id === c.sizeId);
                          return c.colorId === color.id && existingSize?.name?.toLowerCase() === newSizeName.trim().toLowerCase();
                        });

                        if (existingCombination) {
                          toast.error('This size already exists for this pattern');
                          return;
                        }

                        // Add custom size to this pattern
                        let sizeId;
                        const existingSize = sizes.find(s => s.name.toLowerCase() === newSizeName.trim().toLowerCase());
                        if (existingSize) {
                          sizeId = existingSize.id;
                        } else {
                          const newSize: SizeVariant = {
                            id: generateId(),
                            name: newSizeName.trim(),
                            displayName: newSizeName.trim()
                          };
                          setSizes(prev => [...prev, newSize]);
                          sizeId = newSize.id;
                        }

                        const newCombination: StockCombination = {
                          id: generateId(),
                          colorId: color.id,
                          sizeId,
                          quantity: 0,
                          availableQuantity: 0,
                          images: []
                        };

                        setCombinations(prev => [...prev, newCombination]);
                        setNewSizeName('');
                        toast.success(`Added custom size: ${newSizeName.trim()} to ${displayName}`);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newSizeName.trim()) {
                        // Check if size already exists for this pattern
                        const existingCombination = combinations.find(c => {
                          const existingSize = sizes.find(s => s.id === c.sizeId);
                          return c.colorId === color.id && existingSize?.name.toLowerCase() === newSizeName.trim().toLowerCase();
                        });

                        if (existingCombination) {
                          toast.error('This size already exists for this pattern');
                          return;
                        }

                        // Add custom size to this pattern
                        let sizeId;
                        const existingSize = sizes.find(s => s.name.toLowerCase() === newSizeName.trim().toLowerCase());
                        if (existingSize) {
                          sizeId = existingSize.id;
                        } else {
                          const newSize: SizeVariant = {
                            id: generateId(),
                            name: newSizeName.trim(),
                            displayName: newSizeName.trim()
                          };
                          setSizes(prev => [...prev, newSize]);
                          sizeId = newSize.id;
                        }

                        const newCombination: StockCombination = {
                          id: generateId(),
                          colorId: color.id,
                          sizeId,
                          quantity: 0,
                          availableQuantity: 0,
                          images: []
                        };

                        setCombinations(prev => [...prev, newCombination]);
                        setNewSizeName('');
                        toast.success(`Added custom size: ${newSizeName.trim()} to ${displayName}`);
                      }
                    }}
                    disabled={!newSizeName.trim()}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {/* Standard sizes */}
                {standardSizes.map(size => {
                  const existingCombination = combinations.find(c => {
                    const existingSize = sizes.find(s => s.id === c.sizeId);
                    return c.colorId === color.id && existingSize?.name.toLowerCase() === size.toLowerCase();
                  });

                  return (
                    <div key={size} className="flex items-center space-x-1">
                      <Checkbox
                        id={`${color.id}-size-${size}`}
                        checked={!!existingCombination}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Add this size to the pattern
                            let sizeId;
                            const existingSize = sizes.find(s => s.name.toLowerCase() === size.toLowerCase());
                            if (existingSize) {
                              sizeId = existingSize.id;
                            } else {
                              const newSize: SizeVariant = {
                                id: generateId(),
                                name: size,
                                displayName: size
                              };
                              setSizes(prev => [...prev, newSize]);
                              sizeId = newSize.id;
                            }

                            const newCombination: StockCombination = {
                              id: generateId(),
                              colorId: color.id,
                              sizeId,
                              quantity: 0,
                              availableQuantity: 0,
                              images: []
                            };

                            setCombinations(prev => [...prev, newCombination]);
                            toast.success(`Added ${size} to ${displayName}`);
                          } else {
                            // Remove this size from the pattern
                            if (existingCombination) {
                              setCombinations(prev => prev.filter(c => c.id !== existingCombination.id));
                              toast.success(`Removed ${size} from ${displayName}`);
                            }
                          }
                        }}
                      />
                      <Label htmlFor={`${color.id}-size-${size}`} className="text-xs cursor-pointer whitespace-nowrap">
                        {size}
                      </Label>
                    </div>
                  );
                })}

                {/* Custom sizes for this pattern */}
                {combinations.filter(c => c.colorId === color.id).map(combination => {
                  const size = sizes.find(s => s.id === combination.sizeId);
                  if (!size || standardSizes.includes(size.name)) return null;

                  return (
                    <div key={combination.id} className="flex items-center space-x-1">
                      <Checkbox
                        id={`${color.id}-size-${size.name}`}
                        checked={true}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setCombinations(prev => prev.filter(c => c.id !== combination.id));
                            toast.success(`Removed custom size ${size.name} from ${displayName}`);
                          }
                        }}
                      />
                      <Label htmlFor={`${color.id}-size-${size.name}`} className="text-xs cursor-pointer whitespace-nowrap">
                        {size.displayName} <Badge variant="outline" className="text-xs ml-1">✦</Badge>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Management */}
            {(() => {
              const patternCombinations = combinations.filter(c => c.colorId === color.id);
              if (patternCombinations.length === 0) return null;

              return (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Set Quantities for {displayName}</Label>
                  <div className="grid gap-2 max-h-32 overflow-y-auto">
                    {patternCombinations.map(combination => {
                      const size = sizes.find(s => s.id === combination.sizeId);
                      return (
                        <div key={combination.id} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{size?.displayName || 'Unknown'}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Qty:</Label>
                            <Input
                              type="number"
                              min="0"
                              value={combination.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 0;
                                setCombinations(prev => prev.map(c => 
                                  c.id === combination.id 
                                    ? { ...c, quantity: newQuantity, availableQuantity: newQuantity }
                                    : c
                                ));
                              }}
                              className="w-20"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Set of Pattern Implementation
  if (itemSetType === 'set_of_pattern') {
    return (
      <div className="space-y-6">
        {/* Pattern Definition Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <Label className="text-base font-medium">Define Pattern/Color</Label>
          </div>
          
          <Card className="border-2 border-orange-200 bg-orange-50/20">
            <CardHeader>
              <CardTitle className="text-base">Add New Pattern/Color</CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide at least one of the following: Name, Color, or Image
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Three Definition Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Option 1: Name */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option 1: Pattern Name</Label>
                    {patternName.trim() && <Badge variant="secondary" className="text-xs">✓ Added</Badge>}
                  </div>
                  <Input
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    placeholder="e.g., Stripes, Floral, Polka Dots"
                    className="w-full"
                  />
                </div>

                {/* Option 2: Color Picker */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option 2: Color Picker</Label>
                    {patternColorCode !== '#000000' && <Badge variant="secondary" className="text-xs">✓ Added</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={patternColorCode}
                      onChange={(e) => setPatternColorCode(e.target.value)}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                      title="Pick color"
                    />
                    <Select value={selectedPredefinedColor} onValueChange={(value) => {
                      const predefined = predefinedColors.find(c => c.name === value);
                      if (predefined) {
                        setPatternColorCode(predefined.code);
                        setSelectedPredefinedColor(value);
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Or choose preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedColors.map(color => (
                          <SelectItem key={color.name} value={color.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color.code }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Option 3: Image Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option 3: Pattern Image</Label>
                    {patternImage && <Badge variant="secondary" className="text-xs">✓ Added</Badge>}
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => triggerFileInput('pattern-image')}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Pattern Image
                    </Button>
                    <input
                      type="file"
                      ref={createFileInputRef('pattern-image')}
                      onChange={handlePatternImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    {patternImage && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <img 
                          src={patternImage} 
                          alt="Pattern preview" 
                          className="w-8 h-8 rounded object-cover border"
                        />
                        <span className="text-xs text-muted-foreground">Image uploaded</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPatternImage('')}
                          className="ml-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Pattern Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  onClick={addPattern}
                  disabled={!patternName.trim() && patternColorCode === '#000000' && !patternImage}
                  className="min-w-[200px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pattern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Added Patterns List */}
        {colors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                <Label className="text-base font-medium">Added Patterns ({colors.length})</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Scroll to pattern definition section
                  document.querySelector('.space-y-6')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Next Pattern
              </Button>
            </div>
            
            <div className="space-y-4">
              {colors.map((color, index) => renderPatternCard(color, index))}
            </div>
          </div>
        )}

        {/* Flexible Selection Toggle */}
        {combinations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <Label className="text-base font-medium">Flexible Selection Settings</Label>
            </div>
            
            <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50/50 to-blue-50/50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id="flexible-selection"
                      checked={flexibleSelectionAllowed}
                      onCheckedChange={setFlexibleSelectionAllowed}
                      className="mr-2"
                    />
                    <Label htmlFor="flexible-selection" className="text-base font-medium text-green-900 cursor-pointer">
                      Allow Flexible Selection
                    </Label>
                  </div>
                  <div className="ml-6 space-y-2 text-sm">
                    <p className="text-green-700">
                      <strong>If ON:</strong> Buyers can select any combination(s) from the list when placing orders
                    </p>
                    <p className="text-green-700">
                      <strong>If OFF:</strong> Buyers must choose only one standard combination per order
                    </p>
                  </div>
                </div>
                <Badge variant={flexibleSelectionAllowed ? "default" : "secondary"} className="ml-4">
                  {flexibleSelectionAllowed ? "Flexible" : "Standard"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Set of Sizes Implementation
  if (itemSetType === 'single_color') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          <Label className="text-base font-medium">Set of Sizes Configuration</Label>
        </div>
        
        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/20">
          <p className="text-sm text-blue-700 mb-4">
            Create size sets where each set contains a group of selected sizes with one color/pattern and quantity field.
          </p>
          
          {/* Enhanced Pattern Definition for Size Sets */}
          <Card className="border-2 border-blue-200 bg-blue-50/20">
            <CardHeader>
              <CardTitle className="text-base">Define Pattern/Color for Size Set</CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide at least one of the following: Name, Color, or Image
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Three Definition Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Option 1: Name */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option 1: Pattern Name</Label>
                    {patternName.trim() && <Badge variant="secondary" className="text-xs">✓ Added</Badge>}
                  </div>
                  <Input
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    placeholder="e.g., Stripes, Navy Blue, Solid"
                    className="w-full"
                  />
                </div>

                {/* Option 2: Color Picker */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option 2: Color Picker</Label>
                    {patternColorCode !== '#000000' && <Badge variant="secondary" className="text-xs">✓ Added</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={patternColorCode}
                      onChange={(e) => setPatternColorCode(e.target.value)}
                      className="w-16 h-10 p-1 border rounded cursor-pointer"
                      title="Pick color"
                    />
                    <Select value={selectedPredefinedColor} onValueChange={(value) => {
                      const predefined = predefinedColors.find(c => c.name === value);
                      if (predefined) {
                        setPatternColorCode(predefined.code);
                        setSelectedPredefinedColor(value);
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Or choose preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedColors.map(color => (
                          <SelectItem key={color.name} value={color.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color.code }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Option 3: Image Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Option 3: Pattern Image</Label>
                    {patternImage && <Badge variant="secondary" className="text-xs">✓ Added</Badge>}
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => triggerFileInput('pattern-image-sizeset')}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Pattern Image
                    </Button>
                    <input
                      type="file"
                      ref={createFileInputRef('pattern-image-sizeset')}
                      onChange={handlePatternImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    {patternImage && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <img 
                          src={patternImage} 
                          alt="Pattern preview" 
                          className="w-8 h-8 rounded object-cover border"
                        />
                        <span className="text-xs text-muted-foreground">Image uploaded</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPatternImage('')}
                          className="ml-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Size Selection with Custom Size Option */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Select Sizes for this Pattern/Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add custom size"
                      value={newSizeName}
                      onChange={(e) => setNewSizeName(e.target.value)}
                      className="w-32"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newSizeName.trim()) {
                          if (!standardSizes.includes(newSizeName.trim()) && !selectedStandardSizes.includes(newSizeName.trim())) {
                            setSelectedStandardSizes(prev => [...prev, newSizeName.trim()]);
                            setNewSizeName('');
                            toast.success(`Added custom size: ${newSizeName.trim()}`);
                          } else {
                            toast.error('Size already exists');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newSizeName.trim()) {
                          if (!standardSizes.includes(newSizeName.trim()) && !selectedStandardSizes.includes(newSizeName.trim())) {
                            setSelectedStandardSizes(prev => [...prev, newSizeName.trim()]);
                            setNewSizeName('');
                            toast.success(`Added custom size: ${newSizeName.trim()}`);
                          } else {
                            toast.error('Size already exists');
                          }
                        }
                      }}
                      disabled={!newSizeName.trim()}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {standardSizes.map(size => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`set-size-${size}`}
                        checked={selectedStandardSizes.includes(size)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStandardSizes(prev => [...prev, size]);
                          } else {
                            setSelectedStandardSizes(prev => prev.filter(s => s !== size));
                          }
                        }}
                      />
                      <Label htmlFor={`set-size-${size}`} className="text-xs cursor-pointer whitespace-nowrap">
                        {size}
                      </Label>
                    </div>
                  ))}
                  {/* Display selected custom sizes */}
                  {selectedStandardSizes.filter(size => !standardSizes.includes(size)).map(size => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`set-size-${size}`}
                        checked={true}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setSelectedStandardSizes(prev => prev.filter(s => s !== size));
                          }
                        }}
                      />
                      <Label htmlFor={`set-size-${size}`} className="text-xs cursor-pointer whitespace-nowrap">
                        {size} <Badge variant="outline" className="text-xs ml-1">Custom</Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantity per Size</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newQuantity || ''}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity for each size"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const hasName = patternName.trim().length > 0;
                      const hasColor = patternColorCode !== '' && patternColorCode !== '#000000';
                      const hasImage = patternImage.length > 0;

                      // Validate pattern definition
                      if (!hasName && !hasColor && !hasImage) {
                        toast.error('Please provide at least one: Pattern Name, Color, or Image');
                        return;
                      }

                      if (selectedStandardSizes.length === 0) {
                        toast.error('Please select at least one size');
                        return;
                      }
                      if (!newQuantity || newQuantity <= 0) {
                        toast.error('Please enter a valid quantity');
                        return;
                      }

                      // Generate display name
                      const displayName = hasName ? patternName.trim() : 
                                         hasColor ? `Color Set ${colors.length + 1}` : 
                                         hasImage ? `Pattern Set ${colors.length + 1}` : 
                                         `Size Set ${colors.length + 1}`;

                      // Check for duplicate patterns
                      const existingColor = colors.find(c => 
                        (hasName && c.name && c.name.toLowerCase() === patternName.trim().toLowerCase()) ||
                        (hasColor && c.colorCode === patternColorCode) ||
                        (hasImage && c.patternImage === patternImage)
                      );
                      
                      if (existingColor) {
                        toast.error('This pattern/color already exists');
                        return;
                      }

                      // Create pattern definition
                      const definition: PatternDefinition = {
                        hasColorPicker: hasColor,
                        hasImage: hasImage,
                        hasName: hasName
                      };

                      // Add color if not exists
                      const newColor: ColorVariant = {
                        id: generateId(),
                        name: hasName ? patternName.trim() : undefined,
                        colorCode: hasColor ? patternColorCode : undefined,
                        patternImage: hasImage ? patternImage : undefined,
                        images: [],
                        definition
                      };
                      setColors(prev => [...prev, newColor]);

                      // Add sizes and combinations
                      selectedStandardSizes.forEach(sizeName => {
                        let sizeId;
                        const existingSize = sizes.find(s => s.name.toLowerCase() === sizeName.toLowerCase());
                        if (existingSize) {
                          sizeId = existingSize.id;
                        } else {
                          const newSize: SizeVariant = {
                            id: generateId(),
                            name: sizeName,
                            displayName: sizeName
                          };
                          setSizes(prev => [...prev, newSize]);
                          sizeId = newSize.id;
                        }

                        const newCombination: StockCombination = {
                          id: generateId(),
                          colorId: newColor.id,
                          sizeId,
                          quantity: newQuantity,
                          availableQuantity: newQuantity,
                          images: []
                        };

                        setCombinations(prev => [...prev, newCombination]);
                      });

                      // Reset form
                      setPatternName('');
                      setPatternColorCode('#000000');
                      setPatternImage('');
                      setSelectedPredefinedColor('');
                      setSelectedStandardSizes([]);
                      setNewQuantity(0);
                      
                      toast.success(`Added size set: ${displayName} with ${selectedStandardSizes.length} sizes`);
                    }}
                    disabled={(!patternName.trim() && patternColorCode === '#000000' && !patternImage) || selectedStandardSizes.length === 0 || !newQuantity}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Size Set
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Display existing size sets with enhanced pattern cards */}
        {colors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Size Sets ({colors.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Scroll to pattern definition section
                  document.querySelector('.space-y-6')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Next Size Set
              </Button>
            </div>
            
            {colors.map((color, index) => {
              const colorCombinations = combinations.filter(c => c.colorId === color.id);
              const { definition } = color;
              const displayName = color.name || `Size Set ${index + 1}`;
              
              return (
                <Card key={color.id} className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        {displayName}
                        <div className="flex gap-1">
                          {definition.hasName && <Badge variant="outline" className="text-xs">Name</Badge>}
                          {definition.hasColorPicker && <Badge variant="outline" className="text-xs">Color</Badge>}
                          {definition.hasImage && <Badge variant="outline" className="text-xs">Image</Badge>}
                        </div>
                        <Badge variant="secondary">{colorCombinations.length} sizes</Badge>
                      </CardTitle>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCombinations(prev => prev.filter(c => c.colorId !== color.id));
                          setColors(prev => prev.filter(c => c.id !== color.id));
                          toast.success('Size set removed');
                        }}
                        title="Delete size set"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Pattern Preview */}
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        {definition.hasColorPicker && color.colorCode && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border-2 border-gray-300"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <span className="text-sm text-muted-foreground">{color.colorCode}</span>
                          </div>
                        )}
                        
                        {definition.hasImage && color.patternImage && (
                          <div className="flex items-center gap-2">
                            <img 
                              src={color.patternImage} 
                              alt="Pattern" 
                              className="w-12 h-12 rounded object-cover border-2 border-gray-300"
                            />
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        
                        {definition.hasName && color.name && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{color.name}</Badge>
                          </div>
                        )}
                      </div>

                      {/* Size and Quantity Display */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Sizes & Quantities</Label>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {colorCombinations.map(combination => {
                            const size = sizes.find(s => s.id === combination.sizeId);
                            const isCustomSize = size && !standardSizes.includes(size.name);
                            return (
                              <div key={combination.id} className="flex items-center gap-1">
                                <Badge variant={isCustomSize ? "outline" : "secondary"}>
                                  {size?.displayName} (Qty: {combination.quantity})
                                  {isCustomSize && <span className="ml-1 text-xs">✦</span>}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Flexible Implementation
  if (itemSetType === 'individual_flex') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <Label className="text-base font-medium">Flexible Configuration</Label>
        </div>
        
        <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50/20">
          <p className="text-sm text-purple-700 mb-4">
            Add one size and one color/image at a time with quantity input. Each combination appears as a row in the table.
          </p>
          
          {/* Add Combination Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Size</Label>
              <div className="flex gap-2">
                <Select value={newSizeName} onValueChange={setNewSizeName}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Size</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewSizeName('custom')}
                  title="Add custom size"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {newSizeName === 'custom' && (
                <Input
                  placeholder="Enter custom size (e.g., 29, 31, 3XL)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="mt-2"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customSizeInput.trim()) {
                      e.preventDefault();
                      const customSize = customSizeInput.trim();
                      
                      // Check if size already exists
                      const existingSize = sizes.find(s => s.name.toLowerCase() === customSize.toLowerCase());
                      if (existingSize) {
                        toast.error('This size already exists');
                        return;
                      }
                      
                      // Add the custom size
                      const newSize: SizeVariant = {
                        id: generateId(),
                        name: customSize,
                        displayName: customSize
                      };
                      
                      setSizes(prev => [...prev, newSize]);
                      toast.success(`Custom size "${customSize}" added`);
                      
                      // Clear the input and reset selection
                      setCustomSizeInput('');
                      setNewSizeName('');
                    }
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Pattern/Color Definition</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={patternColorCode}
                  onChange={(e) => setPatternColorCode(e.target.value)}
                  className="w-12 h-10 p-1 border rounded cursor-pointer"
                  title="Pick color"
                />
                <Input
                  value={patternName}
                  onChange={(e) => setPatternName(e.target.value)}
                  placeholder="Pattern/Color name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => triggerFileInput('pattern-image-flex')}
                  title="Upload pattern image"
                >
                  <Upload className="h-3 w-3" />
                  {patternImage && <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>}
                </Button>
                <input
                  type="file"
                  ref={createFileInputRef('pattern-image-flex')}
                  onChange={handlePatternImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              {patternImage && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <img 
                    src={patternImage} 
                    alt="Pattern preview" 
                    className="w-6 h-6 rounded object-cover border"
                  />
                  <span className="text-xs text-muted-foreground">Pattern image uploaded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPatternImage('')}
                    className="ml-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantity</Label>
              <Input
                type="number"
                min="0"
                value={newQuantity || ''}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                placeholder="Quantity"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium invisible">Action</Label>
              <Button
                type="button"
                onClick={() => {
                  // Determine the actual size to use
                  let size = '';
                  if (newSizeName === 'custom') {
                    if (!customSizeInput.trim()) {
                      toast.error('Please enter a custom size');
                      return;
                    }
                    size = customSizeInput.trim();
                  } else {
                    size = newSizeName;
                  }
                  
                  const hasName = patternName.trim().length > 0;
                  const hasColor = patternColorCode !== '' && patternColorCode !== '#000000';
                  const hasImage = patternImage.length > 0;

                  // Validate inputs
                  if (!size.trim()) {
                    toast.error('Please select or enter a size');
                    return;
                  }
                  if (!hasName && !hasColor && !hasImage) {
                    toast.error('Please provide at least one: Pattern Name, Color, or Image');
                    return;
                  }
                  if (!newQuantity || newQuantity <= 0) {
                    toast.error('Please enter a valid quantity');
                    return;
                  }

                  // Generate display name
                  const displayName = hasName ? patternName.trim() : 
                                     hasColor ? `Color ${colors.length + 1}` : 
                                     hasImage ? `Pattern ${colors.length + 1}` : 
                                     `Item ${colors.length + 1}`;

                  // Check if this combination already exists
                  const existingCombination = combinations.find(c => {
                    const existingSize = sizes.find(s => s.id === c.sizeId);
                    const existingColor = colors.find(col => col.id === c.colorId);
                    
                    // Check for size match
                    const sizeMatch = existingSize?.name.toLowerCase() === size.toLowerCase();
                    
                    // Check for color/pattern match (any of the three definition methods)
                    const colorMatch = existingColor && (
                      (hasName && existingColor.name && existingColor.name.toLowerCase() === patternName.trim().toLowerCase()) ||
                      (hasColor && existingColor.colorCode === patternColorCode) ||
                      (hasImage && existingColor.patternImage === patternImage)
                    );
                    
                    return sizeMatch && colorMatch;
                  });

                  if (existingCombination) {
                    toast.error('This size-pattern combination already exists');
                    return;
                  }

                  // Check for duplicate patterns
                  const existingColor = colors.find(c => 
                    (hasName && c.name && c.name.toLowerCase() === patternName.trim().toLowerCase()) ||
                    (hasColor && c.colorCode === patternColorCode) ||
                    (hasImage && c.patternImage === patternImage)
                  );

                  let colorId;
                  if (existingColor) {
                    colorId = existingColor.id;
                  } else {
                    // Create pattern definition
                    const definition: PatternDefinition = {
                      hasColorPicker: hasColor,
                      hasImage: hasImage,
                      hasName: hasName
                    };

                    const newColor: ColorVariant = {
                      id: generateId(),
                      name: hasName ? patternName.trim() : undefined,
                      colorCode: hasColor ? patternColorCode : undefined,
                      patternImage: hasImage ? patternImage : undefined,
                      images: [],
                      definition
                    };
                    setColors(prev => [...prev, newColor]);
                    colorId = newColor.id;
                  }

                  // Add size if not exists
                  let sizeId;
                  const existingSize = sizes.find(s => s.name.toLowerCase() === size.toLowerCase());
                  if (existingSize) {
                    sizeId = existingSize.id;
                  } else {
                    const newSize: SizeVariant = {
                      id: generateId(),
                      name: size,
                      displayName: size
                    };
                    setSizes(prev => [...prev, newSize]);
                    sizeId = newSize.id;
                  }

                  // Add combination
                  const newCombination: StockCombination = {
                    id: generateId(),
                    colorId,
                    sizeId,
                    quantity: newQuantity,
                    availableQuantity: newQuantity,
                    images: []
                  };

                  setCombinations(prev => [...prev, newCombination]);
                  
                  // Reset form
                  setNewSizeName('');
                  setCustomSizeInput('');
                  setPatternName('');
                  setPatternColorCode('#000000');
                  setPatternImage('');
                  setNewQuantity(0);
                  
                  toast.success(`Added combination: ${size} - ${displayName}`);
                }}
                disabled={
                  (!newSizeName || (newSizeName === 'custom' && !customSizeInput.trim())) || 
                  (!patternName.trim() && patternColorCode === '#000000' && !patternImage) || 
                  !newQuantity
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Combination
              </Button>
            </div>
          </div>
        </div>

        {/* Combinations Table */}
        {combinations.length > 0 && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Size-Color Combinations</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Size</th>
                    <th className="text-left p-3 font-medium">Color/Image</th>
                    <th className="text-left p-3 font-medium">Quantity</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combination, index) => {
                    const size = sizes.find(s => s.id === combination.sizeId);
                    const color = colors.find(c => c.id === combination.colorId);
                    
                    return (
                      <tr key={combination.id} className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Badge variant={size && !standardSizes.includes(size.name) ? "outline" : "secondary"}>
                              {size?.displayName}
                              {size && !standardSizes.includes(size.name) && <span className="ml-1 text-xs">✦</span>}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {color?.definition.hasColorPicker && color.colorCode && (
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color.colorCode }}
                              />
                            )}
                            {color?.definition.hasImage && color.patternImage && (
                              <img 
                                src={color.patternImage} 
                                alt="Pattern" 
                                className="w-6 h-6 rounded object-cover border border-gray-300"
                              />
                            )}
                            <span>{color?.name || 'Pattern'}</span>
                            <div className="flex gap-1">
                              {color?.definition.hasName && <Badge variant="outline" className="text-xs">Name</Badge>}
                              {color?.definition.hasColorPicker && <Badge variant="outline" className="text-xs">Color</Badge>}
                              {color?.definition.hasImage && <Badge variant="outline" className="text-xs">Image</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {editingCombination === combination.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={combination.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 0;
                                setCombinations(prev => prev.map(c => 
                                  c.id === combination.id 
                                    ? { ...c, quantity: newQuantity, availableQuantity: newQuantity }
                                    : c
                                ));
                              }}
                              onBlur={() => setEditingCombination(null)}
                              className="w-20"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                              onClick={() => setEditingCombination(combination.id)}
                            >
                              {combination.quantity}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCombination(combination.id)}
                              title="Edit quantity"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setCombinations(prev => prev.filter(c => c.id !== combination.id));
                                toast.success('Combination removed');
                              }}
                              title="Delete combination"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

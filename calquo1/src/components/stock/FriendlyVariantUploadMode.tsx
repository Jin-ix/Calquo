import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  X, 
  Upload, 
  Download, 
  Grid, 
  Palette, 
  Ruler, 
  Sparkles, 
  Image as ImageIcon,
  Link,
  HelpCircle,
  Lightbulb,
  ChevronRight,
  Eye,
  ShoppingBag,
  Shirt,
  Heart,
  Type
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Variant {
  colorOrPattern: string; // Now stores either hex code or image URL
  colorOrPatternType: 'color' | 'pattern'; // Indicates the type
  colorOrPatternName?: string; // Optional display name
  size: string;
  quantity: number;
  imageUrl?: string;
  colorImage?: string;
  sizeImage?: string;
  colors?: string[];
  sizes?: string[];
}

interface ColorPatternFirstVariant {
  colorOrPattern: string; // Either hex code or image URL
  colorOrPatternType: 'color' | 'pattern';
  colorOrPatternName?: string;
  colorImage?: string;
  sizes: string[];
  quantity: number;
}

interface SizeFirstVariant {
  size: string;
  sizeImage?: string;
  colorOrPatterns: Array<{
    colorOrPattern: string;
    colorOrPatternType: 'color' | 'pattern';
    colorOrPatternName?: string;
  }>;
  quantity: number;
}

interface FriendlyVariantUploadModeProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  onImageUpload: (file: File, callback: (url: string) => void) => void;
}

// Mode descriptions with updated terminology
const UPLOAD_MODES = {
  'by-color-pattern': {
    title: '🎨 Group by Color / Pattern',
    subtitle: 'Perfect for colorful collections',
    description: 'Choose colors or patterns first, then pick sizes for each',
    example: 'Red T-shirt in S, M, L | Floral Pattern T-shirt in M, L, XL',
    icon: Palette,
    bestFor: 'Fashion items with multiple color/pattern variations',
    difficulty: 'Easy'
  },
  'by-size': {
    title: '📏 Group by Sizes',
    subtitle: 'Great for size-focused inventory',
    description: 'Choose sizes first, then pick colors/patterns for each size',
    example: 'Size M in Red, Blue, Floral | Size L in Red, Striped',
    icon: Ruler,
    bestFor: 'Items where size availability varies by color/pattern',
    difficulty: 'Medium'
  },
  'individual': {
    title: '🎯 Individual Variants',
    subtitle: 'Complete control over each item',
    description: 'Create each color/pattern-size combination individually',
    example: 'Red-Small: 10 pcs | Floral-Medium: 15 pcs | Blue-Large: 8 pcs',
    icon: Grid,
    bestFor: 'Complex inventory with specific quantities',
    difficulty: 'Advanced'
  }
};

const predefinedColors = [
  'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Black', 'White', 'Gray',
  'Brown', 'Navy', 'Maroon', 'Beige', 'Turquoise', 'Lime', 'Coral', 'Indigo', 'Teal', 'Magenta'
];

const colorHexMap: Record<string, string> = {
  'Black': '#000000', 'White': '#FFFFFF', 'Red': '#FF0000', 'Blue': '#0000FF',
  'Green': '#008000', 'Yellow': '#FFFF00', 'Pink': '#FFC0CB', 'Purple': '#800080',
  'Orange': '#FFA500', 'Gray': '#808080', 'Brown': '#A52A2A', 'Navy': '#000080',
  'Maroon': '#800000', 'Beige': '#F5F5DC', 'Turquoise': '#40E0D0', 'Lime': '#00FF00',
  'Coral': '#FF7F50', 'Indigo': '#4B0082', 'Teal': '#008080', 'Magenta': '#FF00FF'
};

const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'];

// Enhanced Color/Pattern Input Component
function ColorPatternInput({ 
  value, 
  valueType, 
  displayName,
  onChange, 
  onTypeChange,
  onDisplayNameChange,
  onImageUpload,
  label = "Color / Pattern"
}: {
  value: string;
  valueType: 'color' | 'pattern';
  displayName?: string;
  onChange: (value: string) => void;
  onTypeChange: (type: 'color' | 'pattern') => void;
  onDisplayNameChange?: (name: string) => void;
  onImageUpload?: (file: File, callback: (url: string) => void) => void;
  label?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>(valueType === 'color' ? 'color' : 'pattern');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleColorSelect = (colorName: string) => {
    const hexValue = colorHexMap[colorName] || '#808080';
    onChange(hexValue);
    onTypeChange('color');
    if (onDisplayNameChange) {
      onDisplayNameChange(colorName);
    }
  };

  const handleCustomColorChange = (hexValue: string) => {
    onChange(hexValue);
    onTypeChange('color');
    if (onDisplayNameChange) {
      onDisplayNameChange(`Custom Color`);
    }
  };

  const handlePatternUpload = (file: File) => {
    if (!onImageUpload) return;
    
    setUploadingImage(true);
    onImageUpload(file, (imageUrl) => {
      onChange(imageUrl);
      onTypeChange('pattern');
      if (onDisplayNameChange) {
        onDisplayNameChange(displayName || `Pattern`);
      }
      setUploadingImage(false);
    });
  };

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    onTypeChange(tabValue as 'color' | 'pattern');
  };

  return (
    <div className="space-y-3">
      <Label>{label} *</Label>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="color" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Solid Color
          </TabsTrigger>
          <TabsTrigger value="pattern" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Pattern / Design
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="color" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Predefined Colors */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Colors</Label>
              <div className="grid grid-cols-4 gap-1">
                {predefinedColors.slice(0, 8).map(colorName => (
                  <button
                    key={colorName}
                    type="button"
                    className={`w-6 h-6 rounded border-2 ${
                      value === colorHexMap[colorName] ? 'border-primary' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorHexMap[colorName] }}
                    onClick={() => handleColorSelect(colorName)}
                    title={colorName}
                  />
                ))}
              </div>
            </div>
            
            {/* Custom Color Picker */}
            <div className="space-y-2">
              <Label className="text-sm">Custom Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={valueType === 'color' ? value : '#000000'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={valueType === 'color' ? value : ''}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#FF0000"
                  className="flex-1 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Display Name for Color */}
          {onDisplayNameChange && (
            <div className="space-y-1">
              <Label className="text-sm">Display Name (Optional)</Label>
              <Input
                value={displayName || ''}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder="e.g., Bright Red, Ocean Blue"
                className="text-sm"
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pattern" className="space-y-3">
          <div className="space-y-3">
            {/* Pattern Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {valueType === 'pattern' && value ? (
                <div className="space-y-2">
                  <ImageWithFallback
                    src={value}
                    alt="Pattern preview"
                    className="w-16 h-16 mx-auto object-cover rounded"
                  />
                  <p className="text-sm text-green-600">✓ Pattern uploaded</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handlePatternUpload(file);
                      };
                      input.click();
                    }}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Uploading...' : 'Change Pattern'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Upload a pattern or design image</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handlePatternUpload(file);
                      };
                      input.click();
                    }}
                    disabled={uploadingImage || !onImageUpload}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Pattern'}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Display Name for Pattern */}
            {onDisplayNameChange && (
              <div className="space-y-1">
                <Label className="text-sm">Pattern Name *</Label>
                <Input
                  value={displayName || ''}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  placeholder="e.g., Floral, Stripes, Polka Dots"
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Preview */}
      {value && (
        <div className="p-2 bg-gray-50 rounded border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Preview:</span>
            {valueType === 'color' ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: value }}
                />
                <span>{displayName || value}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ImageWithFallback
                  src={value}
                  alt="Pattern"
                  className="w-4 h-4 object-cover rounded"
                />
                <span>{displayName || 'Pattern'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FriendlyVariantUploadMode({ 
  variants, 
  onVariantsChange, 
  onImageUpload 
}: FriendlyVariantUploadModeProps) {
  const [currentStep, setCurrentStep] = useState<'select-mode' | 'configure' | 'preview'>('select-mode');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Color/Pattern-first mode state
  const [colorPatternFirstVariants, setColorPatternFirstVariants] = useState<ColorPatternFirstVariant[]>([]);
  
  // Size-first mode state
  const [sizeFirstVariants, setSizeFirstVariants] = useState<SizeFirstVariant[]>([]);
  
  // Individual mode state
  const [individualVariants, setIndividualVariants] = useState<Variant[]>([]);
  
  // Custom sizes
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState('');

  const addCustomSize = () => {
    if (newCustomSize.trim() && !predefinedSizes.includes(newCustomSize.trim()) && !customSizes.includes(newCustomSize.trim())) {
      setCustomSizes([...customSizes, newCustomSize.trim()]);
      setNewCustomSize('');
      toast.success(`Added custom size: ${newCustomSize.trim()}`);
    }
  };

  const removeCustomSize = (size: string) => {
    setCustomSizes(customSizes.filter(s => s !== size));
  };

  const allSizes = [...predefinedSizes, ...customSizes];

  // Mode selection handler
  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    setCurrentStep('configure');
    
    // Initialize based on mode
    if (mode === 'by-color-pattern' && colorPatternFirstVariants.length === 0) {
      setColorPatternFirstVariants([{ 
        colorOrPattern: '', 
        colorOrPatternType: 'color',
        colorOrPatternName: '',
        sizes: [], 
        quantity: 0 
      }]);
    } else if (mode === 'by-size' && sizeFirstVariants.length === 0) {
      setSizeFirstVariants([{ 
        size: '', 
        colorOrPatterns: [], 
        quantity: 0 
      }]);
    } else if (mode === 'individual' && individualVariants.length === 0) {
      setIndividualVariants([{ 
        colorOrPattern: '', 
        colorOrPatternType: 'color',
        colorOrPatternName: '',
        size: '', 
        quantity: 0 
      }]);
    }
  };

  // Convert variants for final output
  const generateFinalVariants = (): Variant[] => {
    let finalVariants: Variant[] = [];

    if (selectedMode === 'by-color-pattern') {
      colorPatternFirstVariants.forEach(colorPatternVariant => {
        colorPatternVariant.sizes.forEach(size => {
          finalVariants.push({
            colorOrPattern: colorPatternVariant.colorOrPattern,
            colorOrPatternType: colorPatternVariant.colorOrPatternType,
            colorOrPatternName: colorPatternVariant.colorOrPatternName,
            size: size,
            quantity: colorPatternVariant.quantity,
            imageUrl: colorPatternVariant.colorImage,
            colorImage: colorPatternVariant.colorImage
          });
        });
      });
    } else if (selectedMode === 'by-size') {
      sizeFirstVariants.forEach(sizeVariant => {
        sizeVariant.colorOrPatterns.forEach(colorPattern => {
          finalVariants.push({
            colorOrPattern: colorPattern.colorOrPattern,
            colorOrPatternType: colorPattern.colorOrPatternType,
            colorOrPatternName: colorPattern.colorOrPatternName,
            size: sizeVariant.size,
            quantity: sizeVariant.quantity,
            imageUrl: sizeVariant.sizeImage,
            sizeImage: sizeVariant.sizeImage
          });
        });
      });
    } else if (selectedMode === 'individual') {
      finalVariants = individualVariants;
    }

    return finalVariants;
  };

  const handleFinish = () => {
    const finalVariants = generateFinalVariants();
    if (finalVariants.length === 0) {
      toast.error('Please add at least one variant');
      return;
    }
    onVariantsChange(finalVariants);
    setShowPreview(true);
  };

  const getProgressPercentage = () => {
    if (currentStep === 'select-mode') return 0;
    if (currentStep === 'configure') return 50;
    if (currentStep === 'preview') return 100;
    return 0;
  };

  const getTotalVariants = () => {
    return generateFinalVariants().length;
  };

  const getTotalQuantity = () => {
    return generateFinalVariants().reduce((sum, v) => sum + v.quantity, 0);
  };

  // Color/Pattern-first mode functions
  const addColorPatternFirstVariant = () => {
    setColorPatternFirstVariants([...colorPatternFirstVariants, { 
      colorOrPattern: '', 
      colorOrPatternType: 'color',
      colorOrPatternName: '',
      sizes: [], 
      quantity: 0 
    }]);
  };

  const updateColorPatternFirstVariant = (index: number, field: keyof ColorPatternFirstVariant, value: any) => {
    const updated = [...colorPatternFirstVariants];
    updated[index] = { ...updated[index], [field]: value };
    setColorPatternFirstVariants(updated);
  };

  const removeColorPatternFirstVariant = (index: number) => {
    setColorPatternFirstVariants(colorPatternFirstVariants.filter((_, i) => i !== index));
  };

  const handleSizeSelection = (variantIndex: number, size: string, checked: boolean) => {
    const updated = [...colorPatternFirstVariants];
    if (checked) {
      updated[variantIndex].sizes = [...updated[variantIndex].sizes, size];
    } else {
      updated[variantIndex].sizes = updated[variantIndex].sizes.filter(s => s !== size);
    }
    setColorPatternFirstVariants(updated);
  };

  // Size-first mode functions
  const addSizeFirstVariant = () => {
    setSizeFirstVariants([...sizeFirstVariants, { 
      size: '', 
      colorOrPatterns: [], 
      quantity: 0 
    }]);
  };

  const updateSizeFirstVariant = (index: number, field: keyof SizeFirstVariant, value: any) => {
    const updated = [...sizeFirstVariants];
    updated[index] = { ...updated[index], [field]: value };
    setSizeFirstVariants(updated);
  };

  const removeSizeFirstVariant = (index: number) => {
    setSizeFirstVariants(sizeFirstVariants.filter((_, i) => i !== index));
  };

  // Individual mode functions
  const addIndividualVariant = () => {
    setIndividualVariants([...individualVariants, { 
      colorOrPattern: '', 
      colorOrPatternType: 'color',
      colorOrPatternName: '',
      size: '', 
      quantity: 0 
    }]);
  };

  const updateIndividualVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...individualVariants];
    updated[index] = { ...updated[index], [field]: value };
    setIndividualVariants(updated);
  };

  const removeIndividualVariant = (index: number) => {
    setIndividualVariants(individualVariants.filter((_, i) => i !== index));
  };

  if (currentStep === 'select-mode') {
    return (
      <TooltipProvider>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Choose Your Upload Style
            </CardTitle>
            <div className="flex items-center justify-center gap-4">
              <p className="text-muted-foreground">
                Pick the method that matches how you think about your inventory
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <HelpCircle className="h-4 w-4" />
                Need Help?
              </Button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(UPLOAD_MODES).map(([key, mode]) => {
                const IconComponent = mode.icon;
                return (
                  <Card 
                    key={key}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
                    onClick={() => handleModeSelect(key)}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <IconComponent className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{mode.title}</h3>
                          <p className="text-sm text-muted-foreground">{mode.subtitle}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm">{mode.description}</p>
                      
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg text-xs">
                          <strong>Example:</strong><br />
                          {mode.example}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Best for:</span>
                          <Badge variant="secondary" className="text-xs">{mode.difficulty}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{mode.bestFor}</p>
                      </div>
                      
                      <Button className="w-full">
                        Choose This Method
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">💡 Not sure which to choose?</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Start with "Group by Color / Pattern"</strong> - it's the most intuitive for most products. 
                      You can always try a different method later!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shirt className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">📋 Quick Examples:</h4>
                    <div className="text-sm text-green-800 mt-2 space-y-1">
                      <p><strong>Group by Color / Pattern:</strong> T-shirts in Red, Blue, Floral Pattern - each available in S, M, L</p>
                      <p><strong>Group by Sizes:</strong> Jeans in Size 30, 32, 34 - each available in Black, Blue, Striped</p>
                      <p><strong>Individual:</strong> Red-Small (10 pcs), Floral-Medium (15 pcs), Blue-Large (8 pcs)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  if (currentStep === 'configure') {
    const selectedModeConfig = UPLOAD_MODES[selectedMode];
    const IconComponent = selectedModeConfig.icon;

    return (
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header with progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedModeConfig.title}</h2>
                    <p className="text-sm text-muted-foreground">{selectedModeConfig.description}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('select-mode')}
                  size="sm"
                >
                  Change Method
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
              
              {getTotalVariants() > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Grid className="h-4 w-4" />
                      {getTotalVariants()} variants
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4" />
                      {getTotalQuantity()} total pieces
                    </span>
                  </div>
                  {getTotalVariants() > 20 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                      <strong>📊 Large inventory:</strong> You're creating {getTotalVariants()} variants. Consider using bulk upload for efficiency.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mode-specific configuration */}
          {selectedMode === 'by-color-pattern' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Configure Colors / Patterns & Sizes
                  </CardTitle>
                  <Button onClick={addColorPatternFirstVariant} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Color / Pattern
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {colorPatternFirstVariants.map((variant, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/30">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Color / Pattern #{index + 1}</h4>
                        {colorPatternFirstVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeColorPatternFirstVariant(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Color/Pattern Selection */}
                        <div>
                          <ColorPatternInput
                            value={variant.colorOrPattern}
                            valueType={variant.colorOrPatternType}
                            displayName={variant.colorOrPatternName}
                            onChange={(value) => updateColorPatternFirstVariant(index, 'colorOrPattern', value)}
                            onTypeChange={(type) => updateColorPatternFirstVariant(index, 'colorOrPatternType', type)}
                            onDisplayNameChange={(name) => updateColorPatternFirstVariant(index, 'colorOrPatternName', name)}
                            onImageUpload={onImageUpload}
                            label="Choose Color / Pattern"
                          />
                        </div>
                        
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label>Quantity per size *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.quantity}
                            onChange={(e) => updateColorPatternFirstVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="How many of each size?"
                          />
                        </div>
                      </div>
                      
                      {/* Size Selection */}
                      <div className="space-y-3">
                        <Label>Available Sizes *</Label>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {allSizes.map(size => (
                            <div key={size} className="flex items-center space-x-2">
                              <Checkbox
                                checked={variant.sizes.includes(size)}
                                onCheckedChange={(checked) => 
                                  handleSizeSelection(index, size, checked as boolean)
                                }
                              />
                              <Label className="text-sm cursor-pointer">{size}</Label>
                            </div>
                          ))}
                        </div>
                        
                        {/* Custom Size Addition */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                          <Label className="text-sm font-medium text-gray-700">Add Custom Size</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={newCustomSize}
                              onChange={(e) => setNewCustomSize(e.target.value)}
                              placeholder="Add custom size (e.g., 44, XXXXL)"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                              className="flex-1 text-sm"
                              size="sm"
                            />
                            <Button type="button" onClick={addCustomSize} variant="outline" size="sm">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          {customSizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {customSizes.map(size => (
                                <Badge key={size} variant="secondary" className="flex items-center gap-1">
                                  {size}
                                  <X 
                                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                                    onClick={() => removeCustomSize(size)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {variant.sizes.length > 0 && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-sm text-green-800">
                              ✓ Will create {variant.sizes.length} variants: {variant.sizes.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedMode === 'by-size' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Configure Sizes & Colors / Patterns
                  </CardTitle>
                  <Button onClick={addSizeFirstVariant} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Size
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Size-first mode is temporarily simplified. Please use "Group by Color / Pattern" or "Individual Variants" for now.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMode === 'individual' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Grid className="h-5 w-5" />
                    Individual Variants
                  </CardTitle>
                  <Button onClick={addIndividualVariant} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variant
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create each color/pattern-size combination with specific quantities
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {individualVariants.map((variant, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Variant #{index + 1}</h4>
                        {individualVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIndividualVariant(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Color/Pattern */}
                        <div className="md:col-span-2">
                          <ColorPatternInput
                            value={variant.colorOrPattern}
                            valueType={variant.colorOrPatternType}
                            displayName={variant.colorOrPatternName}
                            onChange={(value) => updateIndividualVariant(index, 'colorOrPattern', value)}
                            onTypeChange={(type) => updateIndividualVariant(index, 'colorOrPatternType', type)}
                            onDisplayNameChange={(name) => updateIndividualVariant(index, 'colorOrPatternName', name)}
                            onImageUpload={onImageUpload}
                            label="Color / Pattern"
                          />
                        </div>
                        
                        {/* Size and Quantity */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Size *</Label>
                            <Select 
                              value={variant.size} 
                              onValueChange={(value) => updateIndividualVariant(index, 'size', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {allSizes.map(size => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={variant.quantity}
                              onChange={(e) => updateIndividualVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Pieces"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {variant.colorOrPattern && variant.size && variant.quantity > 0 && (
                        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center gap-2">
                            {variant.colorOrPatternType === 'color' ? (
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: variant.colorOrPattern }}
                              />
                            ) : (
                              <ImageWithFallback
                                src={variant.colorOrPattern}
                                alt="Pattern"
                                className="w-4 h-4 object-cover rounded"
                              />
                            )}
                            <p className="text-sm text-green-800">
                              ✓ {variant.colorOrPatternName || (variant.colorOrPatternType === 'color' ? 'Color' : 'Pattern')} - {variant.size}: {variant.quantity} pieces
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {individualVariants.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No variants created yet</p>
                    <Button onClick={addIndividualVariant}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Your First Variant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('select-mode')}
            >
              ← Back to Methods
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
                disabled={getTotalVariants() === 0}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview ({getTotalVariants()})
              </Button>
              <Button 
                onClick={handleFinish}
                disabled={getTotalVariants() === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Complete Setup
                <Heart className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Your Variants</DialogTitle>
              <DialogDescription>
                Review all {getTotalVariants()} variants before finalizing
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{getTotalVariants()}</div>
                  <div className="text-sm text-blue-800">Total Variants</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getTotalQuantity()}</div>
                  <div className="text-sm text-green-800">Total Pieces</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Array.from(new Set(generateFinalVariants().map(v => v.colorOrPattern))).length}
                  </div>
                  <div className="text-sm text-purple-800">Unique Colors / Patterns</div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color / Pattern</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generateFinalVariants().map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {variant.colorOrPatternType === 'color' ? (
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: variant.colorOrPattern }}
                            />
                          ) : (
                            <ImageWithFallback
                              src={variant.colorOrPattern}
                              alt="Pattern"
                              className="w-4 h-4 object-cover rounded"
                            />
                          )}
                          <span>{variant.colorOrPatternName || (variant.colorOrPatternType === 'color' ? 'Color' : 'Pattern')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{variant.size}</TableCell>
                      <TableCell>{variant.quantity}</TableCell>
                      <TableCell>
                        {variant.imageUrl && (
                          <ImageWithFallback 
                            src={variant.imageUrl} 
                            alt={`${variant.colorOrPatternName} ${variant.size}`}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Edit
              </Button>
              <Button onClick={handleFinish}>
                Looks Good! ✓
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tutorial Dialog */}
        <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Variant Upload Tutorial
              </DialogTitle>
              <DialogDescription>
                Learn how to efficiently set up your product variants with colors and patterns
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(UPLOAD_MODES).map(([key, mode]) => {
                  const IconComponent = mode.icon;
                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm">{mode.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{mode.description}</p>
                      <div className="text-xs bg-gray-50 p-2 rounded">
                        <strong>Example:</strong><br />
                        {mode.example}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">📝 Step-by-Step Process:</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <strong>Choose Your Method:</strong> Select the approach that matches your inventory style
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <strong>Configure Details:</strong> Add colors/patterns, sizes, quantities, and images as needed
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <strong>Preview & Confirm:</strong> Review all variants before finalizing
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💡 Pro Tips:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Start with one color/pattern or size to get familiar with the process</li>
                  <li>• Use solid colors for simple variations, patterns for unique designs</li>
                  <li>• Upload pattern reference images to help customers make better choices</li>
                  <li>• Custom sizes can be added for any special requirements</li>
                  <li>• You can always preview your variants before confirming</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowTutorial(false)}>
                Got it! Let's Start
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    );
  }

  return null;
}

import React, { useState, useRef } from 'react';
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

type VariantMode = 'color-pattern-first' | 'size-first' | 'mixed';
type QuantityMode = 'each-variant' | 'total-across';

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

const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42'];

interface InteractiveVariantUploadModeProps {
  onVariantsChange: (variants: Variant[]) => void;
  onMainImageSelect?: (imageUrl: string) => void;
  existingImages?: string[];
  onImageUpload?: (file: File, callback: (url: string) => void) => void;
}

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
      <Label className="text-sm font-medium">{label} *</Label>
      
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
              <Label className="text-xs">Quick Colors</Label>
              <div className="grid grid-cols-4 gap-1">
                {predefinedColors.slice(0, 8).map(colorName => (
                  <button
                    key={colorName}
                    type="button"
                    className={`w-5 h-5 rounded border-2 ${
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
              <Label className="text-xs">Custom Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={valueType === 'color' ? value : '#000000'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={valueType === 'color' ? value : ''}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#FF0000"
                  className="flex-1 text-xs h-6"
                />
              </div>
            </div>
          </div>
          
          {/* Display Name for Color */}
          {onDisplayNameChange && (
            <div className="space-y-1">
              <Label className="text-xs">Display Name (Optional)</Label>
              <Input
                value={displayName || ''}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder="e.g., Bright Red, Ocean Blue"
                className="text-xs h-7"
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pattern" className="space-y-3">
          <div className="space-y-3">
            {/* Pattern Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
              {valueType === 'pattern' && value ? (
                <div className="space-y-2">
                  <ImageWithFallback
                    src={value}
                    alt="Pattern preview"
                    className="w-12 h-12 mx-auto object-cover rounded"
                  />
                  <p className="text-xs text-green-600">✓ Pattern uploaded</p>
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
                    className="h-6 px-2 text-xs"
                  >
                    {uploadingImage ? 'Uploading...' : 'Change'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-6 w-6 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-600">Upload pattern image</p>
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
                    className="h-6 px-2 text-xs"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Display Name for Pattern */}
            {onDisplayNameChange && (
              <div className="space-y-1">
                <Label className="text-xs">Pattern Name *</Label>
                <Input
                  value={displayName || ''}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  placeholder="e.g., Floral, Stripes, Polka Dots"
                  className="text-xs h-7"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Compact Preview */}
      {value && (
        <div className="p-2 bg-gray-50 rounded border">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Preview:</span>
            {valueType === 'color' ? (
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded border"
                  style={{ backgroundColor: value }}
                />
                <span>{displayName || value}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <ImageWithFallback
                  src={value}
                  alt="Pattern"
                  className="w-3 h-3 object-cover rounded"
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

export function InteractiveVariantUploadMode({ 
  onVariantsChange, 
  onMainImageSelect,
  existingImages = [],
  onImageUpload
}: InteractiveVariantUploadModeProps) {
  // Core state
  const [variantMode, setVariantMode] = useState<VariantMode>('color-pattern-first');
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('each-variant');
  
  // Variant data state
  const [colorPatternFirstVariants, setColorPatternFirstVariants] = useState<ColorPatternFirstVariant[]>([
    { colorOrPattern: '', colorOrPatternType: 'color', colorOrPatternName: '', sizes: [], quantity: 0 }
  ]);
  const [sizeFirstVariants, setSizeFirstVariants] = useState<SizeFirstVariant[]>([
    { size: '', colorOrPatterns: [], quantity: 0 }
  ]);
  const [mixedVariants, setMixedVariants] = useState<Variant[]>([
    { colorOrPattern: '', colorOrPatternType: 'color', colorOrPatternName: '', size: '', quantity: 0 }
  ]);
  
  // Custom sizes
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState('');
  
  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState({
    colorOrPattern: '',
    colorOrPatternType: '',
    colorOrPatternName: '',
    size: '',
    quantity: '',
    imageUrl: ''
  });
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  
  // Main image selection
  const [showMainImageSelector, setShowMainImageSelector] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const allSizes = [...predefinedSizes, ...customSizes];
  
  // Get normalized variants for preview
  const getNormalizedVariants = (): Variant[] => {
    switch (variantMode) {
      case 'color-pattern-first':
        return colorPatternFirstVariants
          .filter(cv => cv.colorOrPattern && cv.sizes.length > 0 && cv.quantity > 0)
          .flatMap(cv => 
            cv.sizes.map(size => ({
              colorOrPattern: cv.colorOrPattern,
              colorOrPatternType: cv.colorOrPatternType,
              colorOrPatternName: cv.colorOrPatternName,
              size: size,
              quantity: quantityMode === 'each-variant' ? cv.quantity : Math.floor(cv.quantity / cv.sizes.length),
              imageUrl: cv.colorImage
            }))
          );
      
      case 'size-first':
        return sizeFirstVariants
          .filter(sv => sv.size && sv.colorOrPatterns.length > 0 && sv.quantity > 0)
          .flatMap(sv => 
            sv.colorOrPatterns.map(colorPattern => ({
              colorOrPattern: colorPattern.colorOrPattern,
              colorOrPatternType: colorPattern.colorOrPatternType,
              colorOrPatternName: colorPattern.colorOrPatternName,
              size: sv.size,
              quantity: quantityMode === 'each-variant' ? sv.quantity : Math.floor(sv.quantity / sv.colorOrPatterns.length),
              imageUrl: sv.sizeImage
            }))
          );
      
      case 'mixed':
        return mixedVariants.filter(v => v.colorOrPattern && v.size && v.quantity > 0);
      
      default:
        return [];
    }
  };
  
  // Update parent component whenever variants change
  React.useEffect(() => {
    const variants = getNormalizedVariants();
    onVariantsChange(variants);
  }, [colorPatternFirstVariants, sizeFirstVariants, mixedVariants, variantMode, quantityMode]);
  
  // Color/Pattern-first variant management
  const addColorPatternFirstVariant = () => {
    setColorPatternFirstVariants(prev => [...prev, { 
      colorOrPattern: '', 
      colorOrPatternType: 'color',
      colorOrPatternName: '',
      sizes: [], 
      quantity: 0 
    }]);
  };
  
  const removeColorPatternFirstVariant = (index: number) => {
    setColorPatternFirstVariants(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateColorPatternFirstVariant = (index: number, field: keyof ColorPatternFirstVariant, value: any) => {
    setColorPatternFirstVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };
  
  // Size-first variant management
  const addSizeFirstVariant = () => {
    setSizeFirstVariants(prev => [...prev, { size: '', colorOrPatterns: [], quantity: 0 }]);
  };
  
  const removeSizeFirstVariant = (index: number) => {
    setSizeFirstVariants(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateSizeFirstVariant = (index: number, field: keyof SizeFirstVariant, value: any) => {
    setSizeFirstVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };
  
  // Mixed variant management
  const addMixedVariant = () => {
    setMixedVariants(prev => [...prev, { 
      colorOrPattern: '', 
      colorOrPatternType: 'color',
      colorOrPatternName: '',
      size: '', 
      quantity: 0 
    }]);
  };
  
  const removeMixedVariant = (index: number) => {
    setMixedVariants(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateMixedVariant = (index: number, field: keyof Variant, value: any) => {
    setMixedVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };
  
  // Smart expand functionality
  const smartExpand = () => {
    const expandedVariants: Variant[] = [];
    
    // Expand color/pattern-first variants
    colorPatternFirstVariants.forEach(cv => {
      if (cv.colorOrPattern && cv.sizes.length > 0) {
        cv.sizes.forEach(size => {
          expandedVariants.push({
            colorOrPattern: cv.colorOrPattern,
            colorOrPatternType: cv.colorOrPatternType,
            colorOrPatternName: cv.colorOrPatternName,
            size: size,
            quantity: cv.quantity,
            imageUrl: cv.colorImage
          });
        });
      }
    });
    
    // Expand size-first variants
    sizeFirstVariants.forEach(sv => {
      if (sv.size && sv.colorOrPatterns.length > 0) {
        sv.colorOrPatterns.forEach(colorPattern => {
          expandedVariants.push({
            colorOrPattern: colorPattern.colorOrPattern,
            colorOrPatternType: colorPattern.colorOrPatternType,
            colorOrPatternName: colorPattern.colorOrPatternName,
            size: sv.size,
            quantity: sv.quantity,
            imageUrl: sv.sizeImage
          });
        });
      }
    });
    
    if (expandedVariants.length > 0) {
      setMixedVariants([...mixedVariants, ...expandedVariants]);
      toast.success(`Expanded ${expandedVariants.length} variants to mixed mode`);
    } else {
      toast.error('No variants available to expand');
    }
  };
  
  // Custom size management
  const addCustomSize = () => {
    if (newCustomSize.trim() && !allSizes.includes(newCustomSize.trim())) {
      setCustomSizes(prev => [...prev, newCustomSize.trim()]);
      setNewCustomSize('');
      toast.success(`Added custom size: ${newCustomSize.trim()}`);
    }
  };
  
  const removeCustomSize = (size: string) => {
    setCustomSizes(prev => prev.filter(s => s !== size));
  };
  
  // CSV handling
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        setCsvColumns(headers);
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          }, {} as any);
        });
        setCsvData(data);
        setCsvPreview(data.slice(0, 5));
      }
    };
    reader.readAsText(file);
  };
  
  const processCsvImport = () => {
    if (!csvMapping.colorOrPattern || !csvMapping.size || !csvMapping.quantity) {
      toast.error('Please map all required fields (Color/Pattern, Size, Quantity)');
      return;
    }
    
    const importedVariants: Variant[] = csvData.map(row => ({
      colorOrPattern: row[csvMapping.colorOrPattern] || '',
      colorOrPatternType: (row[csvMapping.colorOrPatternType] as 'color' | 'pattern') || 'color',
      colorOrPatternName: csvMapping.colorOrPatternName ? row[csvMapping.colorOrPatternName] : undefined,
      size: row[csvMapping.size] || '',
      quantity: parseInt(row[csvMapping.quantity]) || 0,
      imageUrl: csvMapping.imageUrl ? row[csvMapping.imageUrl] : undefined
    })).filter(v => v.colorOrPattern && v.size && v.quantity > 0);
    
    if (importedVariants.length === 0) {
      toast.error('No valid variants found in CSV');
      return;
    }
    
    setMixedVariants(importedVariants);
    setVariantMode('mixed');
    setShowCsvImport(false);
    toast.success(`Imported ${importedVariants.length} variants successfully`);
  };
  
  const downloadSampleCsv = () => {
    const sampleData = [
      'ColorOrPattern,ColorOrPatternType,ColorOrPatternName,Size,Quantity,Image URL',
      '#FF0000,color,Red,S,10,https://example.com/red-s.jpg',
      '#FF0000,color,Red,M,15,',
      'https://example.com/floral.jpg,pattern,Floral,S,12,https://example.com/floral-s.jpg',
      '#0000FF,color,Blue,M,18,',
      'https://example.com/stripes.jpg,pattern,Stripes,L,20,'
    ];
    const blob = new Blob([sampleData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-color-pattern-variants.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Handle size selection
  const handleSizeSelection = (variantIndex: number, size: string, isSelected: boolean) => {
    const variant = colorPatternFirstVariants[variantIndex];
    if (!variant) return;
    
    let newSizes = [...variant.sizes];
    if (isSelected) {
      if (!newSizes.includes(size)) {
        newSizes.push(size);
      }
    } else {
      newSizes = newSizes.filter(s => s !== size);
    }
    
    updateColorPatternFirstVariant(variantIndex, 'sizes', newSizes);
  };
  
  // Handle color/pattern selection for size-first mode
  const handleColorPatternSelection = (variantIndex: number, colorPattern: {
    colorOrPattern: string;
    colorOrPatternType: 'color' | 'pattern';
    colorOrPatternName?: string;
  }, isSelected: boolean) => {
    const variant = sizeFirstVariants[variantIndex];
    if (!variant) return;
    
    let newColorPatterns = [...variant.colorOrPatterns];
    if (isSelected) {
      const exists = newColorPatterns.some(cp => 
        cp.colorOrPattern === colorPattern.colorOrPattern && 
        cp.colorOrPatternType === colorPattern.colorOrPatternType
      );
      if (!exists) {
        newColorPatterns.push(colorPattern);
      }
    } else {
      newColorPatterns = newColorPatterns.filter(cp => 
        !(cp.colorOrPattern === colorPattern.colorOrPattern && 
          cp.colorOrPatternType === colorPattern.colorOrPatternType)
      );
    }
    
    updateSizeFirstVariant(variantIndex, 'colorOrPatterns', newColorPatterns);
  };
  
  // Handle image uploads
  const handleImageUploadInternal = (file: File, callback: (url: string) => void) => {
    if (onImageUpload) {
      onImageUpload(file, callback);
    } else if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        callback(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const allVariantImages = getNormalizedVariants()
    .map(v => v.imageUrl)
    .filter(Boolean) as string[];
  
  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Grid className="h-6 w-6 text-green-600" />
          Color / Pattern Variant Upload Mode
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Segmented Control for Mode Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Mode Selection</Label>
          <div className="bg-white rounded-xl p-1.5 border shadow-sm inline-flex">
            {[
              { value: 'color-pattern-first', label: 'Color/Pattern-first', icon: Palette },
              { value: 'size-first', label: 'Size-first', icon: Ruler },
              { value: 'mixed', label: 'Mixed', icon: Grid }
            ].map(mode => (
              <Button
                key={mode.value}
                type="button"
                variant={variantMode === mode.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setVariantMode(mode.value as VariantMode)}
                className={`px-6 py-2.5 rounded-lg transition-all ${
                  variantMode === mode.value 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <mode.icon className="h-4 w-4 mr-2" />
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quantity Distribution Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quantity Distribution</Label>
          <div className="bg-white rounded-lg p-1 border shadow-sm inline-flex">
            <Button
              type="button"
              variant={quantityMode === 'each-variant' ? "default" : "ghost"}
              size="sm"
              onClick={() => setQuantityMode('each-variant')}
              className={`px-4 py-2 rounded-md text-sm ${
                quantityMode === 'each-variant' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Each Variant
            </Button>
            <Button
              type="button"
              variant={quantityMode === 'total-across' ? "default" : "ghost"}
              size="sm"
              onClick={() => setQuantityMode('total-across')}
              className={`px-4 py-2 rounded-md text-sm ${
                quantityMode === 'total-across' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Total Across
            </Button>
          </div>
        </div>

        {/* Color/Pattern-First Mode */}
        {variantMode === 'color-pattern-first' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Palette className="h-5 w-5 text-green-600" />
                  Color / Pattern First Configuration
                </h3>
                <Button
                  type="button"
                  onClick={addColorPatternFirstVariant}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Color / Pattern
                </Button>
              </div>

              <div className="space-y-4">
                {colorPatternFirstVariants.map((variant, index) => (
                  <Card key={index} className="border-l-4 border-l-green-400">
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
                            onImageUpload={handleImageUploadInternal}
                            label="Color / Pattern"
                          />
                        </div>
                        
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Quantity {quantityMode === 'each-variant' ? 'per size' : 'total'} *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.quantity}
                            onChange={(e) => updateColorPatternFirstVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder={quantityMode === 'each-variant' ? "Per size" : "Total across sizes"}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {/* Size Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Available Sizes *</Label>
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
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                          <Label className="text-sm font-medium text-gray-700">Add Custom Size</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={newCustomSize}
                              onChange={(e) => setNewCustomSize(e.target.value)}
                              placeholder="e.g., 44, XXXXL"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                              className="flex-1 text-sm h-7"
                            />
                            <Button type="button" onClick={addCustomSize} variant="outline" size="sm" className="h-7 px-2">
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
              </div>
            </div>
          </div>
        )}

        {/* Size-First Mode */}
        {variantMode === 'size-first' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-green-600" />
                  Size First Configuration
                </h3>
                <Button
                  type="button"
                  onClick={addSizeFirstVariant}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Size
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Size-first mode with Color/Pattern support is coming soon. Please use "Color/Pattern-first" or "Mixed" mode for now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mixed Mode */}
        {variantMode === 'mixed' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Grid className="h-5 w-5 text-green-600" />
                    Mixed Mode - Individual Variants
                  </h3>
                  <Button
                    type="button"
                    onClick={smartExpand}
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Smart Expand
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowCsvImport(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    CSV Import
                  </Button>
                  <Button
                    type="button"
                    onClick={addMixedVariant}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variant
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {mixedVariants.map((variant, index) => (
                  <Card key={index} className="border-l-4 border-l-green-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Variant #{index + 1}</h4>
                        {mixedVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMixedVariant(index)}
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
                            onChange={(value) => updateMixedVariant(index, 'colorOrPattern', value)}
                            onTypeChange={(type) => updateMixedVariant(index, 'colorOrPatternType', type)}
                            onDisplayNameChange={(name) => updateMixedVariant(index, 'colorOrPatternName', name)}
                            onImageUpload={handleImageUploadInternal}
                            label="Color / Pattern"
                          />
                        </div>
                        
                        {/* Size and Quantity */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Size *</Label>
                            <Select 
                              value={variant.size} 
                              onValueChange={(value) => updateMixedVariant(index, 'size', value)}
                            >
                              <SelectTrigger className="h-8">
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
                            <Label className="text-sm font-medium">Quantity *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={variant.quantity}
                              onChange={(e) => updateMixedVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Pieces"
                              className="h-8"
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
                
                {mixedVariants.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No variants created yet</p>
                    <Button onClick={addMixedVariant} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Your First Variant
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Variant Preview */}
        {getNormalizedVariants().length > 0 && (
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Live Preview ({getNormalizedVariants().length} variants)
            </h3>
            
            <div className="overflow-x-auto">
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
                  {getNormalizedVariants().slice(0, 10).map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell>
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
                          <span className="text-sm">{variant.colorOrPatternName || (variant.colorOrPatternType === 'color' ? 'Color' : 'Pattern')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{variant.size}</TableCell>
                      <TableCell className="text-sm">{variant.quantity}</TableCell>
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
              {getNormalizedVariants().length > 10 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  ... and {getNormalizedVariants().length - 10} more variants
                </p>
              )}
            </div>
          </div>
        )}

        {/* CSV Import Dialog */}
        <Dialog open={showCsvImport} onOpenChange={setShowCsvImport}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Color/Pattern Variants from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file with your color/pattern variant data
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={downloadSampleCsv}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </Button>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" />
                    Upload CSV File
                  </Button>
                </div>
              </div>
              
              {csvFile && (
                <div className="space-y-4">
                  <p className="text-sm text-green-600">✓ File uploaded: {csvFile.name}</p>
                  
                  {/* Column Mapping */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Color/Pattern Column *</Label>
                      <Select 
                        value={csvMapping.colorOrPattern} 
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, colorOrPattern: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Type Column</Label>
                      <Select 
                        value={csvMapping.colorOrPatternType} 
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, colorOrPatternType: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Name Column</Label>
                      <Select 
                        value={csvMapping.colorOrPatternName} 
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, colorOrPatternName: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Size Column *</Label>
                      <Select 
                        value={csvMapping.size} 
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, size: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Quantity Column *</Label>
                      <Select 
                        value={csvMapping.quantity} 
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, quantity: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Image URL Column</Label>
                      <Select 
                        value={csvMapping.imageUrl} 
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, imageUrl: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {csvPreview.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b">
                        <h4 className="text-sm font-medium">Preview (first 5 rows)</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {csvColumns.map(col => (
                                <TableHead key={col} className="text-xs">{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvPreview.map((row, index) => (
                              <TableRow key={index}>
                                {csvColumns.map(col => (
                                  <TableCell key={col} className="text-xs">{row[col]}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCsvImport(false)}>
                Cancel
              </Button>
              <Button 
                onClick={processCsvImport}
                disabled={!csvMapping.colorOrPattern || !csvMapping.size || !csvMapping.quantity}
                className="bg-green-600 hover:bg-green-700"
              >
                Import Variants
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

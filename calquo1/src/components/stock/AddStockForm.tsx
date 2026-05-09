import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ColorInput } from '../ui/color-input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useAuth } from '../auth/AuthProvider';
import { useCategories } from '../context/CategoryProvider';
import { StockItem } from './StockCard';
import { X, Plus, Upload, Download, Clock, Tag, Calendar, ShoppingCart, Shirt, PlusCircle, Package, Palette, Ruler, Grid, File } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';
import { AutoGenerateCombos } from './AutoGenerateCombos';

interface AddStockFormProps {
  onSubmit: (stock: Omit<StockItem, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
}

interface Variant {
  color: string;
  size: string;
  quantity: number;
  imageUrl?: string;
}

interface ColorFirstVariant {
  color: string;
  sizes: string[];
  quantity: number;
  imageUrl?: string;
}

interface SizeFirstVariant {
  size: string;
  colors: string[];
  quantity: number;
  imageUrl?: string;
}

type VariantMode = 'color-first' | 'size-first' | 'mixed';
type QuantityMode = 'each-variant' | 'total-across';

const colors = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 
  'Purple', 'Orange', 'Gray', 'Brown', 'Navy', 'Maroon', 'Beige'
];

const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42'];

const fabricTypes = [
  'Cotton', 'Polyester', 'Cotton Blend', 'Linen', 'Silk', 'Wool', 
  'Rayon', 'Viscose', 'Lycra', 'Spandex', 'Denim', 'Canvas',
  'Chiffon', 'Georgette', 'Crepe', 'Khadi', 'Jute', 'Bamboo',
  'Modal', 'Tencel', 'Nylon', 'Acrylic', 'Cashmere', 'Flannel'
];

export function AddStockForm({ onSubmit, onCancel }: AddStockFormProps) {
  const { user } = useAuth();
  const { categories, addCategory } = useCategories();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    singleShopPrice: '',
    multiShopPrice: '',
    location: user?.profile?.address ? 
      `${user.profile.address.city}, ${user.profile.address.state}` : '',
    minOrderQuantity: '',
    description: '',
    fabricType: '',
    fabricDescription: '',
    deliveryTime: ''
  });

  // New category dialog state
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Special offer state
  const [hasOffer, setHasOffer] = useState(false);
  const [offerData, setOfferData] = useState({
    offerPrice: '',
    offerType: 'time' as 'time' | 'quantity',
    offerTimeWeeks: '',
    offerMinQuantity: ''
  });

  // Trader-only state
  const [tradersOnly, setTradersOnly] = useState(false);

  // Unit of Measure states for Auto Generate Combos
  const [unitOfMeasure, setUnitOfMeasure] = useState('PCS');
  const [unitMode, setUnitMode] = useState<'individual' | 'bulk'>('individual');

  // Variant state (from Auto Generate Combos)
  const [mixedVariants, setMixedVariants] = useState<Variant[]>([]);

  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvMapping, setCsvMapping] = useState({
    color: '',
    size: '',
    quantity: '',
    imageUrl: ''
  });

  // Custom size management
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Basic form validation
      if (!formData.name?.trim()) {
        toast.error('Please enter a product name.');
        return;
      }

      if (!formData.category) {
        toast.error('Please select a category.');
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Please enter a valid price.');
        return;
      }

      if (!formData.minOrderQuantity || parseInt(formData.minOrderQuantity) <= 0) {
        toast.error('Please enter a valid minimum order quantity.');
        return;
      }

      // Validate variants
      const normalizedVariants = getNormalizedVariants();
      if (normalizedVariants.length === 0) {
        toast.error('Please add at least one variant with both color and size specified.');
        return;
      }

      // Additional validation for variant data completeness
      const incompleteVariants = normalizedVariants.filter(v => !v.color || !v.size || v.quantity <= 0);
      if (incompleteVariants.length > 0) {
        toast.error('All variants must have color, size, and quantity greater than 0.');
        return;
      }

    // Validate offer data if offer is enabled
    if (hasOffer) {
      if (!offerData.offerPrice) {
        toast.error('Please enter offer price.');
        return;
      }
      if (offerData.offerType === 'time' && !offerData.offerTimeWeeks) {
        toast.error('Please enter offer duration in weeks.');
        return;
      }
      if (offerData.offerType === 'quantity' && !offerData.offerMinQuantity) {
        toast.error('Please enter minimum quantity for the offer.');
        return;
      }
    }

    // Calculate offer expiry date for time-based offers
    const calculateOfferExpiry = () => {
      if (hasOffer && offerData.offerType === 'time' && offerData.offerTimeWeeks) {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + (parseInt(offerData.offerTimeWeeks) * 7 * 24 * 60 * 60 * 1000));
        return expiryDate.toISOString();
      }
      return undefined;
    };

    // For now, submit the first variant as the main stock item
    // In a real implementation, you'd handle multiple variants differently
    const mainVariant = normalizedVariants.length > 0 ? normalizedVariants[0] : { color: '', size: '', quantity: 0 };
    const totalQuantity = normalizedVariants.length > 0 ? (
      quantityMode === 'total-across' 
        ? normalizedVariants.reduce((sum, v) => sum + v.quantity, 0) / normalizedVariants.length
        : normalizedVariants.reduce((sum, v) => sum + v.quantity, 0)
    ) : 0;

    const stockItem: Omit<StockItem, 'id' | 'dateAdded'> = {
      name: formData.name,
      category: formData.category,
      size: mainVariant.size || 'One Size',
      color: mainVariant.color || 'Default',
      quantity: Math.floor(totalQuantity),
      price: parseFloat(formData.price),
      singleShopPrice: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : undefined,
      multiShopPrice: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : undefined,
      supplier: user?.company || 'Unknown',
      supplierType: user?.role === 'manufacturer' ? 'manufacturer' : 'trader',
      location: formData.location,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      description: formData.description,
      fabricType: formData.fabricType,
      fabricDescription: formData.fabricDescription,
      deliveryTime: formData.deliveryTime ? formData.deliveryTime as '5-10 days' | '10-20 days' | 'more than 1 month' : undefined,
      images: normalizedVariants.filter(v => v.imageUrl).map(v => v.imageUrl!),
      variants: normalizedVariants,
      variantMode,
      quantityMode,
      tradersOnly: tradersOnly,
      ...(hasOffer && {
        offerPrice: parseFloat(offerData.offerPrice),
        offerType: offerData.offerType,
        offerTimeWeeks: offerData.offerType === 'time' ? parseInt(offerData.offerTimeWeeks) : undefined,
        offerMinQuantity: offerData.offerType === 'quantity' ? parseInt(offerData.offerMinQuantity) : undefined,
        offerValidUntil: calculateOfferExpiry(),
        offerCreatedDate: new Date().toISOString()
      })
    };

      onSubmit(stockItem);
    } catch (error) {
      console.error('Error submitting stock form:', error);
      toast.error('An error occurred while submitting the form. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewCategory = () => {
    if (addCategory(newCategoryName)) {
      setFormData(prev => ({ ...prev, category: newCategoryName }));
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    }
  };

  // Handler for Auto Generate Combos
  const handleCombosGenerated = (combos: any[]) => {
    // Convert ComboRow format to Variant format
    const convertedVariants: Variant[] = combos.map(combo => ({
      color: typeof combo.color === 'string' ? combo.color : combo.color?.value || '',
      size: combo.size || '',
      quantity: combo.quantity || 0,
      imageUrl: undefined
    }));
    
    setMixedVariants(convertedVariants);
    toast.success(`Applied ${combos.length} variant combinations!`);
  };

  // Get normalized variants for preview (now just returns mixedVariants)
  const getNormalizedVariants = (): Variant[] => {
    return mixedVariants.filter(v => v && v.color && v.size && v.quantity > 0);
  };

  // CSV handling functions
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim()) : [];
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        }).filter(row => Object.values(row).some(value => value !== ''));
        
        setCsvData(data);
      };
      reader.readAsText(file);
    }
  };

  const importCsvData = () => {
    if (!csvData.length || !csvMapping.color || !csvMapping.size || !csvMapping.quantity) {
      toast.error('Please map all required fields (color, size, quantity).');
      return;
    }

    const importedVariants: Variant[] = csvData.map(row => ({
      color: row[csvMapping.color] || '',
      size: row[csvMapping.size] || '',
      quantity: parseInt(row[csvMapping.quantity]) || 0,
      imageUrl: csvMapping.imageUrl ? row[csvMapping.imageUrl] : undefined
    })).filter(v => v.color && v.size && v.quantity > 0);

    setMixedVariants(importedVariants);
    setVariantMode('mixed');
    setShowCsvImport(false);
    toast.success(`Imported ${importedVariants.length} variants successfully.`);
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      'color,size,quantity,image_url',
      'Red,S,10,https://example.com/red-s.jpg',
      'Red,M,15,https://example.com/red-m.jpg',
      'Blue,S,12,https://example.com/blue-s.jpg',
      'Blue,L,8,https://example.com/blue-l.jpg'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-variants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper functions for managing custom sizes
  const addCustomSize = () => {
    if (newCustomSize.trim() && !getAllSizes().includes(newCustomSize.trim())) {
      setCustomSizes(prev => [...prev, newCustomSize.trim()]);
      setNewCustomSize('');
      toast.success(`Custom size "${newCustomSize.trim()}" added successfully!`);
    } else {
      toast.error('Size already exists or is empty!');
    }
  };

  const removeCustomSize = (sizeToRemove: string) => {
    setCustomSizes(prev => prev.filter(size => size !== sizeToRemove));
    toast.success(`Custom size "${sizeToRemove}" removed successfully!`);
  };

  const getAllSizes = () => {
    return [...predefinedSizes, ...customSizes];
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Stock Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Cotton T-Shirt"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Category</Label>
                {(user?.role === 'manufacturer' || user?.role === 'warehouse') && (
                  <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        type="button"
                      >
                        <PlusCircle className="h-3 w-3" />
                        New Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                          Create a new product category that will be available to all users.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newCategory">Category Name</Label>
                          <Input
                            id="newCategory"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g., Winter Wear"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewCategory();
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Category name should be descriptive and between 1-50 characters
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddNewCategory} disabled={!newCategoryName.trim()}>
                          Add Category
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Base Price per piece (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="Base price in rupees"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || (user?.profile?.address ? 
                  `${user.profile.address.city}, ${user.profile.address.state}` : 'Location not available')}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="City, State"
                className="bg-muted/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
              <Input
                id="minOrderQuantity"
                type="number"
                value={formData.minOrderQuantity}
                onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
                placeholder="Minimum order quantity"
                min="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Expected Delivery Time</span>
              </Label>
              <Select value={formData.deliveryTime} onValueChange={(value) => handleChange('deliveryTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expected delivery duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-10 days">5-10 days</SelectItem>
                  <SelectItem value="10-20 days">10-20 days</SelectItem>
                  <SelectItem value="more than 1 month">More than 1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Product description, material, special features..."
              rows={3}
            />
          </div>

          {/* Fabric Information Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 border-blue-200">
            <div className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-medium">Fabric Information</Label>
              <Badge variant="destructive" className="text-xs">REQUIRED</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabricType">Fabric Type</Label>
                <Select value={formData.fabricType} onValueChange={(value) => handleChange('fabricType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fabric type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fabricTypes.map(fabric => (
                      <SelectItem key={fabric} value={fabric}>{fabric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fabricDescription">Fabric Description</Label>
                <Textarea
                  id="fabricDescription"
                  value={formData.fabricDescription}
                  onChange={(e) => handleChange('fabricDescription', e.target.value)}
                  placeholder="Describe the fabric properties, blend ratios, care instructions, comfort level, durability, etc..."
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Auto Generate Combos Section */}
          <div className="space-y-4">
            <AutoGenerateCombos 
              unitOfMeasure={unitOfMeasure}
              unitMode={unitMode}
              onCombosGenerated={handleCombosGenerated}
              mrp={formData.price ? parseFloat(formData.price) : 0}
            />

            {/* Variant Preview - Shows generated combinations */}

            {/* Dynamic Variant Forms */}
            <div className="space-y-4">
              {variantMode === 'color-first' && (
                <div className="space-y-3">
                  {colorFirstVariants.map((variant, index) => (
                    <div key={index} className="p-4 bg-white rounded-md border space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Color Variant {index + 1}</Label>
                        {colorFirstVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeColorFirstVariant(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <ColorInput
                            value={variant.color}
                            onChange={(value) => updateColorFirstVariant(index, 'color', value)}
                            placeholder="Enter or pick a color"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Sizes</Label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {getAllSizes().map(size => (
                                <div key={size} className="relative">
                                  <Button
                                    type="button"
                                    variant={variant.sizes.includes(size) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                      const newSizes = variant.sizes.includes(size)
                                        ? variant.sizes.filter(s => s !== size)
                                        : [...variant.sizes, size];
                                      updateColorFirstVariant(index, 'sizes', newSizes);
                                    }}
                                    className="pr-8"
                                  >
                                    {size}
                                  </Button>
                                  {customSizes.includes(size) && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCustomSize(size)}
                                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="text"
                                value={newCustomSize}
                                onChange={(e) => setNewCustomSize(e.target.value)}
                                placeholder="Add custom size (e.g., 3XL, 44)"
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomSize();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCustomSize}
                                className="flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={variant.quantity}
                            onChange={(e) => updateColorFirstVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Image URL (Optional)</Label>
                          <Input
                            value={variant.imageUrl || ''}
                            onChange={(e) => updateColorFirstVariant(index, 'imageUrl', e.target.value)}
                            placeholder="Image URL for this color"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {variantMode === 'size-first' && (
                <div className="space-y-3">
                  {sizeFirstVariants.map((variant, index) => (
                    <div key={index} className="p-4 bg-white rounded-md border space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Size Variant {index + 1}</Label>
                        {sizeFirstVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSizeFirstVariant(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label>Size</Label>
                          <div className="space-y-2">
                            <Select
                              value={variant.size}
                              onValueChange={(value) => updateSizeFirstVariant(index, 'size', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAllSizes().map(size => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="text"
                                value={newCustomSize}
                                onChange={(e) => setNewCustomSize(e.target.value)}
                                placeholder="Add custom size"
                                className="flex-1 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomSize();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCustomSize}
                                className="px-2"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Colors</Label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {variant.colors.map((color, colorIndex) => (
                                <div key={colorIndex} className="relative">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="pr-8"
                                  >
                                    {color}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newColors = variant.colors.filter((_, i) => i !== colorIndex);
                                      updateSizeFirstVariant(index, 'colors', newColors);
                                    }}
                                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <ColorInput
                                value=""
                                onChange={(colorValue) => {
                                  if (colorValue && !variant.colors.includes(colorValue)) {
                                    const newColors = [...variant.colors, colorValue];
                                    updateSizeFirstVariant(index, 'colors', newColors);
                                  }
                                }}
                                placeholder="Add a color"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={variant.quantity}
                            onChange={(e) => updateSizeFirstVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Image URL (Optional)</Label>
                          <Input
                            value={variant.imageUrl || ''}
                            onChange={(e) => updateSizeFirstVariant(index, 'imageUrl', e.target.value)}
                            placeholder="Image URL for this size"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {variantMode === 'mixed' && (
                <div className="space-y-3">
                  {mixedVariants.map((variant, index) => (
                    <div key={index} className="p-4 bg-white rounded-md border">
                      <div className="flex items-center justify-between mb-3">
                        <Label>Variant {index + 1}</Label>
                        {mixedVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMixedVariant(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <ColorInput
                            value={variant.color}
                            onChange={(value) => updateMixedVariant(index, 'color', value)}
                            placeholder="Enter or pick a color"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Size</Label>
                          <div className="space-y-2">
                            <Select
                              value={variant.size}
                              onValueChange={(value) => updateMixedVariant(index, 'size', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAllSizes().map(size => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="text"
                                value={newCustomSize}
                                onChange={(e) => setNewCustomSize(e.target.value)}
                                placeholder="Add custom size"
                                className="flex-1 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomSize();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCustomSize}
                                className="px-2"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={variant.quantity}
                            onChange={(e) => updateMixedVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Image URL (Optional)</Label>
                          <Input
                            value={variant.imageUrl || ''}
                            onChange={(e) => updateMixedVariant(index, 'imageUrl', e.target.value)}
                            placeholder="Image URL"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variant Preview */}
            {getNormalizedVariants().length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Variant Preview</Label>
                <div className="bg-white rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Color</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getNormalizedVariants().map((variant, index) => (
                        <TableRow key={index}>
                          <TableCell>{variant.color}</TableCell>
                          <TableCell>{variant.size}</TableCell>
                          <TableCell>{variant.quantity}</TableCell>
                          <TableCell>
                            {variant.imageUrl ? (
                              <Badge variant="outline">Has Image</Badge>
                            ) : (
                              <span className="text-muted-foreground">No Image</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total variants: {getNormalizedVariants().length} | 
                  Total quantity: {getNormalizedVariants().reduce((sum, v) => sum + v.quantity, 0)}
                </p>
              </div>
            )}
          </div>

          {/* Retailer-Specific Pricing Section */}
          {(user?.role === 'manufacturer' || user?.role === 'warehouse') && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Retailer-Specific Pricing (Optional)</Label>
                <Badge variant="outline" className="text-xs">
                  Different prices for different retailer types
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="singleShopPrice" className="flex items-center gap-2">
                    <span>Single Shop Price (₹)</span>
                    <Badge variant="secondary" className="text-xs">Single Shop</Badge>
                  </Label>
                  <Input
                    id="singleShopPrice"
                    type="number"
                    step="0.01"
                    value={formData.singleShopPrice}
                    onChange={(e) => handleChange('singleShopPrice', e.target.value)}
                    placeholder="Price for single shop retailers"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multiShopPrice" className="flex items-center gap-2">
                    <span>Multi Shop Price (₹)</span>
                    <Badge variant="secondary" className="text-xs">Multi Shop</Badge>
                  </Label>
                  <Input
                    id="multiShopPrice"
                    type="number"
                    step="0.01"
                    value={formData.multiShopPrice}
                    onChange={(e) => handleChange('multiShopPrice', e.target.value)}
                    placeholder="Price for multi shop retailers"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Purchase Restriction Section */}
          {user?.role === 'manufacturer' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <Label className="text-base font-medium">Purchase Restriction (Optional)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Traders Only</label>
                  <Button
                    type="button"
                    variant={tradersOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTradersOnly(!tradersOnly)}
                    className={tradersOnly ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {tradersOnly ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Special Offer Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-600" />
                <Label className="text-base font-medium">Special Offer (Optional)</Label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Enable Offer</label>
                <Button
                  type="button"
                  variant={hasOffer ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHasOffer(!hasOffer)}
                  className={hasOffer ? "bg-orange-600 hover:bg-orange-700" : ""}
                >
                  {hasOffer ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            {hasOffer && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="offerPrice" className="flex items-center gap-2">
                    <span>Special Offer Price (₹)</span>
                    <Badge variant="destructive" className="text-xs">DISCOUNT</Badge>
                  </Label>
                  <Input
                    id="offerPrice"
                    type="number"
                    step="0.01"
                    value={offerData.offerPrice}
                    onChange={(e) => setOfferData(prev => ({ ...prev, offerPrice: e.target.value }))}
                    placeholder="Discounted price per piece"
                    min="0"
                    required={hasOffer}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Offer Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={offerData.offerType === 'time' ? "default" : "outline"}
                      className={`p-4 h-auto flex-col gap-2 ${offerData.offerType === 'time' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      onClick={() => setOfferData(prev => ({ ...prev, offerType: 'time' }))}
                    >
                      <Calendar className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Time Limited</div>
                        <div className="text-xs opacity-80">Set duration in weeks</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={offerData.offerType === 'quantity' ? "default" : "outline"}
                      className={`p-4 h-auto flex-col gap-2 ${offerData.offerType === 'quantity' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      onClick={() => setOfferData(prev => ({ ...prev, offerType: 'quantity' }))}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Bulk Discount</div>
                        <div className="text-xs opacity-80">Set minimum quantity</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {offerData.offerType === 'time' && (
                  <div className="space-y-2">
                    <Label htmlFor="offerTimeWeeks" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Offer Duration (Weeks)</span>
                    </Label>
                    <Input
                      id="offerTimeWeeks"
                      type="number"
                      value={offerData.offerTimeWeeks}
                      onChange={(e) => setOfferData(prev => ({ ...prev, offerTimeWeeks: e.target.value }))}
                      placeholder="e.g., 2"
                      min="1"
                      max="52"
                      required={hasOffer && offerData.offerType === 'time'}
                    />
                  </div>
                )}

                {offerData.offerType === 'quantity' && (
                  <div className="space-y-2">
                    <Label htmlFor="offerMinQuantity" className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Minimum Order Quantity for Offer</span>
                    </Label>
                    <Input
                      id="offerMinQuantity"
                      type="number"
                      value={offerData.offerMinQuantity}
                      onChange={(e) => setOfferData(prev => ({ ...prev, offerMinQuantity: e.target.value }))}
                      placeholder="e.g., 50"
                      min="1"
                      required={hasOffer && offerData.offerType === 'quantity'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Stock Item
            </Button>
          </div>
        </form>
      </CardContent>

      {/* CSV Import Modal */}
      <Dialog open={showCsvImport} onOpenChange={setShowCsvImport}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Variants from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with variant data or download our sample format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </Button>
              </div>
            </div>

            {csvData.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Map CSV Columns</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Color Column</Label>
                      <Select
                        value={csvMapping.color}
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, color: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(csvData[0] || {}).map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Size Column</Label>
                      <Select
                        value={csvMapping.size}
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, size: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(csvData[0] || {}).map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity Column</Label>
                      <Select
                        value={csvMapping.quantity}
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, quantity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(csvData[0] || {}).map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Image URL Column (Optional)</Label>
                      <Select
                        value={csvMapping.imageUrl}
                        onValueChange={(value) => setCsvMapping(prev => ({ ...prev, imageUrl: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No image column</SelectItem>
                          {Object.keys(csvData[0] || {}).map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preview ({csvData.length} rows)</Label>
                  <div className="max-h-40 overflow-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(csvData[0] || {}).map(key => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, i) => (
                              <TableCell key={i}>{value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCsvImport(false)}>
              Cancel
            </Button>
            <Button
              onClick={importCsvData}
              disabled={!csvData.length || !csvMapping.color || !csvMapping.size || !csvMapping.quantity}
            >
              Import and Normalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

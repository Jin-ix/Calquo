import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { SizeChartSelector } from './SizeChartSelector';
import { ItemSet, SizeQuantity } from './ItemSetTypes';
import { useAuth } from '../auth/AuthProvider';
import { MediaCapture } from '../camera/MediaCapture';
import { Plus, Minus, X, Package, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface AddItemSetFormProps {
  onSubmit: (itemSet: Omit<ItemSet, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
}

export function AddItemSetForm({ onSubmit, onCancel }: AddItemSetFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    color: '',
    description: '',
    setPrice: '',
    singleShopSetPrice: '',
    multiShopSetPrice: '',
    minOrderSets: '1'
  });

  const [sizeQuantities, setSizeQuantities] = useState<SizeQuantity[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total pieces in set
  const totalPiecesInSet = sizeQuantities.reduce((sum, sq) => sum + sq.quantity, 0);
  
  // Calculate pricing
  const basePrice = parseFloat(formData.setPrice) || 0;
  const singleShopPrice = parseFloat(formData.singleShopSetPrice) || basePrice;
  const multiShopPrice = parseFloat(formData.multiShopSetPrice) || Math.round(basePrice * 0.9);

  const handleSizeQuantityAdd = (sizeDetails: SizeQuantity['sizeDetails']) => {
    const newSizeQuantity: SizeQuantity = {
      sizeDetails,
      quantity: 1,
      available: 1
    };
    setSizeQuantities(prev => [...prev, newSizeQuantity]);
  };

  const handleSizeQuantityUpdate = (index: number, field: 'quantity' | 'available', value: number) => {
    setSizeQuantities(prev => 
      prev.map((sq, i) => 
        i === index ? { ...sq, [field]: Math.max(0, value) } : sq
      )
    );
  };

  const handleSizeQuantityRemove = (index: number) => {
    setSizeQuantities(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImages = (newImages: string[]) => {
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePriceChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate related prices
    if (field === 'setPrice') {
      const price = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        singleShopSetPrice: price.toString(),
        multiShopSetPrice: Math.round(price * 0.9).toString()
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sizeQuantities.length === 0) {
      toast.error('Please add at least one size to the set');
      return;
    }
    
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    const itemSet: Omit<ItemSet, 'id' | 'dateAdded'> = {
      name: formData.name,
      category: formData.category,
      color: formData.color,
      description: formData.description,
      supplier: user?.company || '',
      supplierType: user?.role as ItemSet['supplierType'] || 'manufacturer',
      location: user?.location || '',
      sizeQuantities: sizeQuantities,
      setPrice: basePrice,
      singleShopSetPrice: singleShopPrice,
      multiShopSetPrice: multiShopPrice,
      minOrderSets: parseInt(formData.minOrderSets) || 1,
      totalPiecesInSet: totalPiecesInSet,
      images: images
    };

    setIsLoading(true);
    try {
      onSubmit(itemSet);
      toast.success('Item set added successfully!');
    } catch (error) {
      toast.error('Failed to add item set');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Create Item Set</h1>
        </div>
        <Badge variant="outline" className="gap-1">
          <Calculator className="h-3 w-3" />
          {totalPiecesInSet} pieces total
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Set Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Cotton T-Shirt Set"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T-Shirts">T-Shirts</SelectItem>
                    <SelectItem value="Shirts">Shirts</SelectItem>
                    <SelectItem value="Dresses">Dresses</SelectItem>
                    <SelectItem value="Jackets">Jackets</SelectItem>
                    <SelectItem value="Pants">Pants</SelectItem>
                    <SelectItem value="Baby Clothes">Baby Clothes</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., Navy Blue"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minOrderSets">Min Order (Sets) *</Label>
                <Input
                  id="minOrderSets"
                  type="number"
                  min="1"
                  value={formData.minOrderSets}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderSets: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the item set quality, material, features..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Size & Quantity Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Size & Quantity Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define what sizes and quantities are included in each set
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SizeChartSelector onSizeAdd={handleSizeQuantityAdd} />
            
            {sizeQuantities.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Set Configuration:</h4>
                {sizeQuantities.map((sq, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="outline" className="min-w-[120px] text-xs">
                      {sq.sizeDetails.displayName}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Qty per set:</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleSizeQuantityUpdate(index, 'quantity', sq.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={sq.quantity}
                          onChange={(e) => handleSizeQuantityUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 h-7 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleSizeQuantityUpdate(index, 'quantity', sq.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Available sets:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={sq.available}
                        onChange={(e) => handleSizeQuantityUpdate(index, 'available', parseInt(e.target.value) || 1)}
                        className="w-20 h-7"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleSizeQuantityRemove(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Set Summary:</p>
                  <p className="text-sm text-muted-foreground">
                    Each set contains {totalPiecesInSet} pieces across {sizeQuantities.length} sizes
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Set Pricing</CardTitle>
            <p className="text-sm text-muted-foreground">
              Price is per complete set ({totalPiecesInSet} pieces)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setPrice">Base Price per Set (₹) *</Label>
                <Input
                  id="setPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.setPrice}
                  onChange={(e) => handlePriceChange('setPrice', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="singleShopSetPrice">Single Shop Price (₹)</Label>
                <Input
                  id="singleShopSetPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.singleShopSetPrice}
                  onChange={(e) => handlePriceChange('singleShopSetPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="multiShopSetPrice">Multi-Shop Price (₹)</Label>
                <Input
                  id="multiShopSetPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.multiShopSetPrice}
                  onChange={(e) => handlePriceChange('multiShopSetPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {totalPiecesInSet > 0 && basePrice > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium">Price per piece: ₹{(basePrice / totalPiecesInSet).toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Set Images</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add 3-5 images showing the complete set and individual pieces
            </p>
          </CardHeader>
          <CardContent>
            <MediaCapture onImagesCapture={handleAddImages} maxImages={5 - images.length} />
            
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Set image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || sizeQuantities.length === 0}>
            {isLoading ? 'Creating Set...' : 'Create Item Set'}
          </Button>
        </div>
      </form>
    </div>
  );
}

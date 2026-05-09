import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ImageUpload } from '../ui/image-upload';
import { FriendlyVariantUploadMode } from './FriendlyVariantUploadMode';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { Package, IndianRupee, FileText, Sparkles, Shirt, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Switch } from '../ui/switch';
import { uploadImage } from '../../utils/firebase/storage';

interface Variant {
  color: string;
  size: string;
  quantity: number;
  imageUrl?: string;
}

interface StockFormData {
  name: string;
  category: string;
  customCategory: string;
  basePrice: string;
  useRetailerSpecificPricing: boolean;
  singleShopPrice: string;
  multiShopPrice: string;
  description: string;
  fabricType: string;
  fabricDescription: string;
  deliveryTime: string;
  minOrderQuantity: string;
  images: string[];
  mainImageIndex: number;
  variants: Variant[];
}

const categories = [
  'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts', 
  'Jackets', 'Sweaters', 'Shorts', 'Tops', 'Blouses', 'Suits'
];

const ADD_NEW_CATEGORY = '__ADD_NEW__';

const fabricTypes = [
  'Cotton', 'Polyester', 'Cotton Blend', 'Linen', 'Silk', 'Wool', 
  'Rayon', 'Viscose', 'Lycra', 'Spandex', 'Denim', 'Canvas'
];

export function AddStockWithInteractiveVariants() {
  const [formData, setFormData] = useState<StockFormData>({
    name: '',
    category: '',
    customCategory: '',
    basePrice: '',
    useRetailerSpecificPricing: false,
    singleShopPrice: '',
    multiShopPrice: '',
    description: '',
    fabricType: '',
    fabricDescription: '',
    deliveryTime: '',
    minOrderQuantity: '',
    images: [],
    mainImageIndex: 0,
    variants: []
  });

  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const handleInputChange = (field: keyof StockFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === ADD_NEW_CATEGORY) {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '', customCategory: '' }));
    } else {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value, customCategory: '' }));
    }
  };

  const confirmCustomCategory = () => {
    if (formData.customCategory.trim()) {
      setFormData(prev => ({ ...prev, category: prev.customCategory.trim() }));
      setShowCustomCategory(false);
      toast.success(`Custom category "${formData.customCategory.trim()}" added!`);
    }
  };

  const cancelCustomCategory = () => {
    setShowCustomCategory(false);
    setFormData(prev => ({ ...prev, customCategory: '' }));
  };

  const handleVariantsChange = (variants: Variant[]) => {
    setFormData(prev => ({ ...prev, variants }));
  };

  const handleMainImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ 
      ...prev, 
      images: [imageUrl, ...prev.images.filter(img => img !== imageUrl)],
      mainImageIndex: 0
    }));
  };

  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Uploading image to Firebase Storage...');
      
      // Upload to Firebase Storage
      const imageUrl = await uploadImage(file, 'stock_images');
      
      // Add the permanent URL to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      // Call the callback with the permanent URL
      callback(imageUrl);
      
      // Success
      toast.dismiss(loadingToast);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.message}`);
    }
  };

  // Get all images from variants
  const getVariantImages = () => {
    return formData.variants
      .map(variant => variant.imageUrl)
      .filter(Boolean) as string[];
  };

  // Get all available images (product + variant images)
  const getAllAvailableImages = () => {
    const variantImages = getVariantImages();
    return [...formData.images, ...variantImages.filter(img => !formData.images.includes(img))];
  };

  // Check if any images exist (product or variant)
  const hasAnyImages = () => {
    return formData.images.length > 0 || getVariantImages().length > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    
    if (!formData.category && !showCustomCategory) {
      toast.error('Please select or create a category');
      return;
    }
    
    if (showCustomCategory && !formData.customCategory.trim()) {
      toast.error('Please enter a custom category name');
      return;
    }
    
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }
    
    if (formData.useRetailerSpecificPricing) {
      if (!formData.singleShopPrice || parseFloat(formData.singleShopPrice) <= 0) {
        toast.error('Please enter a valid single shop price');
        return;
      }
      
      if (!formData.multiShopPrice || parseFloat(formData.multiShopPrice) <= 0) {
        toast.error('Please enter a valid multi shop price');
        return;
      }
    }
    
    if (!hasAnyImages()) {
      toast.error('Please add at least one image (either in Product Images or Variant Upload Mode)');
      return;
    }
    
    if (formData.variants.length === 0) {
      toast.error('Please add at least one variant');
      return;
    }
    
    if (!formData.minOrderQuantity || parseInt(formData.minOrderQuantity) <= 0) {
      toast.error('Please enter a valid minimum order quantity');
      return;
    }
    
    // Success - would normally submit to backend
    console.log('Stock Item Data:', formData);
    toast.success(`Added ${formData.name} with ${formData.variants.length} variants successfully!`);
  };

  const totalQuantity = formData.variants.reduce((sum, v) => sum + v.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-gradient-pastel min-h-screen">

      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Product Information */}
        <Card className="bg-pastel-pink border-pastel-pink-border shadow-pastel-lg backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-pastel-pink to-pastel-purple/20 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-pastel-pink-text">
              <Package className="h-6 w-6" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Cotton T-Shirt Premium Quality"
                  required
                  className="border-pastel-pink-border focus:border-pastel-pink-text bg-white/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-pastel-pink-text font-medium">Category *</Label>
                {!showCustomCategory ? (
                  <Select value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="border-pastel-pink-border focus:border-pastel-pink-text bg-white/80">
                      <SelectValue placeholder="Select or create category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value={ADD_NEW_CATEGORY} className="text-pastel-purple-text font-medium">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New Category
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter new category name"
                        value={formData.customCategory}
                        onChange={(e) => handleInputChange('customCategory', e.target.value)}
                        className="border-pastel-purple-border focus:border-pastel-purple-text bg-white/80"
                        onKeyDown={(e) => e.key === 'Enter' && confirmCustomCategory()}
                      />
                      <Button
                        type="button"
                        onClick={confirmCustomCategory}
                        disabled={!formData.customCategory.trim()}
                        className="bg-pastel-green-text hover:bg-green-600 text-white px-4"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelCustomCategory}
                        className="border-pastel-pink-border text-pastel-pink-text hover:bg-pastel-pink"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-pastel-purple-text">
                      Enter a new category name and click the plus button to add it
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed product description, features, and benefits..."
                rows={3}
                className="border-pastel-pink-border focus:border-pastel-pink-text bg-white/80"
              />
            </div>
          </CardContent>
        </Card>

        {/* Friendly Variant Upload Mode */}
        <Card className="bg-pastel-blue border-pastel-blue-border shadow-pastel-lg backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-pastel-blue to-pastel-teal/20 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-pastel-blue-text">
              <Sparkles className="h-6 w-6" />
              Product Variants Setup
              <span className="text-sm font-normal text-pastel-teal-text ml-2">
                - Colors, Sizes & Quantities
              </span>
            </CardTitle>
            <p className="text-sm text-pastel-blue-text mt-2">
              Set up your product variations in the way that makes most sense to you
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <FriendlyVariantUploadMode
              variants={formData.variants}
              onVariantsChange={handleVariantsChange}
              onImageUpload={handleImageUpload}
            />
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card className="bg-pastel-green border-pastel-green-border shadow-pastel-lg backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-pastel-green to-pastel-yellow/20 rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-pastel-green-text">
                🖼️ Product Images
                {getVariantImages().length > 0 && (
                  <span className="text-sm font-normal text-pastel-teal-text bg-pastel-teal px-2 py-1 rounded-full">
                    Optional - {getVariantImages().length} variant image{getVariantImages().length > 1 ? 's' : ''} available
                  </span>
                )}
              </CardTitle>
            </div>
            {getVariantImages().length > 0 && (
              <p className="text-sm text-pastel-green-text">
                You can add additional product images here, or use the images from your variants as the main product images.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <ImageUpload
              images={formData.images}
              mainImageIndex={formData.mainImageIndex}
              onImagesChange={(images) => handleInputChange('images', images)}
              onMainImageChange={(index) => handleInputChange('mainImageIndex', index)}
              maxImages={10}
              required={!hasAnyImages()}
            />
            
            {/* Main Image Selection from All Available Images */}
            {getAllAvailableImages().length > 1 && (
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">Select Main Product Image</Label>
                <p className="text-xs text-muted-foreground">
                  Choose which image should be the main product image from all available images
                </p>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {getAllAvailableImages().map((imageUrl, index) => {
                    const isMainImage = formData.images[0] === imageUrl;
                    const isVariantImage = getVariantImages().includes(imageUrl) && !formData.images.includes(imageUrl);
                    
                    return (
                      <div
                        key={imageUrl}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isMainImage 
                            ? 'border-green-500 ring-2 ring-green-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleMainImageSelect(imageUrl)}
                      >
                        <div className="aspect-square">
                          <img
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isMainImage && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                            Main
                          </div>
                        )}
                        {isVariantImage && (
                          <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                            Variant
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fabric Information */}
        <Card className="bg-pastel-purple border-pastel-purple-border shadow-pastel-lg backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-pastel-purple to-pastel-pink/20 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-pastel-purple-text">
              <Shirt className="h-6 w-6" />
              🧵 Fabric Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabricType">Fabric Type</Label>
                <Select value={formData.fabricType} onValueChange={(value) => handleInputChange('fabricType', value)}>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fabricDescription">Fabric Description</Label>
              <Textarea
                id="fabricDescription"
                value={formData.fabricDescription}
                onChange={(e) => handleInputChange('fabricDescription', e.target.value)}
                placeholder="Detailed fabric information: GSM, thread count, finish, care instructions, special properties, etc."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Include fabric weight (GSM), thread count, weave type, finish, care instructions, and any special properties
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Details */}
        <Card className="bg-pastel-orange border-pastel-orange-border shadow-pastel-lg backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-pastel-orange to-pastel-yellow/20 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-pastel-orange-text">
              <IndianRupee className="h-6 w-6" />
              💰 Pricing & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="basePrice" className="text-pastel-orange-text font-medium">Base Price (₹) *</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', e.target.value)}
                placeholder="0.00"
                min="0"
                required
                className="border-pastel-orange-border focus:border-pastel-orange-text bg-white/80 text-lg font-medium"
              />
              <p className="text-xs text-pastel-orange-text">
                Standard selling price for this product
              </p>
            </div>

            {/* Optional Retailer-Specific Pricing */}
            <div className="bg-pastel-yellow border border-pastel-yellow-border rounded-xl p-5 shadow-pastel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-pastel-yellow-text flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    ✨ Retailer-Specific Pricing
                  </h4>
                  <p className="text-xs text-pastel-orange-text mt-1">
                    Set different prices for single vs multi-shop retailers (optional)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.useRetailerSpecificPricing}
                    onCheckedChange={(checked) => handleInputChange('useRetailerSpecificPricing', checked)}
                    className="data-[state=checked]:bg-pastel-purple-text"
                  />
                  <span className="text-xs text-pastel-yellow-text font-medium">
                    {formData.useRetailerSpecificPricing ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              {formData.useRetailerSpecificPricing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-pastel-yellow-border">
                  <div className="space-y-2">
                    <Label htmlFor="singleShopPrice" className="text-pastel-yellow-text font-medium">Single Shop Price (₹) *</Label>
                    <Input
                      id="singleShopPrice"
                      type="number"
                      step="0.01"
                      value={formData.singleShopPrice}
                      onChange={(e) => handleInputChange('singleShopPrice', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      required={formData.useRetailerSpecificPricing}
                      className="border-pastel-yellow-border focus:border-pastel-yellow-text bg-white/80"
                    />
                    <p className="text-xs text-pastel-orange-text">Price for single shop retailers</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="multiShopPrice" className="text-pastel-yellow-text font-medium">Multi Shop Price (₹) *</Label>
                    <Input
                      id="multiShopPrice"
                      type="number"
                      step="0.01"
                      value={formData.multiShopPrice}
                      onChange={(e) => handleInputChange('multiShopPrice', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      required={formData.useRetailerSpecificPricing}
                      className="border-pastel-yellow-border focus:border-pastel-yellow-text bg-white/80"
                    />
                    <p className="text-xs text-pastel-orange-text">Price for multi shop retailers (bulk discount)</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderQuantity">Min Order Quantity *</Label>
                <Input
                  id="minOrderQuantity"
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Delivery Time</Label>
                <Select value={formData.deliveryTime} onValueChange={(value) => handleInputChange('deliveryTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10 days">5-10 days</SelectItem>
                    <SelectItem value="10-20 days">10-20 days</SelectItem>
                    <SelectItem value="more than 1 month">More than 1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {formData.variants.length > 0 && (
          <Card className="bg-pastel-teal border-pastel-teal-border shadow-pastel-lg backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-pastel-teal to-pastel-blue/20 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-pastel-teal-text">
                <FileText className="h-6 w-6" />
                📊 Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/70 rounded-xl p-4 shadow-pastel">
                  <p className="text-3xl font-bold text-pastel-purple-text">{formData.variants.length}</p>
                  <p className="text-sm text-pastel-teal-text font-medium">Total Variants</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-pastel">
                  <p className="text-3xl font-bold text-pastel-blue-text">{totalQuantity}</p>
                  <p className="text-sm text-pastel-teal-text font-medium">Total Quantity</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-pastel">
                  <p className="text-3xl font-bold text-pastel-green-text">{getAllAvailableImages().length}</p>
                  <p className="text-sm text-pastel-teal-text font-medium">Total Images</p>
                  <p className="text-xs text-pastel-blue-text">
                    {formData.images.length} product + {getVariantImages().length} variant
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-pastel">
                  <p className="text-3xl font-bold text-pastel-orange-text">
                    {formData.basePrice ? `₹${parseFloat(formData.basePrice).toFixed(2)}` : '₹0.00'}
                  </p>
                  <p className="text-sm text-pastel-teal-text font-medium">Base Price</p>
                </div>
              </div>
              
              {formData.useRetailerSpecificPricing && (formData.singleShopPrice || formData.multiShopPrice) && (
                <div className="mt-4 pt-4 border-t border-pastel-teal-border">
                  <h5 className="text-sm font-medium text-pastel-teal-text mb-3 text-center">Retailer-Specific Pricing</h5>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/70 rounded-xl p-4 shadow-pastel">
                      <p className="text-2xl font-bold text-pastel-pink-text">
                        {formData.singleShopPrice ? `₹${parseFloat(formData.singleShopPrice).toFixed(2)}` : '₹0.00'}
                      </p>
                      <p className="text-sm text-pastel-teal-text font-medium">Single Shop</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-4 shadow-pastel">
                      <p className="text-2xl font-bold text-pastel-purple-text">
                        {formData.multiShopPrice ? `₹${parseFloat(formData.multiShopPrice).toFixed(2)}` : '₹0.00'}
                      </p>
                      <p className="text-sm text-pastel-teal-text font-medium">Multi Shop</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex gap-4 pt-6">
          <Button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-pastel-purple-text to-pastel-pink-text hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl shadow-pastel-lg transform transition-all duration-200 hover:scale-[1.02] font-medium text-lg"
            disabled={formData.variants.length === 0 || !hasAnyImages() || !formData.basePrice}
          >
            ✨ Add Stock Item ✨
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => window.history.back()}
            className="px-8 py-4 border-pastel-purple-border text-pastel-purple-text hover:bg-pastel-purple rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

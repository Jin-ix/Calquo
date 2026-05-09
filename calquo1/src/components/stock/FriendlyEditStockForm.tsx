import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageViewer } from '../ui/image-viewer';
import { 
  Save, 
  X, 
  Package, 
  Tag, 
  MapPin, 
  IndianRupee,
  Clock,
  Palette,
  Ruler,
  FileText,
  ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  MoveUp,
  MoveDown,
  Star,
  Plus,
  Camera,
  Link,
  Globe,
  Eye
} from 'lucide-react';
import { EnhancedStockItem } from './EnhancedStockTypes';
import { useStock } from '../context/StockContext';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { MediaCapture } from '../camera/MediaCapture';
import { getRelevantHSNCodes, getDefaultHSNCode, apparelHSNCodes } from '../../utils/hsnCodes';

interface FriendlyEditStockFormProps {
  stock: EnhancedStockItem;
  isOpen: boolean;
  onClose: () => void;
}

export function FriendlyEditStockForm({ stock, isOpen, onClose }: FriendlyEditStockFormProps) {
  const { updateStock } = useStock();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: stock.name || '',
    category: stock.category || '',
    hsnCode: stock.hsnCode || '',
    description: stock.description || '',
    location: stock.location || '',
    basePrice: stock.basePrice?.toString() || '0',
    singleShopPrice: stock.singleShopPrice?.toString() || '',
    multiShopPrice: stock.multiShopPrice?.toString() || '',
    minOrderQuantity: stock.minOrderQuantity?.toString() || '1',
    fabricType: stock.fabricType || '',
    fabricDescription: stock.fabricDescription || '',
    deliveryTime: stock.deliveryTime || '',
    offerPrice: stock.offerPrice?.toString() || '',
    offerType: stock.offerType || 'time',
    offerTimeWeeks: stock.offerTimeWeeks?.toString() || '',
    offerMinQuantity: stock.offerMinQuantity?.toString() || '',
    tradersOnly: stock.tradersOnly || false
  });

  // Images state - gather all existing images
  const [stockImages, setStockImages] = useState<string[]>(() => {
    const images: string[] = [];
    
    // Get images from mainImages
    if (stock.mainImages && stock.mainImages.length > 0) {
      images.push(...stock.mainImages);
    }
    
    // Get images from colors
    if (stock.colors && stock.colors.length > 0) {
      stock.colors.forEach(color => {
        if (color.images && color.images.length > 0) {
          images.push(...color.images);
        }
      });
    }
    
    // Get images from combinations
    if (stock.combinations && stock.combinations.length > 0) {
      stock.combinations.forEach(combination => {
        if (combination.images && combination.images.length > 0) {
          images.push(...combination.images);
        }
      });
    }
    
    // Remove duplicates
    return [...new Set(images)];
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Track changes
  useEffect(() => {
    const originalImages = getOriginalStockImages();
    const hasFormChanges = 
      formData.name !== stock.name ||
      formData.category !== stock.category ||
      formData.description !== stock.description ||
      formData.location !== stock.location ||
      formData.basePrice !== stock.basePrice?.toString() ||
      formData.fabricType !== stock.fabricType ||
      formData.deliveryTime !== stock.deliveryTime ||
      (formData.offerPrice || '') !== (stock.offerPrice?.toString() || '') ||
      JSON.stringify(stockImages) !== JSON.stringify(originalImages);
    
    setHasChanges(hasFormChanges);
  }, [formData, stock, stockImages]);

  // Get original images for comparison
  const getOriginalStockImages = () => {
    const images: string[] = [];
    if (stock.mainImages) images.push(...stock.mainImages);
    if (stock.colors) {
      stock.colors.forEach(color => {
        if (color.images) images.push(...color.images);
      });
    }
    if (stock.combinations) {
      stock.combinations.forEach(combination => {
        if (combination.images) images.push(...combination.images);
      });
    }
    return [...new Set(images)];
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Image handling functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        if (imageDataUrl && stockImages.length < 15) {
          setStockImages(prev => [...prev, imageDataUrl]);
          toast.success('Image added successfully');
        } else if (stockImages.length >= 15) {
          toast.error('Maximum 15 images allowed');
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setStockImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setStockImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  const moveImageDown = (index: number) => {
    if (index === stockImages.length - 1) return;
    setStockImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    setStockImages(prev => {
      const newImages = [...prev];
      const mainImage = newImages[index];
      newImages.splice(index, 1);
      newImages.unshift(mainImage);
      return newImages;
    });
    toast.success('Main image updated');
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    if (stockImages.length < 15) {
      setStockImages(prev => [...prev, imageDataUrl]);
      toast.success('Photo captured successfully');
    } else {
      toast.error('Maximum 15 images allowed');
    }
    setShowCameraCapture(false);
  };

  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Check if URL has a valid protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      // Check if URL has an image extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const pathname = urlObj.pathname.toLowerCase();
      return imageExtensions.some(ext => pathname.endsWith(ext)) || 
             pathname.includes('image') || 
             urlObj.searchParams.has('format');
    } catch {
      return false;
    }
  };

  const handleAddImageUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    if (stockImages.length >= 15) {
      toast.error('Maximum 15 images allowed');
      return;
    }

    if (!validateImageUrl(imageUrl)) {
      toast.error('Please enter a valid image URL (must start with http:// or https:// and end with image extension)');
      return;
    }

    setIsValidatingUrl(true);

    try {
      // Test if the image can be loaded
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Image loading timeout')), 10000);
      });

      await Promise.race([loadPromise, timeoutPromise]);

      // If we get here, the image loaded successfully
      setStockImages(prev => [...prev, imageUrl]);
      setImageUrl('');
      toast.success('Image added from URL successfully');
    } catch (error) {
      toast.error('Failed to load image from URL. Please check the URL and try again.');
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddImageUrl();
    }
  };

  const handleViewImage = (index: number) => {
    setViewerInitialIndex(index);
    setViewerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    setIsLoading(true);

    try {
      const updatedData = {
        name: formData.name,
        category: formData.category,
        hsnCode: formData.hsnCode,
        description: formData.description,
        location: formData.location,
        basePrice: parseFloat(formData.basePrice) || 0,
        singleShopPrice: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : null,
        multiShopPrice: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : null,
        minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
        fabricType: formData.fabricType,
        fabricDescription: formData.fabricDescription,
        deliveryTime: formData.deliveryTime,
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
        offerType: formData.offerType,
        offerTimeWeeks: formData.offerTimeWeeks ? parseInt(formData.offerTimeWeeks) : null,
        offerMinQuantity: formData.offerMinQuantity ? parseInt(formData.offerMinQuantity) : null,
        tradersOnly: formData.tradersOnly,
        mainImages: stockImages, // Update mainImages with current images
        productImages: stockImages, // Backup field
        updatedAt: new Date().toISOString(),
        // FORCE UPDATE sellerId to current user's ID to ensure ownership and order routing
        sellerId: user?.id,
        supplier: user?.company || stock.supplier || 'Demo Company',
        supplierId: user?.id, // Also update legacy field
      };

      const success = await updateStock(stock.id, updatedData);
      
      if (success) {
        toast.success('Stock updated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
      toast.error('Failed to update stock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Stock Item</h2>
            <p className="text-sm text-gray-600 mt-1">
              {stock.name} • {stockImages.length} photos • Update your listing
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Image Management */}
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Product Photos
                </div>
                <Badge variant={stockImages.length >= 3 ? "default" : "outline"}>
                  {stockImages.length}/15
                </Badge>
              </div>

              {/* Quick Image Upload */}
              <div className="space-y-2">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="product-images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="product-images"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xs">
                      <p className="font-medium">Upload Files</p>
                      <p className="text-gray-500">Max 5MB each</p>
                    </div>
                  </label>
                </div>

                {/* URL Input */}
                <div className="border border-gray-300 rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium">Add from URL</span>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://image-url.com"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyPress={handleUrlKeyPress}
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrl.trim() || isValidatingUrl || stockImages.length >= 15}
                      size="sm"
                      className="w-full h-6 text-xs"
                    >
                      {isValidatingUrl ? (
                        <div className="animate-spin h-2 w-2 border border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <Plus className="h-2 w-2 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Current Images */}
              {stockImages.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    Drag to reorder • First image is main photo
                  </div>
                  <div className="space-y-2">
                    {stockImages.map((image, index) => (
                      <div key={index} className="relative group bg-white border rounded-lg overflow-hidden">
                        <div className="flex">
                          <div className="w-16 h-16 relative">
                            <ImageWithFallback
                              src={image}
                              alt={`${stock.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                              <div className="absolute top-1 left-1">
                                <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <Star className="h-2 w-2 mr-1" />
                                  Main
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-2 flex items-center justify-between">
                            <div className="text-xs text-gray-600">
                              Photo {index + 1}
                              {index === 0 && <span className="text-yellow-600 ml-1">(Main)</span>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {index !== 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setMainImage(index)}
                                  className="h-6 w-6 p-0"
                                  title="Set as main image"
                                >
                                  <Star className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => moveImageUp(index)}
                                disabled={index === 0}
                                className="h-6 w-6 p-0"
                                title="Move up"
                              >
                                <MoveUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => moveImageDown(index)}
                                disabled={index === stockImages.length - 1}
                                className="h-6 w-6 p-0"
                                title="Move down"
                              >
                                <MoveDown className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeImage(index)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                title="Remove image"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No photos uploaded</p>
                  <p className="text-xs text-gray-400 mt-1">Add photos to showcase your product</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Product Info</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Photos:</span>
                    <span className="font-medium">{stockImages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colors:</span>
                    <span className="font-medium">{stock.colors?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sizes:</span>
                    <span className="font-medium">{stock.sizes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Combinations:</span>
                    <span className="font-medium">{stock.combinations?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="images" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images ({stockImages.length})
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter product name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Shirts">Shirts</SelectItem>
                          <SelectItem value="T-Shirts">T-Shirts</SelectItem>
                          <SelectItem value="Trousers">Trousers</SelectItem>
                          <SelectItem value="Jeans">Jeans</SelectItem>
                          <SelectItem value="Dresses">Dresses</SelectItem>
                          <SelectItem value="Sarees">Sarees</SelectItem>
                          <SelectItem value="Kurtas">Kurtas</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="hsnCode">HSN Code</Label>
                      <Select 
                        value={formData.hsnCode} 
                        onValueChange={(value) => handleInputChange('hsnCode', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select HSN code" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {formData.category ? (
                            <>
                              {/* Relevant HSN codes for selected category */}
                              <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50">
                                Recommended for {formData.category}
                              </div>
                              {getRelevantHSNCodes(formData.category).map((hsn) => (
                                <SelectItem key={hsn.code} value={hsn.code}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{hsn.code}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-2">
                                      {hsn.description}
                                    </span>
                                    {hsn.gstRate && (
                                      <span className="text-xs text-green-600 font-medium">
                                        GST: {hsn.gstRate}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                              <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50">
                                All HSN Codes
                              </div>
                              {apparelHSNCodes
                                .filter(hsn => !getRelevantHSNCodes(formData.category).find(relevant => relevant.code === hsn.code))
                                .map((hsn) => (
                                  <SelectItem key={hsn.code} value={hsn.code}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{hsn.code}</span>
                                      <span className="text-xs text-muted-foreground line-clamp-2">
                                        {hsn.description}
                                      </span>
                                      {hsn.gstRate && (
                                        <span className="text-xs text-green-600 font-medium">
                                          GST: {hsn.gstRate}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                            </>
                          ) : (
                            <>
                              {/* Show all HSN codes if no category selected */}
                              {apparelHSNCodes.map((hsn) => (
                                <SelectItem key={hsn.code} value={hsn.code}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{hsn.code}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-2">
                                      {hsn.description}
                                    </span>
                                    <span className="text-xs text-blue-600">{hsn.category}</span>
                                    {hsn.gstRate && (
                                      <span className="text-xs text-green-600 font-medium">
                                        GST: {hsn.gstRate}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        HSN code for GST compliance
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your product..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, State"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                      <Input
                        id="minOrderQuantity"
                        type="number"
                        value={formData.minOrderQuantity}
                        onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                        placeholder="1"
                        min="1"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Product Images Management
                    </h4>
                    <p className="text-sm text-green-700">
                      Upload and manage your product images. The first image will be displayed as the main image in listings.
                    </p>
                  </div>

                  {/* Image Upload Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="main-image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="main-image-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Upload from Device</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Drop files or click to browse
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, JPEG • Max 5MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* URL Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Link className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-center mb-3">
                          <p className="font-medium">Add from URL</p>
                          <p className="text-sm text-gray-500">
                            Paste image link from web
                          </p>
                        </div>
                        <div className="w-full space-y-2">
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyPress={handleUrlKeyPress}
                            className="text-sm"
                          />
                          <Button
                            type="button"
                            onClick={handleAddImageUrl}
                            disabled={!imageUrl.trim() || isValidatingUrl || stockImages.length >= 15}
                            size="sm"
                            className="w-full"
                          >
                            {isValidatingUrl ? (
                              <>
                                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-2"></div>
                                Validating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-2" />
                                Add Image
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Images Grid */}
                  {stockImages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Current Images ({stockImages.length})</h4>
                        <Badge variant="outline">
                          {stockImages.length}/15 images
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {stockImages.map((image, index) => (
                          <div key={index} className="relative group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-square relative">
                              <ImageWithFallback
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Main image indicator */}
                              {index === 0 && (
                                <div className="absolute top-2 left-2">
                                  <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                    <Star className="h-3 w-3 mr-1" />
                                    Main
                                  </Badge>
                                </div>
                              )}
                              
                              {/* Action buttons overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {index !== 0 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setMainImage(index)}
                                    className="text-xs"
                                    title="Set as main image"
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => moveImageUp(index)}
                                  disabled={index === 0}
                                  title="Move up"
                                >
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => moveImageDown(index)}
                                  disabled={index === stockImages.length - 1}
                                  title="Move down"
                                >
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(index)}
                                  title="Remove image"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Image info */}
                            <div className="p-2">
                              <div className="text-xs text-gray-600 text-center">
                                Image {index + 1}
                                {index === 0 && <span className="text-yellow-600 ml-1">(Main)</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Quick actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          First image is displayed as main product image
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('main-image-upload') as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCameraCapture(true)}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Scroll to URL input and focus it
                              const urlInput = document.querySelector('input[type="url"]') as HTMLInputElement;
                              if (urlInput) {
                                urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                urlInput.focus();
                              }
                            }}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Add URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Upload Tips */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Image Upload Tips
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use high-quality images (at least 800x800 pixels)</li>
                      <li>• Show products from multiple angles</li>
                      <li>• Use good lighting and clear backgrounds</li>
                      <li>• The first image will be the main display image</li>
                      <li>• You can reorder images by using the move buttons</li>
                      <li>• For URL images: ensure they end with .jpg, .png, .gif, etc.</li>
                      <li>• URL images must be from secure (https://) sources when possible</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Base Pricing</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="basePrice">Base Price *</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => handleInputChange('basePrice', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="singleShopPrice">Single Shop Price</Label>
                        <Input
                          id="singleShopPrice"
                          type="number"
                          value={formData.singleShopPrice}
                          onChange={(e) => handleInputChange('singleShopPrice', e.target.value)}
                          placeholder="Optional"
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="multiShopPrice">Multi Shop Price</Label>
                        <Input
                          id="multiShopPrice"
                          type="number"
                          value={formData.multiShopPrice}
                          onChange={(e) => handleInputChange('multiShopPrice', e.target.value)}
                          placeholder="Optional"
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">Special Offer (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="offerPrice">Offer Price</Label>
                        <Input
                          id="offerPrice"
                          type="number"
                          value={formData.offerPrice}
                          onChange={(e) => handleInputChange('offerPrice', e.target.value)}
                          placeholder="Discounted price"
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="offerTimeWeeks">Offer Duration (Weeks)</Label>
                        <Input
                          id="offerTimeWeeks"
                          type="number"
                          value={formData.offerTimeWeeks}
                          onChange={(e) => handleInputChange('offerTimeWeeks', e.target.value)}
                          placeholder="4"
                          min="1"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fabricType">Fabric Type</Label>
                      <Input
                        id="fabricType"
                        value={formData.fabricType}
                        onChange={(e) => handleInputChange('fabricType', e.target.value)}
                        placeholder="e.g., Cotton, Silk, Polyester"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryTime">Delivery Time</Label>
                      <Input
                        id="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                        placeholder="e.g., 3-5 days"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fabricDescription">Fabric Description</Label>
                    <Textarea
                      id="fabricDescription"
                      value={formData.fabricDescription}
                      onChange={(e) => handleInputChange('fabricDescription', e.target.value)}
                      placeholder="Describe the fabric quality, feel, care instructions..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Access Settings</h4>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tradersOnly}
                        onChange={(e) => handleInputChange('tradersOnly', e.target.checked)}
                        className="form-checkbox text-yellow-600"
                      />
                      <span className="text-sm text-yellow-700">
                        Restrict to traders only
                      </span>
                    </label>
                    <p className="text-xs text-yellow-600 mt-1">
                      Only verified traders can see and purchase this item
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {hasChanges ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      You have unsaved changes
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      All changes saved
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !hasChanges}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Take Product Photo</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCameraCapture(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <MediaCapture
                onCapture={handleCameraCapture}
                onCancel={() => setShowCameraCapture(false)}
                captureMode="photo"
                showPreview={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={stockImages}
        initialIndex={viewerInitialIndex}
      />
    </div>
  );
}

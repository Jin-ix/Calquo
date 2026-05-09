import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useAuth } from '../auth/AuthProvider';
import { useCategories } from '../context/CategoryProvider';
import { 
  EnhancedStockItem, 
  ColorVariant, 
  SizeVariant, 
  StockCombination, 
  ItemSetType,
  SizeWithColors
} from './EnhancedStockTypes';
import { 
  X, Plus, Image as ImageIcon, Camera, Link, Palette, Ruler, 
  Package, Tag, Clock, Shirt, Settings, Upload, Eye, Info, Users, Shield
} from 'lucide-react';
import { MediaCapture } from '../camera/MediaCapture';
import { NewSizeInformationSection } from './NewSizeInformationSection';
import { SizeFirstStockForm } from './SizeFirstStockForm';
import { toast } from 'sonner';
import { stockAPI } from '../../utils/api';
import { useStock } from '../context/StockContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getRelevantHSNCodes, getDefaultHSNCode, apparelHSNCodes } from '../../utils/hsnCodes';

interface EnhancedAddStockFormProps {
  onSubmit: (stock: Omit<EnhancedStockItem, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
  initialData?: any; // For editing existing stock
  isEditing?: boolean;
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

// Convert standard sizes to SizeVariant format
const availableSizes: SizeVariant[] = standardSizes.map(size => ({
  id: `std-${size}`,
  name: size,
  displayName: size
}));



export function EnhancedAddStockForm({ onSubmit, onCancel, initialData, isEditing = false }: EnhancedAddStockFormProps) {
  const { user } = useAuth();
  const { categories, addCategory } = useCategories();
  const { addStock } = useStock();

  // Basic form data
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    hsnCode: initialData?.hsnCode || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    basePrice: initialData?.basePrice || '',
    singleShopPrice: initialData?.singleShopPrice || '',
    multiShopPrice: initialData?.multiShopPrice || '',
    minOrderQuantity: initialData?.minOrderQuantity || '',
    fabricType: initialData?.fabricType || '',
    fabricDescription: initialData?.fabricDescription || '',
    deliveryTime: initialData?.deliveryTime || ''
  });

  // Selling type state
  const [sellingType, setSellingType] = useState<'set' | 'flexible'>(initialData?.sellingType || 'set');
  
  // Customer selection for traders
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(initialData?.selectedCustomers || []);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  
  // Mock customer data - in a real app, this would come from an API
  const availableCustomers = [
    { id: 'cust_001', company: 'Fashion Forward Pvt Ltd', location: 'Mumbai, Maharashtra', gstNumber: '27ABCDE1234F1Z5' },
    { id: 'cust_002', company: 'Style Hub Retailers', location: 'Delhi, Delhi', gstNumber: '07FGHIJ5678K1L9' },
    { id: 'cust_003', company: 'Trendy Threads Co', location: 'Bangalore, Karnataka', gstNumber: '29MNOPQ9012R3S7' },
    { id: 'cust_004', company: 'Urban Wear Solutions', location: 'Chennai, Tamil Nadu', gstNumber: '33TUVWX3456Y7Z1' },
    { id: 'cust_005', company: 'Classic Clothing Ltd', location: 'Kolkata, West Bengal', gstNumber: '19ABCXY7890M1N5' },
    { id: 'cust_006', company: 'Modern Apparel House', location: 'Pune, Maharashtra', gstNumber: '27DEFGH2345P6Q8' },
    { id: 'cust_007', company: 'Elite Fashion Store', location: 'Hyderabad, Telangana', gstNumber: '36IJKLM6789R4S2' },
    { id: 'cust_008', company: 'Premium Garment Co', location: 'Ahmedabad, Gujarat', gstNumber: '24NOPRS4567T8U6' },
  ];

  // Product images state
  const [productImages, setProductImages] = useState<string[]>(() => {
    const images = initialData?.productImages || [];
    console.log('Initializing productImages with:', images);
    return images;
  });

  // Item set configuration
  const [itemSetType, setItemSetType] = useState<ItemSetType>(initialData?.itemSetType || 'set_of_pattern');
  const [flexibleSelectionAllowed, setFlexibleSelectionAllowed] = useState(initialData?.flexibleSelectionAllowed !== undefined ? initialData.flexibleSelectionAllowed : true);
  const [tradersOnly, setTradersOnly] = useState(initialData?.tradersOnly || false);

  // Size-first approach state
  const [sizeWithColors, setSizeWithColors] = useState<SizeWithColors[]>(initialData?.sizeWithColors || []);
  
  // Legacy state for backward compatibility (will be populated from sizeWithColors)
  const [colors, setColors] = useState<ColorVariant[]>(initialData?.colors || []);
  const [sizes, setSizes] = useState<SizeVariant[]>(initialData?.sizes || []);
  
  // Legacy color/size management (kept for non-size-first modes)
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [selectedPredefinedColor, setSelectedPredefinedColor] = useState('');
  const [newSizeName, setNewSizeName] = useState('');
  const [selectedStandardSizes, setSelectedStandardSizes] = useState<string[]>([]);
  
  // Individual Flex specific
  const [newQuantity, setNewQuantity] = useState<number>(0);

  // Category creation state
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fabric type creation state
  const [showFabricInput, setShowFabricInput] = useState(false);
  const [newFabricTypeName, setNewFabricTypeName] = useState('');
  const [fabricTypes, setFabricTypes] = useState([
    'Cotton', 'Polyester', 'Cotton Blend', 'Linen', 'Silk', 'Wool', 
    'Rayon', 'Viscose', 'Lycra', 'Spandex', 'Denim', 'Canvas',
    'Chiffon', 'Georgette', 'Crepe', 'Khadi', 'Jute', 'Bamboo',
    'Modal', 'Tencel', 'Nylon', 'Acrylic', 'Cashmere', 'Flannel'
  ]);

  // Combinations and quantities
  const [combinations, setCombinations] = useState<StockCombination[]>(initialData?.combinations || []);

  // Media management
  const [showMediaCapture, setShowMediaCapture] = useState(false);
  const [currentImageTarget, setCurrentImageTarget] = useState<{
    type: 'color' | 'combination';
    colorId?: string;
    combinationId?: string;
  } | null>(null);

  // Offer state
  const [hasOffer, setHasOffer] = useState(initialData?.hasOffer || false);
  const [offerData, setOfferData] = useState({
    offerPrice: initialData?.offerData?.offerPrice || '',
    offerType: (initialData?.offerData?.offerType as 'time' | 'quantity') || 'time',
    offerTimeWeeks: initialData?.offerData?.offerTimeWeeks || '',
    offerMinQuantity: initialData?.offerData?.offerMinQuantity || ''
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Auto-select appropriate HSN code when category changes
  useEffect(() => {
    if (formData.category && !formData.hsnCode) {
      const defaultHSN = getDefaultHSNCode(formData.category);
      setFormData(prev => ({ ...prev, hsnCode: defaultHSN }));
    }
  }, [formData.category]);

  // Customer selection handlers
  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomers.length === availableCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(availableCustomers.map(c => c.id));
    }
  };

  // Product image handling functions
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
        if (imageDataUrl && productImages.length < 10) {
          setProductImages(prev => [...prev, imageDataUrl]);
          toast.success('Image added successfully');
        } else if (productImages.length >= 10) {
          toast.error('Maximum 10 images allowed');
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  };

  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  // Sync size-first data with legacy arrays for backward compatibility
  React.useEffect(() => {
    // Extract unique sizes from sizeWithColors
    const uniqueSizes = sizeWithColors.map(swc => swc.size);
    setSizes(uniqueSizes);

    // Extract all colors from all sizes
    const allColors = sizeWithColors.flatMap(swc => swc.colors);
    // Remove duplicates based on color properties
    const uniqueColors = allColors.filter((color, index, arr) => 
      arr.findIndex(c => 
        c.name === color.name && 
        c.colorCode === color.colorCode && 
        c.patternImage === color.patternImage
      ) === index
    );
    setColors(uniqueColors);
  }, [sizeWithColors]);

  const addColor = () => {
    if (!newColorName.trim()) {
      toast.error('Please enter a color name');
      return;
    }

    const newColor: ColorVariant = {
      id: generateId(),
      name: newColorName.trim(),
      colorCode: newColorCode,
      images: []
    };

    setColors(prev => [...prev, newColor]);
    setNewColorName('');
    setNewColorCode('#000000');
    setSelectedPredefinedColor('');
    toast.success(`Color "${newColor.name}" added`);
  };

  const addPredefinedColor = () => {
    if (!selectedPredefinedColor) return;
    
    const predefined = predefinedColors.find(c => c.name === selectedPredefinedColor);
    if (!predefined) return;

    // Check if color already exists
    if (colors.some(c => c.name.toLowerCase() === predefined.name.toLowerCase())) {
      toast.error('Color already added');
      return;
    }

    const newColor: ColorVariant = {
      id: generateId(),
      name: predefined.name,
      colorCode: predefined.code,
      images: []
    };

    setColors(prev => [...prev, newColor]);
    setSelectedPredefinedColor('');
    toast.success(`Color "${newColor.name}" added`);
  };

  const removeColor = (colorId: string) => {
    setColors(prev => prev.filter(c => c.id !== colorId));
    // Remove related combinations
    setCombinations(prev => prev.filter(c => c.colorId !== colorId));
  };

  const addSize = () => {
    if (!newSizeName.trim()) {
      toast.error('Please enter a size name');
      return;
    }

    // Check if size already exists
    if (sizes.some(s => s.name.toLowerCase() === newSizeName.trim().toLowerCase())) {
      toast.error('Size already added');
      return;
    }

    const newSize: SizeVariant = {
      id: generateId(),
      name: newSizeName.trim(),
      displayName: newSizeName.trim()
    };

    setSizes(prev => [...prev, newSize]);
    setNewSizeName('');
    toast.success(`Size "${newSize.name}" added`);
  };

  const addStandardSizes = () => {
    const newSizes: SizeVariant[] = selectedStandardSizes
      .filter(sizeName => !sizes.some(s => s.name === sizeName))
      .map(sizeName => ({
        id: generateId(),
        name: sizeName,
        displayName: sizeName
      }));

    if (newSizes.length === 0) {
      toast.error('Selected sizes already added');
      return;
    }

    setSizes(prev => [...prev, ...newSizes]);
    setSelectedStandardSizes([]);
    toast.success(`${newSizes.length} size(s) added`);
  };

  const removeSize = (sizeId: string) => {
    setSizes(prev => prev.filter(s => s.id !== sizeId));
    // Remove related combinations
    setCombinations(prev => prev.filter(c => c.sizeId !== sizeId));
  };

  const generateCombinations = () => {
    const newCombinations: StockCombination[] = [];

    if (itemSetType === 'single_color' && colors.length > 0) {
      // One color, multiple sizes
      const color = colors[0];
      sizes.forEach(size => {
        newCombinations.push({
          id: generateId(),
          colorId: color.id,
          sizeId: size.id,
          quantity: 0,
          availableQuantity: 0,
          images: []
        });
      });
    } else if (itemSetType === 'set_of_pattern' && colors.length > 0 && sizes.length > 0) {
      // Multiple patterns, multiple sizes
      colors.forEach(color => {
        sizes.forEach(size => {
          newCombinations.push({
            id: generateId(),
            colorId: color.id,
            sizeId: size.id,
            quantity: 0,
            availableQuantity: 0,
            images: []
          });
        });
      });
    } else if (itemSetType === 'individual_flex') {
      // Individual combinations are already handled separately
      toast.error('Individual Flex combinations are added one by one using "Add Next Combination"');
      return;
    }

    setCombinations(newCombinations);
    toast.success(`${newCombinations.length} combinations generated`);
  };

  const updateCombinationQuantity = (combinationId: string, quantity: number) => {
    setCombinations(prev => prev.map(c => 
      c.id === combinationId 
        ? { ...c, quantity, availableQuantity: quantity }
        : c
    ));
  };

  const addImageToCombination = (combinationId: string, imageUrl: string) => {
    setCombinations(prev => prev.map(c =>
      c.id === combinationId
        ? { ...c, images: [...c.images, imageUrl] }
        : c
    ));
  };

  const addImageToColor = (colorId: string, imageUrl: string) => {
    setColors(prev => prev.map(c =>
      c.id === colorId
        ? { ...c, images: [...c.images, imageUrl] }
        : c
    ));
  };

  const handlePhotoCapture = (imageDataUrl: string) => {
    if (currentImageTarget?.type === 'color' && currentImageTarget.colorId) {
      addImageToColor(currentImageTarget.colorId, imageDataUrl);
    } else if (currentImageTarget?.type === 'combination' && currentImageTarget.combinationId) {
      addImageToCombination(currentImageTarget.combinationId, imageDataUrl);
    }
    setCurrentImageTarget(null);
    setShowMediaCapture(false);
  };

  const openImageCapture = (type: 'color' | 'combination', colorId?: string, combinationId?: string) => {
    setCurrentImageTarget({ type, colorId, combinationId });
    setShowMediaCapture(true);
  };

  // Category creation functions
  const handleCreateCategory = () => {
    setShowCategoryInput(true);
    setNewCategoryName('');
  };

  const handleCancelCategoryCreation = () => {
    setShowCategoryInput(false);
    setNewCategoryName('');
  };

  const handleSaveCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast.error('Please enter a category name');
      return;
    }

    const success = addCategory(trimmedName);
    if (success) {
      // Auto-select the newly created category
      setFormData(prev => ({ ...prev, category: trimmedName }));
      setShowCategoryInput(false);
      setNewCategoryName('');
    }
  };

  const handleCategoryInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveCategory();
    } else if (e.key === 'Escape') {
      handleCancelCategoryCreation();
    }
  };

  // Fabric type creation functions
  const handleCreateFabricType = () => {
    setShowFabricInput(true);
    setNewFabricTypeName('');
  };

  const handleCancelFabricCreation = () => {
    setShowFabricInput(false);
    setNewFabricTypeName('');
  };

  const handleSaveFabricType = () => {
    const trimmedName = newFabricTypeName.trim();
    if (!trimmedName) {
      toast.error('Please enter a fabric type name');
      return;
    }

    // Check if fabric type already exists
    if (fabricTypes.includes(trimmedName)) {
      toast.error('This fabric type already exists');
      return;
    }

    // Add new fabric type to the list
    setFabricTypes(prev => [...prev, trimmedName]);
    
    // Auto-select the newly created fabric type
    setFormData(prev => ({ ...prev, fabricType: trimmedName }));
    setShowFabricInput(false);
    setNewFabricTypeName('');
    
    toast.success(`Fabric type "${trimmedName}" added successfully`);
  };

  const handleFabricInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveFabricType();
    } else if (e.key === 'Escape') {
      handleCancelFabricCreation();
    }
  };

  const handleSaveDraft = async () => {
    // Minimal validation for draft
    if (!formData.name.trim()) {
      toast.error('Please enter a product name to save as draft');
      return;
    }

    // Calculate offer expiry date for time-based offers (same logic as submit)
    const calculateOfferExpiry = () => {
      if (hasOffer && offerData.offerType === 'time' && offerData.offerTimeWeeks) {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + (parseInt(offerData.offerTimeWeeks) * 7 * 24 * 60 * 60 * 1000));
        return expiryDate.toISOString();
      }
      return undefined;
    };

    const stockData = {
      name: formData.name.trim(),
      category: formData.category || 'Uncategorized',
      hsnCode: formData.hsnCode || (formData.category ? getDefaultHSNCode(formData.category) : ''),
      description: formData.description.trim() || undefined,
      supplier: user?.company || 'Unknown',
      supplierType: user?.role === 'manufacturer' ? 'manufacturer' as const : 'trader' as const,
      location: user?.profile?.address ? 
        `${user.profile.address.city}, ${user.profile.address.state}` : 
        formData.location?.trim() || 'Mumbai, Maharashtra',
      
      itemSetType,
      colors,
      sizes,
      combinations, // Save all combinations, even if quantity is 0
      flexibleSelectionAllowed,
      mainImages: productImages,
      productImages: productImages,
      sizeWithColors,
      
      basePrice: parseFloat(formData.basePrice) || 0,
      singleShopPrice: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : undefined,
      multiShopPrice: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : undefined,
      minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
      
      fabricType: formData.fabricType || undefined,
      fabricDescription: formData.fabricDescription.trim() || undefined,
      deliveryTime: formData.deliveryTime || undefined,
      tradersOnly,
      
      sellingType,
      
      ...(user?.role === 'trader' && {
        selectedCustomers,
        availableToCustomers: selectedCustomers
      }),
      
      hasOffer,
      ...(hasOffer && {
        offerData: {
          offerPrice: parseFloat(offerData.offerPrice) || 0,
          offerType: offerData.offerType,
          offerTimeWeeks: offerData.offerType === 'time' ? parseInt(offerData.offerTimeWeeks) : undefined,
          offerMinQuantity: offerData.offerType === 'quantity' ? parseInt(offerData.offerMinQuantity) : undefined,
          offerValidUntil: calculateOfferExpiry(),
          offerCreatedDate: new Date().toISOString()
        }
      }),

      status: 'draft' as const
    };

    try {
      const loadingToast = toast.loading('Saving draft...');
      // Cast to any to bypass strict type checking if status is missing in addStock signature yet
      const success = await addStock(stockData as any);
      toast.dismiss(loadingToast);

      if (success) {
        toast.success('Draft saved successfully');
        onSubmit(stockData);
      } else {
        toast.error('Failed to save draft');
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation for comprehensive variant upload system
    if (!formData.name.trim()) {
      toast.error('Please enter product name');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    if (!formData.minOrderQuantity || parseInt(formData.minOrderQuantity) <= 0) {
      toast.error('Please enter a valid minimum order quantity');
      return;
    }

    // Validate size-first approach
    if (sizeWithColors.length === 0) {
      toast.error('Please add at least one size using the Size Information section');
      return;
    }

    const hasAnyColors = sizeWithColors.some(swc => swc.colors.length > 0);
    if (!hasAnyColors) {
      toast.error('Please add at least one color or pattern to any size');
      return;
    }

    // Validate based on item set type
    if (itemSetType === 'single_color') {
      const totalColors = sizeWithColors.reduce((acc, swc) => acc + swc.colors.length, 0);
      if (totalColors !== 1) {
        toast.error('Single Color mode requires exactly one color across all sizes. Please use Mixed mode for multiple colors.');
        return;
      }
    }

    // Validate combinations exist and have valid quantities
    if (combinations.length === 0) {
      if (itemSetType === 'set_of_pattern') {
        toast.error('Please generate combinations using the "Generate All Combinations" button');
      } else if (itemSetType === 'individual_flex') {
        toast.error('Please add individual combinations using the "Add Next Combination" button');
      } else {
        toast.error('Please generate combinations first');
      }
      return;
    }

    // For all modes, ensure at least one combination has quantity > 0
    const activeCombinations = combinations.filter(c => c.quantity > 0);
    if (activeCombinations.length === 0) {
      if (itemSetType === 'set_of_pattern') {
        toast.error('Please set quantity for at least one pattern-size combination in the combinations table');
      } else if (itemSetType === 'individual_flex') {
        toast.error('Please set quantity for at least one individual combination');
      } else {
        toast.error('Please set quantity for at least one combination');
      }
      return;
    }

    // Validate pricing consistency
    if (formData.singleShopPrice && parseFloat(formData.singleShopPrice) < parseFloat(formData.basePrice)) {
      toast.error('Single shop price cannot be less than base price');
      return;
    }

    if (formData.multiShopPrice && parseFloat(formData.multiShopPrice) < parseFloat(formData.basePrice)) {
      toast.error('Multi shop price cannot be less than base price');
      return;
    }

    // Validate offer data if present
    if (hasOffer) {
      if (!offerData.offerPrice || parseFloat(offerData.offerPrice) <= 0) {
        toast.error('Please enter a valid offer price');
        return;
      }

      if (parseFloat(offerData.offerPrice) >= parseFloat(formData.basePrice)) {
        toast.error('Offer price must be less than base price');
        return;
      }

      if (offerData.offerType === 'time' && (!offerData.offerTimeWeeks || parseInt(offerData.offerTimeWeeks) <= 0)) {
        toast.error('Please enter valid offer duration in weeks');
        return;
      }

      if (offerData.offerType === 'quantity' && (!offerData.offerMinQuantity || parseInt(offerData.offerMinQuantity) <= 0)) {
        toast.error('Please enter valid minimum quantity for offer');
        return;
      }
    }

    // Validate customer selection for traders
    if (user?.role === 'trader' && selectedCustomers.length === 0) {
      toast.error('Please select at least one customer for this stock item');
      return;
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

    const stockData = {
      name: formData.name.trim(),
      category: formData.category,
      hsnCode: formData.hsnCode || getDefaultHSNCode(formData.category),
      description: formData.description.trim() || undefined,
      supplier: user?.company || 'Unknown',
      supplierType: user?.role === 'manufacturer' ? 'manufacturer' : 'trader',
      location: user?.profile?.address ? 
        `${user.profile.address.city}, ${user.profile.address.state}` : 
        formData.location?.trim() || 'Mumbai, Maharashtra',
      
      itemSetType,
      colors,
      sizes,
      combinations: activeCombinations,
      flexibleSelectionAllowed,
      mainImages: productImages, // Main product images for card display
      productImages: productImages, // Backup field
      sizeWithColors, // Size-first data structure
      
      basePrice: parseFloat(formData.basePrice),
      singleShopPrice: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : undefined,
      multiShopPrice: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : undefined,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      
      fabricType: formData.fabricType || undefined,
      fabricDescription: formData.fabricDescription.trim() || undefined,
      deliveryTime: formData.deliveryTime || undefined,
      tradersOnly,
      
      // Selling type
      sellingType,
      
      // Customer selection (only for traders)
      ...(user?.role === 'trader' && {
        selectedCustomers,
        availableToCustomers: selectedCustomers
      }),
      
      // Special offer data
      hasOffer,
      ...(hasOffer && {
        offerData: {
          offerPrice: parseFloat(offerData.offerPrice),
          offerType: offerData.offerType,
          offerTimeWeeks: offerData.offerType === 'time' ? parseInt(offerData.offerTimeWeeks) : undefined,
          offerMinQuantity: offerData.offerType === 'quantity' ? parseInt(offerData.offerMinQuantity) : undefined,
          offerValidUntil: calculateOfferExpiry(),
          offerCreatedDate: new Date().toISOString()
        }
      })
    };

    if (isEditing) {
      // When editing, let the parent handle the update logic
      onSubmit(stockData);
    } else {
      // When adding new stock, use the StockProvider
      try {
        // Show detailed loading toast based on the complexity of the item
        const combinationsCount = activeCombinations.length;
        const hasImages = productImages.length > 0;
        const loadingMessage = hasImages 
          ? `Adding stock item with ${combinationsCount} combinations and ${productImages.length} images...`
          : `Adding stock item with ${combinationsCount} combinations...`;
        
        const loadingToast = toast.loading(loadingMessage);
        
        // Log the data being sent for debugging
        console.log('Adding stock item:', {
          name: stockData.name,
          itemSetType: stockData.itemSetType,
          combinationsCount: activeCombinations.length,
          sizeWithColorsCount: stockData.sizeWithColors?.length || 0,
          hasImages: hasImages,
          hasOffer: stockData.hasOffer,
          supplier: stockData.supplier
        });
        
        // Use StockProvider to add stock (handles both backend and local state)
        const success = await addStock(stockData);
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (success) {
          // Show success message with details
          const successMessage = `Stock item "${stockData.name}" added successfully with ${combinationsCount} combinations!`;
          toast.success(successMessage, {
            duration: 5000
          });
          
          // Call the original onSubmit for any additional UI updates (like navigation)
          onSubmit(stockData);
        } else {
          toast.error('Failed to add stock item. Please check the form and try again.');
        }
      } catch (error) {
        console.error('Failed to add stock item:', error);
        
        // Provide specific error messages based on the error type
        if (error.message?.includes('timeout')) {
          toast.error('Request timed out. Your stock item may have been saved. Please check your stock list and try again if needed.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message?.includes('validation') || error.message?.includes('required')) {
          toast.error('Validation error: ' + error.message);
        } else {
          toast.error('Failed to add stock item. Please try again or contact support if the issue persists.');
        }
      }
    }
  };

  const getColorDisplay = (colorId: string) => {
    const color = colors.find(c => c.id === colorId);
    return color ? (
      <div className="flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded border border-gray-300"
          style={{ backgroundColor: color.colorCode }}
        />
        <span>{color.name}</span>
      </div>
    ) : 'Unknown Color';
  };

  const getSizeDisplay = (sizeId: string) => {
    const size = sizes.find(s => s.id === sizeId);
    return size?.displayName || 'Unknown Size';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Stock Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Product Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cotton T-Shirt"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        disabled={showCategoryInput}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCreateCategory}
                        disabled={showCategoryInput}
                        title="Create new category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {showCategoryInput && (
                      <div className="flex gap-2 items-center p-3 bg-muted/50 rounded-lg border">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={handleCategoryInputKeyPress}
                          placeholder="Enter new category name..."
                          className="flex-1"
                          autoFocus
                          maxLength={50}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelCategoryCreation}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hsnCode">HSN Code</Label>
                    <Select 
                      value={formData.hsnCode} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, hsnCode: value }))}
                    >
                      <SelectTrigger>
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
                    <p className="text-xs text-muted-foreground">
                      HSN code is required for GST compliance. Select the most appropriate code for your product.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      value={formData.minOrderQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, minOrderQuantity: e.target.value }))}
                      placeholder="Minimum order quantity"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description, material, special features..."
                    rows={3}
                  />
                </div>

                {/* Product Images Section */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Product Images ({productImages.length}/10)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add high-quality images of your product. First image will be the main display image.
                      </p>
                    </div>
                    <Badge variant={productImages.length >= 3 ? "default" : "outline"}>
                      {productImages.length < 3 ? `Add ${3 - productImages.length} more` : `${productImages.length} images added`}
                    </Badge>
                  </div>

                  {/* Image Upload Input */}
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
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
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Click to upload images</p>
                        <p className="text-sm text-muted-foreground">
                          Support PNG, JPG, JPEG (Max 5MB per image)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Display uploaded images */}
                  {productImages.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Uploaded Images:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {productImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                              <ImageWithFallback
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {index === 0 && (
                              <Badge 
                                className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5"
                                variant="default"
                              >
                                Main
                              </Badge>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeProductImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {productImages.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Drag images to reorder. The first image will be used as the main product image.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Size Information Section */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Size Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure your product variations, colors, sizes, and stock quantities. 
                  All quantity management is handled here.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Configuration Summary */}
                {(colors.length > 0 || sizes.length > 0 || combinations.length > 0) && (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg">
                    <h4 className="font-medium text-emerald-900 mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Configuration Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-emerald-700">{colors.length}</div>
                        <div className="text-emerald-600">Colors</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-700">{sizes.length}</div>
                        <div className="text-blue-600">Sizes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-700">{combinations.filter(c => c.quantity > 0).length}</div>
                        <div className="text-purple-600">Active Combinations</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Choose Item Set Type */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Choose Item Set Type</Label>
                  <RadioGroup value={itemSetType} onValueChange={(value: ItemSetType) => {
                    // Reset related state when changing item set type
                    setItemSetType(value);
                    setColors([]);
                    setSizes([]);
                    setCombinations([]);
                    setNewColorName('');
                    setNewColorCode('#000000');
                    setSelectedPredefinedColor('');
                    setNewSizeName('');
                    setSelectedStandardSizes([]);
                    setNewQuantity(0);
                    toast.info(`Switched to ${value.replace('_', ' ')} mode. Please set up colors and sizes again.`);
                  }} className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background/50">
                      <RadioGroupItem value="set_of_pattern" id="set_of_pattern" className="mt-1" />
                      <Label htmlFor="set_of_pattern" className="cursor-pointer flex-1">
                        <div className="font-medium">Set of Pattern</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Create sets where each set includes a pattern/color name with uploaded image, checkboxes to select sizes, and quantity field. Users can add multiple patterns.
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background/50">
                      <RadioGroupItem value="single_color" id="single_color" className="mt-1" />
                      <Label htmlFor="single_color" className="cursor-pointer flex-1">
                        <div className="font-medium">Set of Sizes</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Create sets where each set contains a group of selected sizes with one color/image only and quantity field. Additional size sets can be added.
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background/50">
                      <RadioGroupItem value="individual_flex" id="individual_flex" className="mt-1" />
                      <Label htmlFor="individual_flex" className="cursor-pointer flex-1">
                        <div className="font-medium">Flexible</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Add one size and one color/image at a time with quantity input. Each combination appears as a row in a table with edit/delete options.
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Size-First Stock Form */}
                <SizeFirstStockForm
                  itemSetType={itemSetType}
                  sizeWithColors={sizeWithColors}
                  setSizeWithColors={setSizeWithColors}
                  combinations={combinations}
                  setCombinations={setCombinations}
                  availableSizes={availableSizes}
                />
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selling Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Selling Type</Label>
                  <RadioGroup 
                    value={sellingType} 
                    onValueChange={(value: 'set' | 'flexible') => setSellingType(value)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-background/50">
                      <RadioGroupItem value="set" id="set" className="mt-1" />
                      <Label htmlFor="set" className="cursor-pointer flex-1">
                        <div className="font-medium text-primary">Set Pricing</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Fixed prices that cannot be negotiated by customers
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-background/50">
                      <RadioGroupItem value="flexible" id="flexible" className="mt-1" />
                      <Label htmlFor="flexible" className="cursor-pointer flex-1">
                        <div className="font-medium text-primary">Flexible Pricing</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Allows price negotiations and bulk discounts
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />

                {/* Price Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price per piece (₹)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="Base price"
                      min="0"
                      required
                    />
                    {sellingType === 'flexible' && (
                      <p className="text-xs text-muted-foreground">
                        Starting price for negotiations
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="singleShopPrice">Single Shop Price (₹)</Label>
                    <Input
                      id="singleShopPrice"
                      type="number"
                      step="0.01"
                      value={formData.singleShopPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, singleShopPrice: e.target.value }))}
                      placeholder="Optional"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Special price for single shop owners
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="multiShopPrice">Multi Shop Price (₹)</Label>
                    <Input
                      id="multiShopPrice"
                      type="number"
                      step="0.01"
                      value={formData.multiShopPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, multiShopPrice: e.target.value }))}
                      placeholder="Optional"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Special price for multi-shop owners
                    </p>
                  </div>
                </div>

                {/* Flexible Pricing Additional Info */}
                {sellingType === 'flexible' && (
                  <div className="bg-pastel-blue/30 p-4 rounded-lg border border-pastel-blue-border">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-pastel-blue-text/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="h-3 w-3 text-pastel-blue-text" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-pastel-blue-text">Flexible Pricing Benefits</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-blue-text"></div>
                            Customers can request price negotiations
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-blue-text"></div>
                            Automatic bulk discount calculations
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-blue-text"></div>
                            Higher visibility in search results
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fabric Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="h-5 w-5" />
                  Fabric Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fabricType">Fabric Type</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.fabricType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, fabricType: value }))}
                        disabled={showFabricInput}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select fabric type" />
                        </SelectTrigger>
                        <SelectContent>
                          {fabricTypes.map(fabric => (
                            <SelectItem key={fabric} value={fabric}>{fabric}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCreateFabricType}
                        disabled={showFabricInput}
                        title="Create new fabric type"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {showFabricInput && (
                      <div className="flex gap-2 items-center p-3 bg-muted/50 rounded-lg border">
                        <Input
                          value={newFabricTypeName}
                          onChange={(e) => setNewFabricTypeName(e.target.value)}
                          onKeyDown={handleFabricInputKeyPress}
                          placeholder="Enter new fabric type name..."
                          className="flex-1"
                          autoFocus
                          maxLength={50}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveFabricType}
                          disabled={!newFabricTypeName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelFabricCreation}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Expected Delivery Time</Label>
                    <Select 
                      value={formData.deliveryTime} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryTime: value }))}
                    >
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

                <div className="space-y-2">
                  <Label htmlFor="fabricDescription">Fabric Description</Label>
                  <Textarea
                    id="fabricDescription"
                    value={formData.fabricDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, fabricDescription: e.target.value }))}
                    placeholder="Describe fabric properties, care instructions, comfort level..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Traders Only Option */}
            {user?.role === 'manufacturer' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Traders Only</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this item available only for trader accounts
                      </p>
                    </div>
                    <Switch
                      checked={tradersOnly}
                      onCheckedChange={setTradersOnly}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Selection for Traders */}
            {user?.role === 'trader' && (
              <Card className="bg-gradient-to-br from-pastel-green/30 to-pastel-teal/30 border-pastel-green-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pastel-green-text" />
                    Customer Selection
                    <Badge variant="secondary" className="ml-2 bg-pastel-green/50 text-pastel-green-text">
                      Trader Feature
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select which customers can see and purchase this stock item. This helps you manage your exclusive offerings.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-pastel-green-border">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="selectAll"
                        checked={selectedCustomers.length === availableCustomers.length}
                        onCheckedChange={handleSelectAllCustomers}
                      />
                      <Label htmlFor="selectAll" className="font-medium">
                        Select All Customers ({selectedCustomers.length}/{availableCustomers.length})
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllCustomers(!showAllCustomers)}
                    >
                      {showAllCustomers ? 'Show Less' : 'Show All'}
                    </Button>
                  </div>

                  {/* Selected Customers Summary */}
                  {selectedCustomers.length > 0 && !showAllCustomers && (
                    <div className="bg-pastel-green/20 p-3 rounded-lg border border-pastel-green-border">
                      <h4 className="font-medium text-pastel-green-text mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Selected Customers ({selectedCustomers.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedCustomers.slice(0, 4).map(customerId => {
                          const customer = availableCustomers.find(c => c.id === customerId);
                          return customer ? (
                            <div key={customerId} className="text-sm bg-white/70 p-2 rounded border">
                              <div className="font-medium truncate">{customer.company}</div>
                              <div className="text-xs text-muted-foreground">{customer.location}</div>
                            </div>
                          ) : null;
                        })}
                        {selectedCustomers.length > 4 && (
                          <div className="text-sm bg-white/70 p-2 rounded border flex items-center justify-center text-muted-foreground">
                            +{selectedCustomers.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer List */}
                  {showAllCustomers && (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {availableCustomers.map(customer => (
                        <div key={customer.id} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-gray-200 hover:border-pastel-green-border transition-colors">
                          <Checkbox
                            id={`customer-${customer.id}`}
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={() => handleCustomerToggle(customer.id)}
                            className="mt-1"
                          />
                          <Label htmlFor={`customer-${customer.id}`} className="cursor-pointer flex-1">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">{customer.company}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-4">
                                  <span>📍 {customer.location}</span>
                                  <span>🏛️ {customer.gstNumber}</span>
                                </div>
                              </div>
                              {selectedCustomers.includes(customer.id) && (
                                <Badge variant="secondary" className="bg-pastel-green/50 text-pastel-green-text">
                                  Selected
                                </Badge>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selection Info */}
                  <div className="bg-pastel-blue/20 p-3 rounded-lg border border-pastel-blue-border">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-pastel-blue-text/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="h-3 w-3 text-pastel-blue-text" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-pastel-blue-text mb-1">Customer Selection Benefits</p>
                        <ul className="text-gray-700 space-y-1">
                          <li>• Control who can see your exclusive stock items</li>
                          <li>• Build stronger relationships with preferred customers</li>
                          <li>• Manage inventory distribution strategically</li>
                          <li>• Offer special deals to selected partners</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Offer Prices Section */}
            <Card className="bg-gradient-to-br from-pastel-orange/30 to-pastel-yellow/30 border-pastel-orange-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-pastel-orange-text" />
                  Offer Prices (Optional)
                  <Badge variant="secondary" className="ml-2 bg-pastel-orange/50 text-pastel-orange-text">
                    Promotional
                  </Badge>
                  <Switch
                    checked={hasOffer}
                    onCheckedChange={setHasOffer}
                    className="ml-auto"
                  />
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create special promotional pricing to attract more customers and boost sales.
                </p>
              </CardHeader>
              {hasOffer && (
                <CardContent className="space-y-6">
                  {/* Offer Price and Discount Calculation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offerPrice">Offer Price (₹)</Label>
                      <Input
                        id="offerPrice"
                        type="number"
                        step="0.01"
                        value={offerData.offerPrice}
                        onChange={(e) => setOfferData(prev => ({ ...prev, offerPrice: e.target.value }))}
                        placeholder="Discounted price"
                        min="0"
                        required={hasOffer}
                      />
                      {formData.basePrice && offerData.offerPrice && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary" className="bg-pastel-green/50 text-pastel-green-text">
                            {Math.round(((parseFloat(formData.basePrice) - parseFloat(offerData.offerPrice)) / parseFloat(formData.basePrice)) * 100)}% OFF
                          </Badge>
                          <span className="text-muted-foreground">
                            Save ₹{(parseFloat(formData.basePrice) - parseFloat(offerData.offerPrice)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Offer Type</Label>
                      <RadioGroup 
                        value={offerData.offerType} 
                        onValueChange={(value: 'time' | 'quantity') => setOfferData(prev => ({ ...prev, offerType: value }))}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background/50">
                          <RadioGroupItem value="time" id="time" className="mt-1" />
                          <Label htmlFor="time" className="cursor-pointer flex-1">
                            <div className="font-medium">Time-limited Offer</div>
                            <div className="text-sm text-muted-foreground">
                              Offer expires after specified weeks
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-background/50">
                          <RadioGroupItem value="quantity" id="quantity" className="mt-1" />
                          <Label htmlFor="quantity" className="cursor-pointer flex-1">
                            <div className="font-medium">Bulk Purchase Offer</div>
                            <div className="text-sm text-muted-foreground">
                              Offer applies to minimum quantity orders
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {offerData.offerType === 'time' && (
                      <div className="space-y-2">
                        <Label htmlFor="offerTimeWeeks">Offer Duration (weeks)</Label>
                        <Input
                          id="offerTimeWeeks"
                          type="number"
                          value={offerData.offerTimeWeeks}
                          onChange={(e) => setOfferData(prev => ({ ...prev, offerTimeWeeks: e.target.value }))}
                          placeholder="Duration in weeks"
                          min="1"
                          required={hasOffer && offerData.offerType === 'time'}
                        />
                        {offerData.offerTimeWeeks && (
                          <p className="text-xs text-muted-foreground">
                            Offer expires on: {new Date(Date.now() + (parseInt(offerData.offerTimeWeeks) * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {offerData.offerType === 'quantity' && (
                      <div className="space-y-2">
                        <Label htmlFor="offerMinQuantity">Minimum Quantity for Offer</Label>
                        <Input
                          id="offerMinQuantity"
                          type="number"
                          value={offerData.offerMinQuantity}
                          onChange={(e) => setOfferData(prev => ({ ...prev, offerMinQuantity: e.target.value }))}
                          placeholder="Minimum quantity for offer"
                          min="1"
                          required={hasOffer && offerData.offerType === 'quantity'}
                        />
                        <p className="text-xs text-muted-foreground">
                          Customers must order at least this quantity to get the offer price
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Offer Benefits */}
                  <div className="bg-pastel-orange/20 p-4 rounded-lg border border-pastel-orange-border">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-pastel-orange-text/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Tag className="h-3 w-3 text-pastel-orange-text" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-pastel-orange-text">Offer Price Benefits</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-orange-text"></div>
                            Attract more customers with competitive pricing
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-orange-text"></div>
                            Higher visibility in search and browse results
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-orange-text"></div>
                            Clear discount badges shown to customers
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-pastel-orange-text"></div>
                            Automatic expiry management and notifications
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                <Package className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Stock Item' : 'Add Stock Item'}
              </Button>
              {!isEditing && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleSaveDraft}
                  className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Media Capture Modal */}
      <MediaCapture
        isOpen={showMediaCapture}
        onClose={() => {
          setShowMediaCapture(false);
          setCurrentImageTarget(null);
        }}
        onCapturePhoto={handlePhotoCapture}
        onCaptureVideo={() => {}} // Not used for stock images
      />
    </div>
  );
}

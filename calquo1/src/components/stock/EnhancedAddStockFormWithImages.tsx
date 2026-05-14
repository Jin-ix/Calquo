import React, { useState, useMemo, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ColorPatternInput, ColorOrPattern } from '../ui/color-pattern-input';
import { ColorInput } from '../ui/color-input';
import { ImageUpload } from '../ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useAuth } from '../auth/AuthProvider';
import { useCategories } from '../context/CategoryProvider';
import { StockItem } from './StockCard';
import { X, Plus, Upload, Download, Clock, Tag, Calendar, ShoppingCart, Shirt, PlusCircle, Package, Palette, Ruler, Grid, File, IndianRupee, Info, Sparkles, Edit, CheckCircle, ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { AutoGenerateCombos } from './AutoGenerateCombos';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';
import { getRelevantHSNCodes, getDefaultHSNCode, apparelHSNCodes } from '../../utils/hsnCodes';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { firebaseAuth, firebaseStorage } from '../../utils/firebase/config';
import { ref, uploadBytes, getDownloadURL } from '../../utils/firebase/storage';
import { addDocument } from '../../utils/firebase/firestore';


interface AddStockFormProps {
  onSubmit: (stock: Omit<StockItem, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
}

interface Variant {
  colorOrPattern: ColorOrPattern;
  size: string;
  quantity: number;
  // Legacy support for backward compatibility
  color?: string;
  imageUrl?: string;
}

interface ColorFirstVariant {
  colorOrPattern: ColorOrPattern;
  sizes: string[];
  quantity: number;
  // Legacy support for backward compatibility
  color?: string;
  imageUrl?: string;
}

interface SizeFirstVariant {
  size: string;
  colorOrPatterns: ColorOrPattern[];
  quantity: number;
  // Legacy support for backward compatibility
  colors?: string[];
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

export function EnhancedAddStockFormWithImages({ onSubmit, onCancel }: AddStockFormProps) {
  const { user } = useAuth();
  const { categories, addCategory } = useCategories();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    hsnCode: '',
    price: '',
    mrp: '',
    singleShopPrice: '',
    multiShopPrice: '',
    minOrderQuantity: '',
    description: '',
    fabricType: '',
    fabricDescription: '',
    deliveryTime: '',
    itemCode: '',
    unitOfMeasure: 'PCS',
    batchCode: ''
  });

  // Image management state
  const [productImages, setProductImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

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

  // Unit mode state - Individual vs Bulk
  const [unitMode, setUnitMode] = useState<'individual' | 'bulk'>('individual');

  // Define units by mode
  const individualUnits = [
    { value: 'PCS', label: 'PCS (Pieces)', description: 'Individual items' },
    { value: 'SET', label: 'SET (Sets)', description: 'Coordinated sets' },
    { value: 'PAIR', label: 'PAIR (Pairs)', description: 'Matched pairs' },
    { value: 'MTR', label: 'MTR (Meters)', description: 'Fabric by length' },
    { value: 'YRD', label: 'YRD (Yards)', description: 'Fabric by length' },
    { value: 'KG', label: 'KG (Kilograms)', description: 'By weight' }
  ];

  const bulkUnits = [
    { value: 'DOZ', label: 'DOZ (Dozen - 12 pcs)', description: 'Small bulk packs' },
    { value: 'GRS', label: 'GRS (Gross - 144 pcs)', description: 'Large bulk packs' },
    { value: 'BAG', label: 'BAG (Bags)', description: 'Bagged stock' },
    { value: 'BOX', label: 'BOX (Boxes)', description: 'Boxed shipments' },
    { value: 'CTN', label: 'CTN (Cartons)', description: 'Carton packs' },
    { value: 'ROLL', label: 'ROLL (Fabric Rolls)', description: 'Complete rolls' },
    { value: 'BOL', label: 'BOL (Bales)', description: 'Raw material bales' }
  ];

  const allUnits = [...individualUnits, ...bulkUnits];

  // Get current units based on mode
  const currentModeUnits = unitMode === 'individual' ? individualUnits : bulkUnits;

  // Check if current unit matches mode
  const isUnitMismatch = () => {
    if (!formData.unitOfMeasure) return false;
    const individualUnitValues = individualUnits.map(u => u.value);
    const bulkUnitValues = bulkUnits.map(u => u.value);

    if (unitMode === 'individual' && bulkUnitValues.includes(formData.unitOfMeasure)) {
      return true;
    }
    if (unitMode === 'bulk' && individualUnitValues.includes(formData.unitOfMeasure)) {
      return true;
    }
    return false;
  };

  // Auto-select appropriate HSN code when category changes
  React.useEffect(() => {
    if (formData.category && !formData.hsnCode) {
      const defaultHSN = getDefaultHSNCode(formData.category);
      setFormData(prev => ({ ...prev, hsnCode: defaultHSN }));
    }
  }, [formData.category]);

  // Auto-generate Item Code on component mount
  React.useEffect(() => {
    if (!formData.itemCode) {
      const prefix = formData.category ? formData.category.substring(0, 1).toUpperCase() : 'G';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `${prefix}${randomNum}`;
      setFormData(prev => ({ ...prev, itemCode: generatedCode }));
    }
  }, [formData.category, formData.itemCode]);

  // Auto-adjust unit when mode changes
  React.useEffect(() => {
    if (isUnitMismatch()) {
      // Suggest default unit for the new mode
      const defaultUnit = unitMode === 'individual' ? 'PCS' : 'DOZ';
      toast.warning(`Unit "${formData.unitOfMeasure}" doesn't match ${unitMode} mode. Consider switching to "${defaultUnit}".`);
    }
  }, [unitMode, formData.unitOfMeasure]);

  // Selling type state
  const [sellingType, setSellingType] = useState<'set' | 'individual'>('individual');

  // Bulk selling mode state - for bulk units only
  const [bulkSellingMode, setBulkSellingMode] = useState<'pieces' | 'bulksets'>('bulksets');

  // Trader-only state
  const [tradersOnly, setTradersOnly] = useState(false);
  const [selectedTraders, setSelectedTraders] = useState<string[]>([]);

  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [preparedStockItem, setPreparedStockItem] = useState<Omit<StockItem, 'id' | 'dateAdded'> | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Firebase submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock preferred traders list - in real app, this would come from user's profile or API
  const preferredTraders = [
    { id: 'trader_001', name: 'Mumbai Textile Traders', gst: 'GST001' },
    { id: 'trader_002', name: 'Delhi Fashion Hub', gst: 'GST002' },
    { id: 'trader_003', name: 'Chennai Cotton Works', gst: 'GST003' },
    { id: 'trader_004', name: 'Kolkata Silk Merchants', gst: 'GST004' },
    { id: 'trader_005', name: 'Bangalore Apparel Co.', gst: 'GST005' },
    { id: 'trader_006', name: 'Ahmedabad Fabric House', gst: 'GST006' }
  ];

  // Variant Upload Mode states
  const [variantMode, setVariantMode] = useState<VariantMode>('color-first');
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('each-variant');
  const [colorFirstVariants, setColorFirstVariants] = useState<ColorFirstVariant[]>([
    {
      colorOrPattern: { type: 'color', value: '#FF6B6B', name: 'Color #FF6B6B' },
      sizes: [],
      quantity: 0
    }
  ]);
  const [sizeFirstVariants, setSizeFirstVariants] = useState<SizeFirstVariant[]>([
    { size: '', colorOrPatterns: [], colors: [], quantity: 0 }
  ]);
  const [mixedVariants, setMixedVariants] = useState<Variant[]>([
    {
      colorOrPattern: { type: 'color', value: '#4ECDC4', name: 'Color #4ECDC4' },
      size: '',
      quantity: 0
    }
  ]);

  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState({
    color: '',
    size: '',
    quantity: '',
    imageUrl: ''
  });
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  // Custom size management
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState('');

  // Handle auto-generated combos
  const handleCombosGenerated = (combos: any[]) => {
    // Convert combos to color-first variants
    const combosByColor = new Map();

    combos.forEach(combo => {
      const colorKey = `${combo.color.type}-${combo.color.value}`;

      if (!combosByColor.has(colorKey)) {
        combosByColor.set(colorKey, {
          colorOrPattern: combo.color,
          sizes: [],
          quantity: 0
        });
      }

      const colorGroup = combosByColor.get(colorKey);
      if (!colorGroup.sizes.includes(combo.size)) {
        colorGroup.sizes.push(combo.size);
      }
      colorGroup.quantity += combo.quantity;
    });

    const newVariants = Array.from(combosByColor.values());
    setColorFirstVariants(newVariants);
    setVariantMode('color-first');

    toast.success(`Applied ${combos.length} auto-generated combinations to variants`);
  };

  // Stable reference counter to prevent infinite loops
  const computationCountRef = useRef(0);

  // Get normalized variants for preview - MEMOIZED VERSION with loop protection
  const normalizedVariants = useMemo((): Variant[] => {
    // Safety check to prevent infinite computation loops
    computationCountRef.current += 1;
    if (computationCountRef.current > 100) {
      console.warn('Too many normalizedVariants calculations, using empty result to prevent infinite loop');
      return [];
    }

    try {
      switch (variantMode) {
        case 'color-first':
          return colorFirstVariants
            .filter(cv => cv && (cv.colorOrPattern?.value || cv.color) && Array.isArray(cv.sizes) && cv.sizes.length > 0)
            .flatMap(cv =>
              cv.sizes.map(size => ({
                colorOrPattern: cv.colorOrPattern || {
                  type: 'color' as const,
                  value: cv.color || '#FF6B6B',
                  name: `Color ${cv.color || '#FF6B6B'}`
                },
                size: size || '',
                quantity: cv.quantity || 0,
                // Legacy support - ensure color is never undefined
                color: cv.colorOrPattern?.type === 'color' ? cv.colorOrPattern.value : (cv.color || 'Default'),
                imageUrl: cv.colorOrPattern?.type === 'pattern' ? cv.colorOrPattern.value : cv.imageUrl
              }))
            )
            .filter(v => (v.colorOrPattern?.value || v.color) && v.size && v.size.trim && v.size.trim() && v.quantity > 0);

        case 'size-first':
          return sizeFirstVariants
            .filter(sv => sv && sv.size && (
              (Array.isArray(sv.colorOrPatterns) && sv.colorOrPatterns.length > 0) ||
              (Array.isArray(sv.colors) && sv.colors.length > 0)
            ))
            .flatMap(sv => {
              // Handle new colorOrPatterns structure
              if (sv.colorOrPatterns && sv.colorOrPatterns.length > 0) {
                return sv.colorOrPatterns.map(colorOrPattern => ({
                  colorOrPattern: colorOrPattern,
                  size: sv.size || '',
                  quantity: sv.quantity || 0,
                  // Legacy support
                  color: colorOrPattern.type === 'color' ? colorOrPattern.value : 'Default',
                  imageUrl: colorOrPattern.type === 'pattern' ? colorOrPattern.value : sv.imageUrl
                }));
              }
              // Handle legacy colors structure for backward compatibility
              else if (sv.colors && sv.colors.length > 0) {
                return sv.colors.map(color => ({
                  colorOrPattern: {
                    type: 'color' as const,
                    value: color,
                    name: `Color ${color}`
                  },
                  size: sv.size || '',
                  quantity: sv.quantity || 0,
                  // Legacy support
                  color: color || 'Default',
                  imageUrl: sv.imageUrl
                }));
              }
              return [];
            })
            .filter(v => (v.colorOrPattern?.value || v.color) && v.size.trim() && v.quantity > 0);

        case 'mixed':
          return mixedVariants
            .filter(v => v && (v.colorOrPattern?.value || v.color) && v.size && v.quantity > 0)
            .map(v => ({
              colorOrPattern: v.colorOrPattern || {
                type: 'color' as const,
                value: v.color || '#000000',
                name: `Color ${v.color || '#000000'}`
              },
              size: v.size || '',
              quantity: v.quantity || 0,
              // Legacy support - ensure color is never undefined
              color: v.colorOrPattern?.type === 'color' ? v.colorOrPattern.value : (v.color || 'Default'),
              imageUrl: v.imageUrl
            }))
            .filter(v => v.color.trim() && v.size.trim());

        default:
          return [];
      }
    } catch (error) {
      console.error('Error normalizing variants:', error);
      return [];
    }
  }, [variantMode, JSON.stringify(colorFirstVariants), JSON.stringify(sizeFirstVariants), JSON.stringify(mixedVariants)]);

  // Reset computation counter periodically to allow normal operation
  React.useEffect(() => {
    const resetTimer = setTimeout(() => {
      computationCountRef.current = 0;
    }, 1000);
    return () => clearTimeout(resetTimer);
  }, [normalizedVariants.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If in review mode, proceed with actual submission
    if (isReviewMode && preparedStockItem) {
      handleFinalSubmit();
      return;
    }

    // Otherwise, prepare for review
    try {
      // Enhanced form validation
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

      // Validate images - at least one image is required
      if (productImages.length === 0) {
        toast.error('Please add at least one product image.');
        return;
      }

      // Validate variants - FIXED VERSION
      if (normalizedVariants.length === 0) {
        toast.error('Please add at least one variant with both color and size specified.');
        return;
      }

      // Additional validation for variant data completeness
      const incompleteVariants = normalizedVariants.filter(v =>
        (!v.colorOrPattern?.value && !v.color) || !v.size || v.quantity <= 0
      );
      if (incompleteVariants.length > 0) {
        toast.error('All variants must have color/pattern, size, and quantity greater than 0.');
        return;
      }

      // Validate pricing options
      if (formData.singleShopPrice && parseFloat(formData.singleShopPrice) <= 0) {
        toast.error('Single shop price must be a valid positive number.');
        return;
      }

      if (formData.multiShopPrice && parseFloat(formData.multiShopPrice) <= 0) {
        toast.error('Multi shop price must be a valid positive number.');
        return;
      }

      // Validate traders selection if traders only is enabled
      if (tradersOnly && selectedTraders.length === 0) {
        toast.error('Please select at least one trader from your preferred supplier list.');
        return;
      }

      // Validate selling type logic - provide helpful feedback for set purchases
      if (sellingType === 'set' && normalizedVariants.length === 1) {
        toast.warning('Note: You have selected "Selling only as Set" but only have one variant. Consider adding more variants or switching to "Individual Flex" mode.');
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

      // Warn about missing batch code
      if (!formData.batchCode) {
        toast.warning('Batch code is not specified. Consider adding it for better inventory tracking.');
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

      // FIXED: Safe array access with fallback
      const mainVariant = normalizedVariants.length > 0 ? normalizedVariants[0] : {
        colorOrPattern: { type: 'color' as const, value: '#000000', name: 'Default' },
        size: '',
        quantity: 0,
        color: ''
      };
      const totalQuantity = normalizedVariants.length > 0 ? (
        quantityMode === 'total-across'
          ? normalizedVariants.reduce((sum, v) => sum + v.quantity, 0) / normalizedVariants.length
          : normalizedVariants.reduce((sum, v) => sum + v.quantity, 0)
      ) : 0;

      const stockItem: Omit<StockItem, 'id' | 'dateAdded'> = {
        name: formData.name,
        category: formData.category,
        hsnCode: formData.hsnCode || getDefaultHSNCode(formData.category),
        size: mainVariant.size || 'One Size',
        color: mainVariant.colorOrPattern?.type === 'color' ? mainVariant.colorOrPattern.value : (mainVariant.color || 'Default'),
        quantity: Math.floor(totalQuantity),
        price: parseFloat(formData.price),
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        singleShopPrice: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : undefined,
        multiShopPrice: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : undefined,
        supplier: user?.company || 'Unknown',
        supplierType: user?.role === 'manufacturer' ? 'manufacturer' : 'trader',
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        description: formData.description,
        fabricType: formData.fabricType,
        fabricDescription: formData.fabricDescription,
        deliveryTime: formData.deliveryTime ? formData.deliveryTime as '5-10 days' | '10-20 days' | 'more than 1 month' : undefined,
        itemCode: formData.itemCode,
        unitOfMeasure: formData.unitOfMeasure,
        unitMode: unitMode,
        batchCode: formData.batchCode || undefined,
        images: productImages, // Use product images instead of variant images
        mainImageIndex: mainImageIndex, // Store main image index
        variants: normalizedVariants,
        variantMode,
        quantityMode,
        sellingType: sellingType,
        tradersOnly: tradersOnly,
        selectedTraders: tradersOnly ? selectedTraders : [],
        ...(hasOffer && {
          offerPrice: parseFloat(offerData.offerPrice),
          offerType: offerData.offerType,
          offerTimeWeeks: offerData.offerType === 'time' ? parseInt(offerData.offerTimeWeeks) : undefined,
          offerMinQuantity: offerData.offerType === 'quantity' ? parseInt(offerData.offerMinQuantity) : undefined,
          offerValidUntil: calculateOfferExpiry(),
          offerCreatedDate: new Date().toISOString()
        })
      };

      // Save for review and switch to review mode
      setPreparedStockItem(stockItem);
      setIsReviewMode(true);

      // Scroll to top to show review
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      toast.success('Form validated! Please review your details below.', {
        description: 'You can edit any section before final submission.'
      });
    } catch (error) {
      console.error('Error preparing stock form:', error);
      toast.error('An error occurred while preparing the form. Please try again.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!preparedStockItem || !user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      toast.loading('Uploading images and saving stock to Supabase...', { id: 'submit-stock' });

      // Upload images to Supabase Storage (via shim)
      const uploadedImageUrls: string[] = [];

      if (productImages.length > 0) {
        console.log(`📤 Uploading ${productImages.length} images to Supabase Storage...`);

        for (let i = 0; i < productImages.length; i++) {
          const imageUrl = productImages[i];

          // Skip if already a Firebase URL
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            uploadedImageUrls.push(imageUrl);
            continue;
          }

          try {
            // Convert base64/blob URL to blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Create unique filename
            const timestamp = Date.now();
            const fileName = `${timestamp}_${i}_${formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
            const storagePath = `stock-images/${user.id}/${fileName}`;

            // Upload to Firebase Storage
            if (firebaseStorage) {
              const storageRef = ref(firebaseStorage, storagePath);
              const uploadResult = await uploadBytes(storageRef, blob);
              const downloadURL = await getDownloadURL(uploadResult.ref);
              uploadedImageUrls.push(downloadURL);
              console.log(`✅ Image ${i + 1} uploaded successfully: ${fileName}`);
            } else {
              // Demo mode - keep original URL
              uploadedImageUrls.push(imageUrl);
              console.warn('⚠️ Storage not initialized, using local URL');
            }
          } catch (uploadError) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
            toast.error(`Failed to upload image ${i + 1}. Continuing with other images...`);
            // Continue without this image
          }
        }
      }

      console.log(`✅ ${uploadedImageUrls.length} images uploaded successfully`);

      // --- Map ALL fields to Supabase snake_case column names ---
      const totalQuantity = normalizedVariants.reduce((sum, v) => sum + v.quantity, 0);
      const firstVariant = normalizedVariants[0];
      const stockData = {
        // Basic Info
        name: formData.name,
        category: formData.category,
        hsn_code: formData.hsnCode || '',
        description: formData.description || '',

        // Pricing — snake_case matches Supabase columns
        base_price: formData.price ? parseFloat(formData.price) : 0,
        mrp: formData.mrp ? parseFloat(formData.mrp) : 0,
        single_shop_price: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : 0,
        multi_shop_price: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : 0,
        dealer_price: 0,
        retailer_price: 0,
        min_order_quantity: parseInt(formData.minOrderQuantity) || 1,

        // Fabric & specs
        fabric_type: formData.fabricType || '',
        fabric_description: formData.fabricDescription || '',
        delivery_time: formData.deliveryTime || '',
        item_code: formData.itemCode || '',
        unit_of_measure: formData.unitOfMeasure || 'PCS',
        unit_mode: unitMode,
        batch_code: formData.batchCode || '',

        // Images
        images: uploadedImageUrls || [],
        main_images: uploadedImageUrls || [],
        main_image_index: mainImageIndex || 0,
        vton_image_url: null,

        // Variants (JSONB)
        variants: normalizedVariants || [],
        variant_groups: [], // Standardized as empty for this form

        // Offers
        has_offer: hasOffer,
        offer_price: hasOffer && offerData.offerPrice ? parseFloat(offerData.offerPrice) : 0,
        offer_type: offerData.offerType || 'time',
        offer_time_weeks: hasOffer && offerData.offerType === 'time' && offerData.offerTimeWeeks
          ? parseInt(offerData.offerTimeWeeks) : 0,
        offer_min_quantity: hasOffer && offerData.offerType === 'quantity' && offerData.offerMinQuantity
          ? parseInt(offerData.offerMinQuantity) : 0,

        // Trader config
        traders_only: tradersOnly,
        selected_traders: tradersOnly ? selectedTraders : [],

        // Legacy single-value compat columns
        color: firstVariant
          ? (firstVariant.colorOrPattern?.type === 'color'
              ? firstVariant.colorOrPattern.value
              : firstVariant.color || '')
          : '',
        size: firstVariant?.size || '',
        quantity: totalQuantity || 0,

        // Seller metadata
        supplier: user.company || 'Unknown',
        supplier_type: user.role === 'manufacturer' ? 'manufacturer' : 'trader',
        location: user.profile?.address?.city || 'India',
        gst_number: user.id || '',
        seller_company: user.company || 'Unknown',
        status: 'active',
      };

      // Hand off to provider for persistence
      console.log('🚀 [ENHANCED SUBMIT] Handing off to Provider:', stockData.name);
      onSubmit(stockData);
      
      toast.success('Stock item submitted successfully!');
      
      // Reset form
      setFormData({
        name: '', category: '', hsnCode: '', price: '', mrp: '',
        singleShopPrice: '', multiShopPrice: '', minOrderQuantity: '',
        description: '', fabricType: '', fabricDescription: '',
        deliveryTime: '', itemCode: '', unitOfMeasure: 'PCS', batchCode: ''
      });
      setProductImages([]);
      setMainImageIndex(0);
      setColorFirstVariants([{ colorOrPattern: { type: 'color', value: '#FF6B6B', name: 'Color #FF6B6B' }, sizes: [], quantity: 0 }]);
      setSizeFirstVariants([{ size: '', colorOrPatterns: [], colors: [], quantity: 0 }]);
      setMixedVariants([{ colorOrPattern: { type: 'color', value: '#4ECDC4', name: 'Color #4ECDC4' }, size: '', quantity: 0 }]);
      setIsReviewMode(false);
      setPreparedStockItem(null);
      setHasOffer(false);
      
      if (onCancel) onCancel();

    } catch (error) {
      console.error('❌ Error submitting stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to submit stock item.', {
        id: 'submit-stock',
        description: `Error: ${errorMessage}. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEdit = () => {
    setIsReviewMode(false);

    // Scroll to top
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    toast.info('Edit mode enabled', {
      description: 'Make your changes and review again.'
    });
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

  // Variant management functions
  const addColorFirstVariant = () => {
    setColorFirstVariants(prev => [...prev, {
      colorOrPattern: { type: 'color', value: '#FF6B6B', name: 'Color #FF6B6B' },
      sizes: [],
      quantity: 0
    }]);
  };

  const removeColorFirstVariant = (index: number) => {
    setColorFirstVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateColorFirstVariant = (index: number, field: keyof ColorFirstVariant, value: any) => {
    setColorFirstVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const addSizeFirstVariant = () => {
    setSizeFirstVariants(prev => [...prev, { size: '', colorOrPatterns: [], colors: [], quantity: 0 }]);
  };

  const removeSizeFirstVariant = (index: number) => {
    setSizeFirstVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateSizeFirstVariant = (index: number, field: keyof SizeFirstVariant, value: any) => {
    setSizeFirstVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const addMixedVariant = () => {
    setMixedVariants(prev => [...prev, {
      colorOrPattern: { type: 'color', value: '#4ECDC4', name: 'Color #4ECDC4' },
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

  // Handle size selection for Set of A Color variants
  const handleSizeSelection = (variantIndex: number, size: string, isSelected: boolean) => {
    const variant = colorFirstVariants[variantIndex];
    if (!variant) return;

    let newSizes = [...variant.sizes];

    if (isSelected) {
      if (!newSizes.includes(size)) {
        newSizes.push(size);
      }
    } else {
      newSizes = newSizes.filter(s => s !== size);
    }

    updateColorFirstVariant(variantIndex, 'sizes', newSizes);
  };

  // Handle color/pattern selection for Set of A Size variants  
  const handleColorOrPatternSelection = (variantIndex: number, colorOrPattern: ColorOrPattern) => {
    const variant = sizeFirstVariants[variantIndex];
    if (!variant) return;

    let newColorOrPatterns = [...(variant.colorOrPatterns || [])];

    // Check if this colorOrPattern already exists (compare by value)
    const existingIndex = newColorOrPatterns.findIndex(
      cp => cp.type === colorOrPattern.type && cp.value === colorOrPattern.value
    );

    if (existingIndex === -1) {
      // Add new colorOrPattern
      newColorOrPatterns.push(colorOrPattern);
    }

    updateSizeFirstVariant(variantIndex, 'colorOrPatterns', newColorOrPatterns);
  };

  // Legacy color selection for backward compatibility
  const handleColorSelection = (variantIndex: number, color: string, isSelected: boolean) => {
    const variant = sizeFirstVariants[variantIndex];
    if (!variant) return;

    // Prepare both colors and colorOrPatterns updates in single state change
    const currentColors = variant.colors || [];
    const currentColorOrPatterns = variant.colorOrPatterns || [];

    let newColors = [...currentColors];
    let newColorOrPatterns = [...currentColorOrPatterns];

    const colorOrPattern: ColorOrPattern = {
      type: 'color',
      value: color,
      name: `Color ${color}`
    };

    if (isSelected) {
      // Add to colors array if not present
      if (!newColors.includes(color)) {
        newColors.push(color);
      }
      // Add to colorOrPatterns if not present
      const exists = newColorOrPatterns.some(cp => cp.type === 'color' && cp.value === color);
      if (!exists) {
        newColorOrPatterns.push(colorOrPattern);
      }
    } else {
      // Remove from both arrays
      newColors = newColors.filter(c => c !== color);
      newColorOrPatterns = newColorOrPatterns.filter(
        cp => !(cp.type === 'color' && cp.value === color)
      );
    }

    // Update both properties in a single state change to prevent loops
    setSizeFirstVariants(prev => prev.map((v, i) =>
      i === variantIndex
        ? { ...v, colors: newColors, colorOrPatterns: newColorOrPatterns }
        : v
    ));
  };

  const addCustomSize = () => {
    if (newCustomSize.trim() && !customSizes.includes(newCustomSize.trim())) {
      setCustomSizes(prev => [...prev, newCustomSize.trim()]);
      setNewCustomSize('');
    }
  };

  const removeCustomSize = (size: string) => {
    setCustomSizes(prev => prev.filter(s => s !== size));
  };

  const allSizes = useMemo(() => [...predefinedSizes, ...customSizes], [customSizes]);

  // CSV Import Functions
  const handleCsvUpload = (file: File) => {
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
        setCsvPreview(data.slice(0, 5)); // Show first 5 rows for preview
      }
    };
    reader.readAsText(file);
  };

  const processCsvImport = () => {
    if (!csvMapping.color || !csvMapping.size || !csvMapping.quantity) {
      toast.error('Please map all required fields (Color, Size, Quantity)');
      return;
    }

    const importedVariants: Variant[] = csvData.map(row => ({
      color: row[csvMapping.color] || '',
      size: row[csvMapping.size] || '',
      quantity: parseInt(row[csvMapping.quantity]) || 0,
      imageUrl: csvMapping.imageUrl ? row[csvMapping.imageUrl] : undefined
    })).filter(v => v.color && v.size && v.quantity > 0);

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
      'Color,Size,Quantity,Image URL',
      'Red,S,10,https://example.com/red-s.jpg',
      'Red,M,15,https://example.com/red-m.jpg',
      'Blue,S,12,https://example.com/blue-s.jpg',
      'Blue,M,18,https://example.com/blue-m.jpg'
    ];
    const blob = new Blob([sampleData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-variants.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="max-w-6xl mx-auto" ref={formTopRef}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isReviewMode ? <Eye className="h-5 w-5" /> : <Package className="h-5 w-5" />}
          {isReviewMode ? 'Review Stock Details' : 'Add New Stock Item'}
        </CardTitle>
        {isReviewMode && (
          <p className="text-sm text-muted-foreground mt-2">
            Review all details below. You can edit any section before final submission.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isReviewMode && preparedStockItem ? (
          // REVIEW MODE - Display all details
          <div className="space-y-6">
            {/* Review Header */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Form Validated Successfully!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Please review all details below. Click "Edit" on any section to make changes.
              </p>
            </div>

            {/* Basic Information Review */}
            <Card className="border-2">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBackToEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Product Name</Label>
                    <p className="font-semibold">{preparedStockItem.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-semibold">{preparedStockItem.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">HSN Code</Label>
                    <p className="font-semibold">{preparedStockItem.hsnCode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Supplier</Label>
                    <p className="font-semibold">{preparedStockItem.supplier}</p>
                  </div>
                </div>
                {preparedStockItem.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{preparedStockItem.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Images Review */}
            {preparedStockItem.images && preparedStockItem.images.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Product Images ({preparedStockItem.images.length})</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBackToEdit}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {preparedStockItem.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <ImageWithFallback
                          src={img}
                          alt={`Product image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === preparedStockItem.mainImageIndex && (
                          <Badge className="absolute top-2 left-2 bg-green-500">Main</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Information Review */}
            <Card className="border-2">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Pricing Information
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBackToEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Base Price</Label>
                    <p className="text-lg font-bold text-green-600">₹{preparedStockItem.price.toFixed(2)}</p>
                  </div>
                  {preparedStockItem.mrp && (
                    <div>
                      <Label className="text-muted-foreground">MRP</Label>
                      <p className="text-lg font-semibold">₹{preparedStockItem.mrp.toFixed(2)}</p>
                    </div>
                  )}
                  {preparedStockItem.singleShopPrice && (
                    <div>
                      <Label className="text-muted-foreground">Single Shop Price</Label>
                      <p className="text-lg font-semibold">₹{preparedStockItem.singleShopPrice.toFixed(2)}</p>
                    </div>
                  )}
                  {preparedStockItem.multiShopPrice && (
                    <div>
                      <Label className="text-muted-foreground">Multi Shop Price</Label>
                      <p className="text-lg font-semibold">₹{preparedStockItem.multiShopPrice.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Min Order Quantity</Label>
                    <p className="font-semibold">{preparedStockItem.minOrderQuantity} {preparedStockItem.unitOfMeasure || 'PCS'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Unit of Measure</Label>
                    <p className="font-semibold">{preparedStockItem.unitOfMeasure || 'PCS'} ({preparedStockItem.unitMode || 'individual'})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Offer Review */}
            {preparedStockItem.offerPrice && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                      <Sparkles className="h-5 w-5" />
                      Special Offer Active
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBackToEdit}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Offer Price</Label>
                      <p className="text-xl font-bold text-orange-600">₹{preparedStockItem.offerPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Offer Type</Label>
                      <p className="font-semibold capitalize">{preparedStockItem.offerType}</p>
                    </div>
                    {preparedStockItem.offerTimeWeeks && (
                      <div>
                        <Label className="text-muted-foreground">Duration</Label>
                        <p className="font-semibold">{preparedStockItem.offerTimeWeeks} weeks</p>
                      </div>
                    )}
                    {preparedStockItem.offerMinQuantity && (
                      <div>
                        <Label className="text-muted-foreground">Min Quantity</Label>
                        <p className="font-semibold">{preparedStockItem.offerMinQuantity} units</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variants Review */}
            {preparedStockItem.variants && preparedStockItem.variants.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Variants ({preparedStockItem.variants.length})
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBackToEdit}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Color/Pattern</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preparedStockItem.variants.map((variant, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {variant.colorOrPattern?.type === 'color' ? (
                                  <div
                                    className="w-6 h-6 rounded border-2 border-gray-300"
                                    style={{ backgroundColor: variant.colorOrPattern.value }}
                                  />
                                ) : (
                                  <Palette className="h-6 w-6 text-purple-500" />
                                )}
                                <span>{variant.colorOrPattern?.name || variant.color || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{variant.size}</TableCell>
                            <TableCell className="text-right font-semibold">{variant.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Quantity:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {preparedStockItem.variants.reduce((sum, v) => sum + v.quantity, 0)} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Variant Mode:</span>
                      <Badge>{preparedStockItem.variantMode}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Selling Type:</span>
                      <Badge variant="outline">{preparedStockItem.sellingType}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fabric Information Review */}
            {(preparedStockItem.fabricType || preparedStockItem.fabricDescription) && (
              <Card className="border-2">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shirt className="h-5 w-5" />
                      Fabric Information
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBackToEdit}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {preparedStockItem.fabricType && (
                    <div>
                      <Label className="text-muted-foreground">Fabric Type</Label>
                      <p className="font-semibold">{preparedStockItem.fabricType}</p>
                    </div>
                  )}
                  {preparedStockItem.fabricDescription && (
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm">{preparedStockItem.fabricDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Information Review */}
            <Card className="border-2">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBackToEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {preparedStockItem.deliveryTime && (
                    <div>
                      <Label className="text-muted-foreground">Delivery Time</Label>
                      <p className="font-semibold">{preparedStockItem.deliveryTime}</p>
                    </div>
                  )}
                  {preparedStockItem.itemCode && (
                    <div>
                      <Label className="text-muted-foreground">Item Code</Label>
                      <p className="font-semibold">{preparedStockItem.itemCode}</p>
                    </div>
                  )}
                  {preparedStockItem.batchCode && (
                    <div>
                      <Label className="text-muted-foreground">Batch Code</Label>
                      <p className="font-semibold">{preparedStockItem.batchCode}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Traders Only</Label>
                    <p className="font-semibold">{preparedStockItem.tradersOnly ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {preparedStockItem.tradersOnly && preparedStockItem.selectedTraders && preparedStockItem.selectedTraders.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Selected Traders</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {preparedStockItem.selectedTraders.map((trader, idx) => (
                        <Badge key={idx} variant="secondary">{trader}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToEdit}
                className="flex-1"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving to Supabase...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit to Supabase
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // EDIT MODE - Show form
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Cotton T-Shirt"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <div className="flex gap-2">
                      <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                              Create a new category for your products.
                            </DialogDescription>
                          </DialogHeader>
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Category name"
                          />
                          <DialogFooter>
                            <Button onClick={handleAddNewCategory}>Add Category</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsnCode">HSN Code</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.hsnCode}
                      onValueChange={(value) => handleChange('hsnCode', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select HSN code" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {formData.category ? (
                          <>
                            {/* Relevant HSN codes for selected category */}
                            {getRelevantHSNCodes(formData.category).length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                  Recommended for {formData.category}
                                </div>
                                {getRelevantHSNCodes(formData.category).map((hsn) => (
                                  <SelectItem key={`relevant-${hsn.code}`} value={hsn.code}>
                                    <div className="flex flex-col py-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{hsn.code}</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                          {hsn.gstRate}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {hsn.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                                  All Other HSN Codes
                                </div>
                              </>
                            )}
                            {/* All other HSN codes */}
                            {apparelHSNCodes
                              .filter(hsn => !getRelevantHSNCodes(formData.category).find(relevant => relevant.code === hsn.code))
                              .map((hsn) => (
                                <SelectItem key={`other-${hsn.code}`} value={hsn.code}>
                                  <div className="flex flex-col py-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{hsn.code}</span>
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                        {hsn.gstRate}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                      {hsn.description}
                                    </span>
                                    <span className="text-xs text-blue-600 font-medium mt-0.5">
                                      {hsn.category}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </>
                        ) : (
                          <>
                            {/* Show all HSN codes if no category selected */}
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                              All Apparel HSN Codes
                            </div>
                            {apparelHSNCodes.map((hsn) => (
                              <SelectItem key={`all-${hsn.code}`} value={hsn.code}>
                                <div className="flex flex-col py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{hsn.code}</span>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                      {hsn.gstRate}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {hsn.description}
                                  </span>
                                  <span className="text-xs text-purple-600 font-medium mt-0.5">
                                    {hsn.category}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.hsnCode && (
                    <div className="text-xs text-muted-foreground">
                      Selected: {formData.hsnCode}
                      {(() => {
                        const hsnData = apparelHSNCodes.find(h => h.code === formData.hsnCode);
                        return hsnData ? ` - ${hsnData.description.substring(0, 60)}... - GST: ${hsnData.gstRate}` : '';
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detailed product description..."
                    rows={3}
                  />
                </div>

                {/* ERP Basic Fields - Item Code, Unit of Measure, Batch Code */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg space-y-4">
                  {/* Unit Mode Toggle */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Stock Unit Mode</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUnitMode('individual')}
                        className={`p-3 rounded-lg border-2 transition-all ${unitMode === 'individual'
                            ? 'bg-green-100 border-green-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Shirt className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Individual Units</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">
                          For single sales (only pieces)
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitMode('bulk')}
                        className={`p-3 rounded-lg border-2 transition-all ${unitMode === 'bulk'
                            ? 'bg-green-100 border-green-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Bulk Sets</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">
                          For packs (DOZ, GRS, BAG)
                        </p>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-green-200" />

                  {/* ERP Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemCode" className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Item Code
                      </Label>
                      <div className="relative">
                        <Input
                          id="itemCode"
                          value={formData.itemCode}
                          className="bg-gray-100 cursor-not-allowed"
                          readOnly
                          placeholder="Auto-generated"
                        />
                        <Badge variant="secondary" className="absolute right-2 top-2 text-xs">
                          Auto
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Auto-generated item code</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitOfMeasure" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Unit of Measure *
                      </Label>
                      <Select
                        value={formData.unitOfMeasure}
                        onValueChange={(value) => handleChange('unitOfMeasure', value)}
                      >
                        <SelectTrigger className={isUnitMismatch() ? 'border-amber-400 bg-amber-50' : ''}>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Current mode units (highlighted) */}
                          <div className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 sticky top-0">
                            {unitMode === 'individual' ? '✓ Individual Units' : '✓ Bulk Set Units'}
                          </div>
                          {currentModeUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium">{unit.label}</span>
                                <span className="text-xs text-muted-foreground">{unit.description}</span>
                              </div>
                            </SelectItem>
                          ))}

                          {/* Other mode units (available but separated) */}
                          <Separator className="my-1" />
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-gray-50 sticky top-0">
                            Other Available Units
                          </div>
                          {(unitMode === 'individual' ? bulkUnits : individualUnits).map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              <div className="flex flex-col py-1 opacity-70">
                                <span className="font-medium">{unit.label}</span>
                                <span className="text-xs text-muted-foreground">{unit.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isUnitMismatch() && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          Unit doesn't match {unitMode} mode
                        </p>
                      )}
                      {!isUnitMismatch() && (
                        <p className="text-xs text-green-600">
                          {unitMode === 'individual' ? 'Per-variant quantity' : 'Grouped stock'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batchCode" className="flex items-center gap-2">
                        <Grid className="h-4 w-4" />
                        Batch Code
                      </Label>
                      <Input
                        id="batchCode"
                        value={formData.batchCode}
                        onChange={(e) => handleChange('batchCode', e.target.value)}
                        placeholder="e.g., BTH2024001"
                      />
                      {!formData.batchCode && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          Recommended for tracking
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mode Example */}
                  <div className="p-3 bg-white border border-green-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-green-700">
                          {unitMode === 'individual' ? 'Individual Mode Example:' : 'Bulk Mode Example:'}
                        </p>
                        <p className="text-muted-foreground">
                          {unitMode === 'individual'
                            ? 'Use PCS for 100 T-shirts with per-variant quantities (Red-M: 10, Blue-L: 15, etc.)'
                            : 'Use DOZ for 10 dozen T-shirts (= 120 pieces) grouped as complete sets'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-green-200" />

                  {/* Selling Preference - Only shown for Bulk Sets */}
                  {unitMode === 'bulk' && (
                    <div className="space-y-3">
                      <Label className="font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-purple-600" />
                        How do you want to sell this stock?
                      </Label>
                      <p className="text-xs text-muted-foreground -mt-1">
                        Choose whether buyers can purchase individual pieces or must buy complete {formData.unitOfMeasure || 'bulk'} units
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${bulkSellingMode === 'pieces'
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          onClick={() => setBulkSellingMode('pieces')}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="radio"
                              id="bulk-as-pieces"
                              name="bulkSellingMode"
                              value="pieces"
                              checked={bulkSellingMode === 'pieces'}
                              onChange={(e) => setBulkSellingMode(e.target.value as 'pieces' | 'bulksets')}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                            />
                            <Label htmlFor="bulk-as-pieces" className="cursor-pointer flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Shirt className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-sm">Selling as Pieces</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Buyers can buy individual pieces
                              </p>
                            </Label>
                          </div>
                        </div>

                        <div
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${bulkSellingMode === 'bulksets'
                              ? 'border-green-500 bg-green-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-green-300'
                            }`}
                          onClick={() => setBulkSellingMode('bulksets')}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="radio"
                              id="bulk-as-sets"
                              name="bulkSellingMode"
                              value="bulksets"
                              checked={bulkSellingMode === 'bulksets'}
                              onChange={(e) => setBulkSellingMode(e.target.value as 'pieces' | 'bulksets')}
                              className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500 mt-0.5"
                            />
                            <Label htmlFor="bulk-as-sets" className="cursor-pointer flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Package className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-sm">Selling as Bulk Sets</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Buyers must buy complete {formData.unitOfMeasure || 'bulk'} units
                              </p>
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Helper Info */}
                      {bulkSellingMode === 'pieces' ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-blue-800">Selling as Pieces</p>
                              <p className="text-blue-700">
                                You're stocking in {formData.unitOfMeasure || 'bulk units'}, but buyers can purchase individual pieces. Your MOQ will be specified in pieces (PCS).
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-green-800">Selling as Bulk Sets</p>
                              <p className="text-green-700">
                                Buyers must purchase complete {formData.unitOfMeasure || 'bulk'} units only. Your MOQ will be specified in {formData.unitOfMeasure || 'units'}.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {unitMode === 'bulk' && <Separator className="bg-green-200" />}

                  {/* Minimum Order Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity" className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Minimum Order Quantity *
                    </Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      value={formData.minOrderQuantity}
                      onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
                      placeholder={
                        unitMode === 'bulk' && bulkSellingMode === 'pieces'
                          ? 'Minimum number of pieces'
                          : unitMode === 'bulk' && bulkSellingMode === 'bulksets'
                            ? `Minimum number of ${formData.unitOfMeasure || 'bulk sets'}`
                            : `Minimum quantity in ${formData.unitOfMeasure || 'units'}`
                      }
                      min="1"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {unitMode === 'bulk' && bulkSellingMode === 'pieces'
                        ? 'Enter minimum pieces buyers must order'
                        : unitMode === 'bulk' && bulkSellingMode === 'bulksets'
                          ? `Enter minimum number of ${formData.unitOfMeasure || 'bulk sets'} buyers must order`
                          : `Minimum quantity buyers must order (in ${formData.unitOfMeasure || 'units'})`}
                    </p>
                  </div>
                </div>


              </CardContent>
            </Card>



            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Base Price per piece (₹) *</Label>
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
                    <p className="text-xs text-muted-foreground">Wholesale/bulk purchase price</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mrp" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      MRP (₹)
                    </Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      value={formData.mrp}
                      onChange={(e) => handleChange('mrp', e.target.value)}
                      placeholder="Maximum Retail Price"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">Retail price for end consumers</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="singleShopPrice">Single Shop Price (₹)</Label>
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
                    <Label htmlFor="multiShopPrice">Multi Shop Price (₹)</Label>
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




              </CardContent>
            </Card>

            {/* Special Offer Section */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="bg-gradient-to-r from-pastel-orange/50 to-pastel-yellow/30 border-b border-pastel-orange-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-orange-text/10 rounded-lg">
                      <Tag className="h-5 w-5 text-pastel-orange-text" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-pastel-orange-text">Special Offer</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Create promotional pricing for your products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-pastel-orange/20 px-3 py-2 rounded-lg transition-colors" onClick={() => setHasOffer(!hasOffer)}>
                    <Checkbox
                      checked={hasOffer}
                      onCheckedChange={setHasOffer}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:bg-pastel-orange-text data-[state=checked]:border-pastel-orange-text w-5 h-5 rounded-md border-2 border-pastel-orange-text/50"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-pastel-orange-text">
                        {hasOffer ? 'Enabled' : 'Click to enable'}
                      </span>
                      <Badge variant="secondary" className="bg-gradient-to-r from-pastel-orange to-pastel-yellow text-pastel-orange-text text-xs px-2 py-1 animate-pulse">
                        NEW
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {hasOffer && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offerPrice">Offer Price (₹) *</Label>
                      <Input
                        id="offerPrice"
                        type="number"
                        step="0.01"
                        value={offerData.offerPrice}
                        onChange={(e) => setOfferData(prev => ({ ...prev, offerPrice: e.target.value }))}
                        placeholder="Special offer price"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Offer Type</Label>
                      <Select
                        value={offerData.offerType}
                        onValueChange={(value: 'time' | 'quantity') => setOfferData(prev => ({ ...prev, offerType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">Time-based</SelectItem>
                          <SelectItem value="quantity">Quantity-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {offerData.offerType === 'time' && (
                    <div className="space-y-2">
                      <Label htmlFor="offerTimeWeeks">Offer Duration (weeks) *</Label>
                      <Input
                        id="offerTimeWeeks"
                        type="number"
                        value={offerData.offerTimeWeeks}
                        onChange={(e) => setOfferData(prev => ({ ...prev, offerTimeWeeks: e.target.value }))}
                        placeholder="Number of weeks"
                        min="1"
                      />
                    </div>
                  )}

                  {offerData.offerType === 'quantity' && (
                    <div className="space-y-2">
                      <Label htmlFor="offerMinQuantity">Minimum Quantity for Offer *</Label>
                      <Input
                        id="offerMinQuantity"
                        type="number"
                        value={offerData.offerMinQuantity}
                        onChange={(e) => setOfferData(prev => ({ ...prev, offerMinQuantity: e.target.value }))}
                        placeholder="Minimum order quantity for this offer"
                        min="1"
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Variant Upload Mode Section */}
            {/* Auto Generate Combos - Variant Generation */}
            <AutoGenerateCombos
              unitOfMeasure={formData.unitOfMeasure}
              unitMode={unitMode}
              onCombosGenerated={handleCombosGenerated}
              mrp={formData.mrp ? parseFloat(formData.mrp) : 0}
            />

            {/* Variant Preview - Shows generated combinations */}
            {normalizedVariants.length > 0 && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <Label className="text-base font-medium">Generated Variant Combinations</Label>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Variants: {normalizedVariants.length}</span>
                      <span>Total Quantity: {normalizedVariants.reduce((sum, v) => sum + v.quantity, 0)} {formData.unitOfMeasure}</span>
                    </div>
                    {normalizedVariants.length > 0 && (
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Color</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {normalizedVariants.slice(0, 10).map((variant, index) => (
                              <TableRow key={index}>
                                <TableCell>{variant.color}</TableCell>
                                <TableCell>{variant.size}</TableCell>
                                <TableCell>{variant.quantity}</TableCell>
                              </TableRow>
                            ))}
                            {normalizedVariants.length > 10 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                  ... and {normalizedVariants.length - 10} more variants
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Images */}


            {/* Pricing Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Pricing Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* MRP Input */}
                <div className="space-y-2">
                  <Label htmlFor="mrp">
                    MRP (Maximum Retail Price per {formData.unitOfMeasure || 'unit'})
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="mrp"
                      name="mrp"
                      type="number"
                      value={formData.mrp}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="pl-8"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Dealer Price (Wholesaler) */}
                <div className="space-y-2">
                  <Label htmlFor="dealerPrice">
                    Wholesale Price (per {formData.unitOfMeasure || 'unit'})
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="dealerPrice"
                      name="dealerPrice"
                      type="number"
                      value={formData.dealerPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="pl-8"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank if not applicable
                  </p>
                </div>

                {/* Retailer Price */}
                <div className="space-y-2">
                  <Label htmlFor="retailerPrice">
                    Retailer Price (per {formData.unitOfMeasure || 'unit'})
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="retailerPrice"
                      name="retailerPrice"
                      type="number"
                      value={formData.retailerPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="pl-8"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank if not applicable
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fabric Description */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Fabric Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fabricDescription">
                    Describe the fabric composition, texture, and care instructions
                  </Label>
                  <Textarea
                    id="fabricDescription"
                    name="fabricDescription"
                    value={formData.fabricDescription}
                    onChange={handleChange}
                    placeholder="E.g., 100% Pure Cotton, Soft texture, Machine washable"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional notes about this stock item..."
                    rows={2}
                  />
                </div>



                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tradersOnly"
                      checked={tradersOnly}
                      onCheckedChange={(checked) => {
                        setTradersOnly(checked as boolean);
                        if (!checked) {
                          setSelectedTraders([]);
                        }
                      }}
                    />
                    <Label htmlFor="tradersOnly">
                      Sell through Traders Only
                    </Label>
                  </div>

                  {tradersOnly && (
                    <div className="ml-6 space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Select Preferred Traders from your Supplier List
                      </Label>
                      <Select
                        value=""
                        onValueChange={(traderId) => {
                          if (traderId && !selectedTraders.includes(traderId)) {
                            setSelectedTraders([...selectedTraders, traderId]);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose from your preferred traders..." />
                        </SelectTrigger>
                        <SelectContent>
                          {preferredTraders
                            .filter(trader => !selectedTraders.includes(trader.id))
                            .map((trader) => (
                              <SelectItem key={trader.id} value={trader.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{trader.name}</span>
                                  <span className="text-xs text-muted-foreground">{trader.gst}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {selectedTraders.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Selected Traders:</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedTraders.map((traderId) => {
                              const trader = preferredTraders.find(t => t.id === traderId);
                              return trader ? (
                                <Badge
                                  key={traderId}
                                  variant="secondary"
                                  className="flex items-center gap-1 px-3 py-1"
                                >
                                  <span className="text-xs">{trader.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 hover:bg-transparent"
                                    onClick={() => {
                                      setSelectedTraders(selectedTraders.filter(id => id !== traderId));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CSV Import Section (Optional) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">CSV Import (Optional)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Import variants from a CSV file. The CSV should have columns for Color, Size, and Quantity.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="csvFile">Upload CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="cursor-pointer"
                  />
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Map CSV Columns</Label>

                      <div className="space-y-2">
                        <Label>Color Column *</Label>
                        <Select value={csvMapping.color} onValueChange={(value) => setCsvMapping(prev => ({ ...prev, color: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column for Color" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvColumns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Size Column *</Label>
                        <Select value={csvMapping.size} onValueChange={(value) => setCsvMapping(prev => ({ ...prev, size: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column for Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvColumns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity Column *</Label>
                        <Select value={csvMapping.quantity} onValueChange={(value) => setCsvMapping(prev => ({ ...prev, quantity: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column for Quantity" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvColumns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Image URL Column (optional)</Label>
                        <Select value={csvMapping.imageUrl} onValueChange={(value) => setCsvMapping(prev => ({ ...prev, imageUrl: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select column for Image URL" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {csvColumns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CSV Preview */}
                {csvPreview.length > 0 && csvMapping.color && csvMapping.size && csvMapping.quantity && (
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Preview (First 5 rows)</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Quantity</TableHead>
                            {csvMapping.imageUrl && <TableHead>Image URL</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row[csvMapping.color]}</TableCell>
                              <TableCell>{row[csvMapping.size]}</TableCell>
                              <TableCell>{row[csvMapping.quantity]}</TableCell>
                              {csvMapping.imageUrl && <TableCell className="text-xs">{row[csvMapping.imageUrl]?.substring(0, 30)}...</TableCell>}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Button
                      type="button"
                      onClick={handleCsvImport}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import {csvPreview.length} Variants from CSV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Details
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedAddStockFormWithImages;

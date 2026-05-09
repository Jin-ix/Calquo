import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ColorOrPattern, ColorPatternInput as ColorInputComponent } from '../ui/color-pattern-input';
import { uploadProductVariantImage, generateProductImageId, validateImageFile, isStorageAvailable } from '../../utils/firebase/storage';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Sparkles, 
  Eye, 
  X, 
  Check, 
  Upload, 
  Trash2, 
  Star, 
  Package, 
  Info,
  ShoppingBag,
  Box,
  Archive,
  Layers,
  Circle,
  Image as ImageIcon
} from 'lucide-react';

interface ComboRow {
  id: string;
  color: ColorOrPattern;
  size: string;
  pattern?: string;
  basePrice: number;  // Mandatory: Base price per individual piece
  priceForTraders?: number;  // Price for traders
  priceForSingleShopRetailers: number;  // Mandatory: Price for single shop retailers
  priceForMultiShopRetailers?: number;  // Price for multi shop retailers
  mrpPerPiece?: number;  // MRP per piece
  image?: string;  // Optional: Image URL for this variant
}

interface VariantPricingData {
  quantity?: number;
  basePrice?: number;
  piecePrice?: number;
  priceForTraders?: number;
  priceForSingleShopRetailers?: number;
  priceForMultiShopRetailers?: number;
  mrpPerPiece?: number;
  image?: string;
}

interface AutoGenerateCombosProps {
  unitOfMeasure: string;
  unitMode?: 'individual' | 'bulk';
  bulkSellingMode?: 'pieces' | 'bulksets';
  onGenerate: (combos: any[]) => void;
  mrp?: number;
  existingGroupsCount?: number;
  initialColors?: ColorOrPattern[];
  initialSizes?: string[];
  initialPricingData?: Record<string, VariantPricingData>;
  onNavigateToPricing?: () => void;
}

const allStandardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42', '44'];

// Define individual and bulk units
const individualUnits = ['PCS', 'MTR', 'YRD', 'KG'];
const bulkUnits = ['SET', 'PAIR', 'DOZ', 'GRS', 'BAG', 'BOX', 'CTN', 'ROLL', 'BOL'];

// Unit multipliers for bulk units
const unitMultipliers: Record<string, number> = {
  'SET': 1,     // Custom per set
  'PAIR': 2,    // 1 Pair = 2 pieces
  'DOZ': 12,    // 1 Dozen = 12 pieces
  'GRS': 144,   // 1 Gross = 144 pieces (12 dozen)
  'BAG': 1,     // Custom per bag
  'BOX': 1,     // Custom per box
  'CTN': 1,     // Custom per carton
  'ROLL': 1,    // Custom per roll
  'BOL': 1      // Custom per bale
};

export const AutoGenerateCombos: React.FC<AutoGenerateCombosProps> = ({ 
  unitOfMeasure,
  unitMode,
  bulkSellingMode,
  existingGroupsCount = 0,
  onGenerate,
  mrp = 0,
  initialColors = [],
  initialSizes = [],
  initialPricingData = {},
  onNavigateToPricing
}) => {
  const [showPreview, setShowPreview] = useState(false);
  
  // Determine if unit is bulk or individual
  const isBulkUnit = bulkUnits.includes(unitOfMeasure);
  const isIndividualUnit = individualUnits.includes(unitOfMeasure);
  
  // Linear quantity for individual units
  const [linearQuantity, setLinearQuantity] = useState<number>(0);
  
  // Unit quantity for bulk units (e.g., pieces per dozen)
  const [unitQuantity, setUnitQuantity] = useState<number>(unitMultipliers[unitOfMeasure] || 1);
  
  // MRP per piece (mandatory)
  const [mrpPerPiece, setMrpPerPiece] = useState<number>(0);
  
  // Pricing for individual units
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  
  // Pricing for bulk units
  const [bulkPricePerUnit, setBulkPricePerUnit] = useState<number>(0);
  
  // Selection states - initialize with props if provided
  const [selectedColors, setSelectedColors] = useState<ColorOrPattern[]>(initialColors);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialSizes);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [customPattern, setCustomPattern] = useState('');
  
  // Update colors and sizes when editing a group
  useEffect(() => {
    if (initialColors.length > 0 || initialSizes.length > 0) {
      console.log('🔄 AutoGenerateCombos: Received initial data');
      console.log('  Colors:', initialColors.length, initialColors.map(c => c.name));
      console.log('  Sizes:', initialSizes.length, initialSizes);
      console.log('  Pricing entries:', Object.keys(initialPricingData).length);
      
      setSelectedColors(initialColors);
      setSelectedSizes(initialSizes);
      
      // If we have pricing data, pre-populate the combos with it
      if (Object.keys(initialPricingData).length > 0) {
        console.log('💰 Pre-populating pricing data...');
        const combos: ComboRow[] = [];
        
        initialColors.forEach(color => {
          initialSizes.forEach(size => {
            const key = `${color.value}-${size}`;
            const pricingData = initialPricingData[key];
            
            combos.push({
              id: Math.random().toString(36).substr(2, 9),
              color: color,
              size: size,
              basePrice: pricingData?.basePrice || pricingData?.piecePrice || 0,
              priceForTraders: pricingData?.priceForTraders,
              priceForSingleShopRetailers: pricingData?.priceForSingleShopRetailers || 0,
              priceForMultiShopRetailers: pricingData?.priceForMultiShopRetailers,
              mrpPerPiece: pricingData?.mrpPerPiece,
              image: pricingData?.image
            });
          });
        });
        
        setGeneratedCombos(combos);
        
        // Pre-populate the edited pricing states
        const basePrices: Record<string, number> = {};
        const tradersPrice: Record<string, number> = {};
        const singleShopPrice: Record<string, number> = {};
        const multiShopPrice: Record<string, number> = {};
        const mrpPrice: Record<string, number> = {};
        const quantities: Record<string, number> = {};
        const images: Record<string, string> = {};
        
        combos.forEach(combo => {
          const key = `${combo.color.value}-${combo.size}`;
          const pricingData = initialPricingData[key];
          
          if (pricingData) {
            if (pricingData.basePrice || pricingData.piecePrice) {
              basePrices[combo.id] = pricingData.basePrice || pricingData.piecePrice || 0;
            }
            if (pricingData.priceForTraders) {
              tradersPrice[combo.id] = pricingData.priceForTraders;
            }
            if (pricingData.priceForSingleShopRetailers) {
              singleShopPrice[combo.id] = pricingData.priceForSingleShopRetailers;
            }
            if (pricingData.priceForMultiShopRetailers) {
              multiShopPrice[combo.id] = pricingData.priceForMultiShopRetailers;
            }
            if (pricingData.mrpPerPiece) {
              mrpPrice[combo.id] = pricingData.mrpPerPiece;
            }
            if (pricingData.quantity) {
              quantities[combo.id] = pricingData.quantity;
            }
            if (pricingData.image) {
              images[combo.id] = pricingData.image;
            }
          }
        });
        
        setEditedBasePrices(basePrices);
        setEditedPriceForTraders(tradersPrice);
        setEditedPriceForSingleShopRetailers(singleShopPrice);
        setEditedPriceForMultiShopRetailers(multiShopPrice);
        setEditedMrpPerPiece(mrpPrice);
        setEditedQuantities(quantities);
        setEditedImages(images);
        setShowPreview(true);
        
        console.log('✅ Pricing data loaded:', {
          combos: combos.length,
          basePrices: Object.keys(basePrices).length,
          quantities: Object.keys(quantities).length
        });
      } else {
        console.log('⚠️ No pricing data to pre-populate');
      }
    }
  }, [initialColors, initialSizes, initialPricingData]);
  
  // Custom size input
  const [customSize, setCustomSize] = useState('');
  
  // Current color/pattern input - starts empty
  const [currentColorInput, setCurrentColorInput] = useState<ColorOrPattern>({
    type: 'color',
    value: '',
    name: ''
  });
  
  // Generated combos
  const [generatedCombos, setGeneratedCombos] = useState<ComboRow[]>([]);
  const [editedBasePrices, setEditedBasePrices] = useState<Record<string, number>>({});
  const [editedPriceForTraders, setEditedPriceForTraders] = useState<Record<string, number>>({});
  const [editedPriceForSingleShopRetailers, setEditedPriceForSingleShopRetailers] = useState<Record<string, number>>({});
  const [editedPriceForMultiShopRetailers, setEditedPriceForMultiShopRetailers] = useState<Record<string, number>>({});
  const [editedMrpPerPiece, setEditedMrpPerPiece] = useState<Record<string, number>>({});
  const [editedImages, setEditedImages] = useState<Record<string, string>>({});
  const [mainImageComboId, setMainImageComboId] = useState<string | null>(null);
  
  // Apply to all functionality
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [applyAllQuantity, setApplyAllQuantity] = useState<number | ''>('');
  const [applyAllBasePrice, setApplyAllBasePrice] = useState<number | ''>('');
  const [applyAllPriceForTraders, setApplyAllPriceForTraders] = useState<number | ''>('');
  const [applyAllPriceForSingleShopRetailers, setApplyAllPriceForSingleShopRetailers] = useState<number | ''>('');
  const [applyAllPriceForMultiShopRetailers, setApplyAllPriceForMultiShopRetailers] = useState<number | ''>('');
  const [applyAllMrpPerPiece, setApplyAllMrpPerPiece] = useState<number | ''>('');
  const [quickApplyQuantity, setQuickApplyQuantity] = useState<number | ''>('');

  // Toggle color - add if not present, remove if already selected
  const addColor = () => {
    if (!currentColorInput || !currentColorInput.value) return;
    
    // Check if color already exists
    const existingIndex = selectedColors.findIndex(c => 
      c.type === currentColorInput.type && 
      c.value === currentColorInput.value
    );
    
    if (existingIndex !== -1) {
      // Color exists, remove it (toggle off)
      setSelectedColors(selectedColors.filter((_, i) => i !== existingIndex));
      toast.success(`Removed ${currentColorInput.name}`);
    } else {
      // Color doesn't exist, add it (toggle on)
      setSelectedColors([...selectedColors, currentColorInput]);
      toast.success(`Added ${currentColorInput.name}`);
    }
    
    // Reset to empty
    setCurrentColorInput({
      type: 'color',
      value: '',
      name: ''
    });
  };

  const removeColor = (index: number) => {
    setSelectedColors(selectedColors.filter((_, i) => i !== index));
  };

  // Check if current color is already selected
  const isCurrentColorSelected = currentColorInput && currentColorInput.value ? selectedColors.some(c => 
    c.type === currentColorInput.type && 
    c.value === currentColorInput.value
  ) : false;

  // Handle color selection from ColorPatternInput - toggle behavior
  const handleColorSelection = (color: ColorOrPattern) => {
    const exists = selectedColors.some(c => 
      c.type === color.type && c.value === color.value
    );
    
    if (exists) {
      // Remove if already selected
      setSelectedColors(selectedColors.filter(c => 
        !(c.type === color.type && c.value === color.value)
      ));
      toast.success(`Removed ${color.name || color.value}`);
    } else {
      // Add if not selected
      setSelectedColors([...selectedColors, color]);
      toast.success(`Added ${color.name || color.value}`);
    }
  };

  // Add pattern
  const addPattern = () => {
    if (!customPattern.trim()) {
      toast.error('Please enter a pattern name');
      return;
    }
    
    if (selectedPatterns.includes(customPattern.trim())) {
      toast.error('This pattern is already added');
      return;
    }
    
    setSelectedPatterns([...selectedPatterns, customPattern.trim()]);
    setCustomPattern('');
    toast.success(`Added pattern: ${customPattern}`);
  };

  const removePattern = (index: number) => {
    setSelectedPatterns(selectedPatterns.filter((_, i) => i !== index));
  };

  // Add custom size
  const addCustomSize = () => {
    const trimmedSize = customSize.trim().toUpperCase();
    
    if (!trimmedSize) {
      toast.error('Please enter a size');
      return;
    }
    
    if (selectedSizes.includes(trimmedSize)) {
      toast.error('This size is already added');
      return;
    }
    
    setSelectedSizes([...selectedSizes, trimmedSize]);
    setCustomSize('');
    toast.success(`Added custom size: ${trimmedSize}`);
  };

  const removeCustomSize = (size: string) => {
    setSelectedSizes(selectedSizes.filter(s => s !== size));
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Generate all permutations
  const generateCombos = () => {
    if (selectedColors.length === 0) {
      return;
    }
    
    if (selectedSizes.length === 0) {
      return;
    }

    const combos: ComboRow[] = [];
    let comboIndex = 1;

    // If patterns are selected, include them in permutations
    if (selectedPatterns.length > 0) {
      selectedColors.forEach(color => {
        selectedSizes.forEach(size => {
          selectedPatterns.forEach(pattern => {
            combos.push({
              id: `COMBO-${comboIndex.toString().padStart(3, '0')}`,
              color,
              size,
              pattern,
              basePrice: 0,
              priceForTraders: 0,
              priceForSingleShopRetailers: 0,
              priceForMultiShopRetailers: 0,
              mrpPerPiece: mrpPerPiece || 0
            });
            comboIndex++;
          });
        });
      });
    } else {
      // No patterns, just color × size
      selectedColors.forEach(color => {
        selectedSizes.forEach(size => {
          combos.push({
            id: `COMBO-${comboIndex.toString().padStart(3, '0')}`,
            color,
            size,
            basePrice: 0,
            priceForTraders: 0,
            priceForSingleShopRetailers: 0,
            priceForMultiShopRetailers: 0,
            mrpPerPiece: mrpPerPiece || 0
          });
          comboIndex++;
        });
      });
    }

    setGeneratedCombos(combos);
    setEditedBasePrices({});
    setEditedPriceForTraders({});
    setEditedPriceForSingleShopRetailers({});
    setEditedPriceForMultiShopRetailers({});
    setEditedMrpPerPiece({});
    setEditedImages({});
    setShowPreview(true);
    
    const patternText = selectedPatterns.length > 0 
      ? ` × ${selectedPatterns.length} patterns` 
      : '';
    
    toast.success(
      `Generated ${combos.length} combos (${selectedColors.length} colors × ${selectedSizes.length} sizes${patternText})`
    );
  };

  // Auto-generate combos when colors, sizes, or patterns change
  useEffect(() => {
    if (selectedColors.length > 0 && selectedSizes.length > 0) {
      generateCombos();
    } else {
      // Clear preview if selections are incomplete
      setGeneratedCombos([]);
      setShowPreview(false);
    }
  }, [selectedColors, selectedSizes, selectedPatterns]);

  // Update base price for a specific combo
  const updateComboBasePrice = (comboId: string, price: number) => {
    setEditedBasePrices({
      ...editedBasePrices,
      [comboId]: price
    });
  };

  // Update price for traders for a specific combo
  const updateComboPriceForTraders = (comboId: string, price: number) => {
    setEditedPriceForTraders({
      ...editedPriceForTraders,
      [comboId]: price
    });
  };

  // Update price for single shop retailers for a specific combo
  const updateComboPriceForSingleShopRetailers = (comboId: string, price: number) => {
    setEditedPriceForSingleShopRetailers({
      ...editedPriceForSingleShopRetailers,
      [comboId]: price
    });
  };

  // Update price for multi shop retailers for a specific combo
  const updateComboPriceForMultiShopRetailers = (comboId: string, price: number) => {
    setEditedPriceForMultiShopRetailers({
      ...editedPriceForMultiShopRetailers,
      [comboId]: price
    });
  };

  // Update MRP per piece for a specific combo
  const updateComboMrpPerPiece = (comboId: string, mrp: number) => {
    setEditedMrpPerPiece({
      ...editedMrpPerPiece,
      [comboId]: mrp
    });
  };

  // Update image for a specific combo
  const updateComboImage = (comboId: string, imageUrl: string) => {
    if (!imageUrl && mainImageComboId === comboId) {
      // If deleting the main image, clear the main image selection
      setMainImageComboId(null);
    }
    setEditedImages({
      ...editedImages,
      [comboId]: imageUrl
    });
  };

  // Set main image for the product
  const setAsMainImage = (comboId: string) => {
    setMainImageComboId(comboId);
    toast.success('Set as main product image');
  };

  // Handle image file upload for a specific combo
  const handleImageUpload = async (comboId: string, file: File) => {
    // Check if Firebase Storage is available
    if (!isStorageAvailable()) {
      toast.error('Firebase Storage is not configured. Please check your Firebase settings.', {
        className: 'bg-red-50 border-red-200 text-red-800',
      });
      return;
    }

    // Validate image file
    const validationError = validateImageFile(file, 5); // 5MB max
    if (validationError) {
      toast.error(validationError, {
        className: 'bg-red-50 border-red-200 text-red-800',
      });
      return;
    }

    try {
      // Show upload progress toast
      const uploadToast = toast.loading('📤 Uploading image to cloud storage...', {
        className: 'bg-blue-50 border-blue-200 text-blue-800',
      });

      // Generate a temporary product ID for image storage
      const productId = generateProductImageId();
      
      // Create variant ID from combo details
      const combo = generatedCombos.find(c => c.id === comboId);
      const variantId = combo ? `${combo.color.value}-${combo.size}`.replace(/[^a-zA-Z0-9-]/g, '_') : comboId;

      // Upload image to Firebase Storage with progress tracking
      let uploadProgress = 0;
      const imageUrl = await uploadProductVariantImage(
        file,
        productId,
        variantId,
        (progress) => {
          uploadProgress = progress;
          if (progress === 100) {
            toast.loading('🔄 Processing image...', { id: uploadToast });
          } else {
            toast.loading(`📤 Uploading: ${Math.round(progress)}%`, { id: uploadToast });
          }
        }
      );

      // Update combo image with the Firebase Storage URL
      updateComboImage(comboId, imageUrl);
      
      // Automatically set as main image if it's the first image uploaded
      if (!mainImageComboId) {
        setMainImageComboId(comboId);
        toast.success('✅ Image uploaded to cloud & set as main product image!', {
          id: uploadToast,
          className: 'bg-green-50 border-green-200 text-green-800',
        });
      } else {
        toast.success('✅ Image uploaded to cloud successfully!', {
          id: uploadToast,
          className: 'bg-green-50 border-green-200 text-green-800',
        });
      }

      console.log('✅ Image uploaded:', {
        comboId,
        variantId,
        url: imageUrl,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.', {
        className: 'bg-red-50 border-red-200 text-red-800',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Apply to all functions
  const handleApplyAllBasePrice = () => {
    if (applyAllBasePrice === '' || applyAllBasePrice <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }
    const newBasePrices: Record<string, number> = {};
    generatedCombos.forEach(combo => {
      newBasePrices[combo.id] = applyAllBasePrice as number;
    });
    setEditedBasePrices(newBasePrices);
    toast.success(`Applied ₹${applyAllBasePrice} to all ${generatedCombos.length} variants`);
  };

  const handleApplyAllPriceForTraders = () => {
    if (applyAllPriceForTraders === '' || applyAllPriceForTraders <= 0) {
      toast.error('Please enter a valid price for traders');
      return;
    }
    const newPrices: Record<string, number> = {};
    generatedCombos.forEach(combo => {
      newPrices[combo.id] = applyAllPriceForTraders as number;
    });
    setEditedPriceForTraders(newPrices);
    toast.success(`Applied ₹${applyAllPriceForTraders} to all ${generatedCombos.length} variants`);
  };

  const handleApplyAllPriceForSingleShopRetailers = () => {
    if (applyAllPriceForSingleShopRetailers === '' || applyAllPriceForSingleShopRetailers <= 0) {
      toast.error('Please enter a valid price for single shop retailers');
      return;
    }
    const newPrices: Record<string, number> = {};
    generatedCombos.forEach(combo => {
      newPrices[combo.id] = applyAllPriceForSingleShopRetailers as number;
    });
    setEditedPriceForSingleShopRetailers(newPrices);
    toast.success(`Applied ₹${applyAllPriceForSingleShopRetailers} to all ${generatedCombos.length} variants`);
  };

  const handleApplyAllPriceForMultiShopRetailers = () => {
    if (applyAllPriceForMultiShopRetailers === '' || applyAllPriceForMultiShopRetailers <= 0) {
      toast.error('Please enter a valid price for multi shop retailers');
      return;
    }
    const newPrices: Record<string, number> = {};
    generatedCombos.forEach(combo => {
      newPrices[combo.id] = applyAllPriceForMultiShopRetailers as number;
    });
    setEditedPriceForMultiShopRetailers(newPrices);
    toast.success(`Applied ₹${applyAllPriceForMultiShopRetailers} to all ${generatedCombos.length} variants`);
  };

  const handleApplyAllMrpPerPiece = () => {
    if (applyAllMrpPerPiece === '' || applyAllMrpPerPiece <= 0) {
      toast.error('Please enter a valid MRP per piece');
      return;
    }
    const newMrps: Record<string, number> = {};
    generatedCombos.forEach(combo => {
      newMrps[combo.id] = applyAllMrpPerPiece as number;
    });
    setEditedMrpPerPiece(newMrps);
    toast.success(`Applied ₹${applyAllMrpPerPiece} MRP to all ${generatedCombos.length} variants`);
  };

  // Quick apply quantity to all variants
  const handleQuickApplyQuantity = () => {
    if (quickApplyQuantity === '' || quickApplyQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    const newQuantities: Record<string, number> = {};
    generatedCombos.forEach(combo => {
      newQuantities[combo.id] = quickApplyQuantity as number;
    });
    setEditedQuantities(newQuantities);
    toast.success(`Applied quantity ${quickApplyQuantity} to all ${generatedCombos.length} variants`);
  };

  // Delete a combo row
  const deleteCombo = (comboId: string) => {
    setGeneratedCombos(generatedCombos.filter(c => c.id !== comboId));
    const newBasePrices = { ...editedBasePrices };
    delete newBasePrices[comboId];
    setEditedBasePrices(newBasePrices);
    const newPriceForTraders = { ...editedPriceForTraders };
    delete newPriceForTraders[comboId];
    setEditedPriceForTraders(newPriceForTraders);
    const newPriceForSingleShop = { ...editedPriceForSingleShopRetailers };
    delete newPriceForSingleShop[comboId];
    setEditedPriceForSingleShopRetailers(newPriceForSingleShop);
    const newPriceForMultiShop = { ...editedPriceForMultiShopRetailers };
    delete newPriceForMultiShop[comboId];
    setEditedPriceForMultiShopRetailers(newPriceForMultiShop);
    const newMrps = { ...editedMrpPerPiece };
    delete newMrps[comboId];
    setEditedMrpPerPiece(newMrps);
    const newImages = { ...editedImages };
    delete newImages[comboId];
    setEditedImages(newImages);
    toast.success('Combo removed');
  };

  // Calculate MRP per bulk unit from MRP per piece
  const calculateMrpPerBulkUnit = () => {
    if (isBulkUnit && mrpPerPiece > 0) {
      return mrpPerPiece * unitQuantity;
    }
    return 0;
  };

  // Calculate equivalent price per piece from bulk price
  const calculatePricePerPieceFromBulk = () => {
    if (isBulkUnit && bulkPricePerUnit > 0 && unitQuantity > 0) {
      return bulkPricePerUnit / unitQuantity;
    }
    return 0;
  };

  const mrpPerBulkUnit = calculateMrpPerBulkUnit();
  const equivalentPricePerPiece = calculatePricePerPieceFromBulk();

  // Get unit icon
  const getUnitIcon = (unit: string) => {
    const iconMap: Record<string, any> = {
      'BAG': ShoppingBag,
      'BOX': Box,
      'CTN': Archive,
      'ROLL': Layers,
      'BOL': Package,
      'DOZ': Circle,
      'GRS': Circle,
      'PCS': Circle,
      'SET': Layers,
      'PAIR': Circle,
      'MTR': Circle,
      'YRD': Circle,
      'KG': Circle,
    };
    return iconMap[unit] || Package;
  };

  const UnitIcon = getUnitIcon(unitOfMeasure);

  // Apply combos to form
  const applyCombos = () => {
    console.log('🎯 [COMBOS] Starting to apply combos...');
    console.log('🖼️ [COMBOS] Current edited images state:', editedImages);
    console.log('⭐ [COMBOS] Main image combo ID:', mainImageComboId);
    
    // NOTE: Price validation removed - prices will be set in the next step (Pricing page)

    // Update combos with edited values and convert to the format expected by parent
    // Note: Prices will be set to 0 for now - they'll be filled in the Pricing step
    // Map to Variant interface field names
    const finalCombos = generatedCombos.map(combo => {
      const basePrice = editedBasePrices[combo.id] ?? combo.basePrice ?? 0;
      // DEFAULT QUANTITY: Set to 10 if not specified (user will adjust in pricing page)
      const quantity = editedQuantities[combo.id] ?? 10;
      const comboImage = editedImages[combo.id];
      
      console.log(`📦 [COMBOS] Processing combo ${combo.color.name}-${combo.size}:`, {
        comboId: combo.id,
        quantity,
        basePrice,
        hasImage: !!comboImage,
        imageUrl: comboImage,
        isMainImage: mainImageComboId === combo.id
      });
      
      return {
        colorOrPattern: combo.color,
        size: combo.size,
        pattern: combo.pattern,
        // Map AutoGenerateCombos field names to Variant field names
        piecePrice: basePrice,  // basePrice -> piecePrice
        dealerPrice: editedPriceForTraders[combo.id] ?? combo.priceForTraders,  // priceForTraders -> dealerPrice
        singleShopPrice: editedPriceForSingleShopRetailers[combo.id] ?? combo.priceForSingleShopRetailers,  // priceForSingleShopRetailers -> singleShopPrice
        multiShopPrice: editedPriceForMultiShopRetailers[combo.id] ?? combo.priceForMultiShopRetailers,  // priceForMultiShopRetailers -> multiShopPrice
        mrpPerPiece: editedMrpPerPiece[combo.id] ?? combo.mrpPerPiece,
        quantity: quantity,
        images: comboImage ? [comboImage] : [],
        imageUrl: comboImage,
        mainImage: mainImageComboId === combo.id // Mark if this is the main image
      };
    });
    
    console.log('✅ [COMBOS] Final combos prepared:', {
      totalCombos: finalCombos.length,
      combosWithImages: finalCombos.filter(c => c.imageUrl).length,
      allImages: finalCombos.map(c => ({ 
        color: c.colorOrPattern.name, 
        size: c.size, 
        hasImage: !!c.imageUrl,
        imageUrl: c.imageUrl 
      }))
    });
    
    onGenerate(finalCombos);
    
    toast.success(`Applied ${finalCombos.length} variants with ${finalCombos.filter(c => c.imageUrl).length} images!`);
  };

  // Export combos as CSV
  const exportCombosAsCSV = () => {
    if (generatedCombos.length === 0) {
      toast.error('No combos to export');
      return;
    }

    const finalCombos = generatedCombos.map(combo => ({
      ...combo,
      quantity: editedQuantities[combo.id] || combo.quantity
    }));

    // Create CSV headers
    const headers = selectedPatterns.length > 0
      ? ['Combo ID', 'Color', 'Size', 'Pattern', 'Quantity']
      : ['Combo ID', 'Color', 'Size', 'Quantity'];

    // Create CSV rows
    const rows = finalCombos.map(combo => {
      const colorName = combo.color.type === 'color' 
        ? combo.color.name 
        : `Pattern: ${combo.color.name}`;
      
      if (combo.pattern) {
        return [combo.id, colorName, combo.size, combo.pattern, combo.quantity].join(',');
      } else {
        return [combo.id, colorName, combo.size, combo.quantity].join(',');
      }
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `combos_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${finalCombos.length} combos to CSV`);
  };

  // Calculate totals
  const totalCombos = generatedCombos.length;

  // Calculate average base price
  const calculateAverageBasePrice = () => {
    if (generatedCombos.length === 0) return 0;
    const totalPrice = generatedCombos.reduce((sum, combo) => {
      const price = editedBasePrices[combo.id] ?? combo.basePrice;
      return sum + price;
    }, 0);
    return totalPrice / generatedCombos.length;
  };

  const avgBasePrice = calculateAverageBasePrice();

  // Calculate average MRP per piece
  const calculateAverageMrpPerPiece = () => {
    if (generatedCombos.length === 0) return 0;
    const totalMrp = generatedCombos.reduce((sum, combo) => {
      const mrp = editedMrpPerPiece[combo.id] ?? combo.mrpPerPiece ?? 0;
      return sum + mrp;
    }, 0);
    return totalMrp / generatedCombos.length;
  };

  const avgMrpPerPiece = calculateAverageMrpPerPiece();

  const expectedCombos = selectedColors.length * selectedSizes.length * 
    (selectedPatterns.length > 0 ? selectedPatterns.length : 1);

  return (
    <div className="space-y-6 w-full max-w-[98vw]">


      {/* Step 1: Select Colors - Inline Form Style */}
      <div className="space-y-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="font-medium">
            Step 1: Select Colors/Patterns ({selectedColors.length} selected)
          </Label>
        </div>
        <div className="space-y-4">
          <ColorInputComponent
            value={currentColorInput}
            onChange={handleColorSelection}
            label="Click colors to add/remove (tick marks show selected)"
            showPreview={true}
            selectedColors={selectedColors}
          />
          
          {/* Visual Preview Gallery */}
          {selectedColors.length > 0 && (
            <div className="border-2 border-purple-300 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-purple-600" />
                <Label className="text-sm font-medium text-purple-800">
                  Selected Colors Preview ({selectedColors.length})
                </Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {selectedColors.map((color, index) => (
                  <div 
                    key={index} 
                    className="group relative border-2 border-purple-200 rounded-lg overflow-hidden hover:border-purple-400 transition-all hover:shadow-md"
                  >
                    {/* Image/Color Preview */}
                    <div className="aspect-square relative">
                      {color.type === 'color' ? (
                        <div 
                          className="w-full h-full"
                          style={{ backgroundColor: color.value }}
                        />
                      ) : color.type === 'pattern' && color.value ? (
                        <img 
                          src={color.value} 
                          alt={color.name || 'Pattern'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-3xl">
                          🎨
                        </div>
                      )}
                      
                      {/* Remove button overlay */}
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Color name label */}
                    <div className="bg-purple-50 px-2 py-1.5 border-t border-purple-200">
                      <p className="text-xs font-medium text-center text-purple-900 truncate">
                        {color.name || color.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {selectedColors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="px-3 py-2 flex items-center gap-2"
              >
                <Check className="h-4 w-4 text-green-600" />
                {color.type === 'color' ? (
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color.value }}
                  />
                ) : (
                  <div className="text-xs">🎨</div>
                )}
                <span>{color.name}</span>
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Sizes - Inline Form Style */}
      <div className="space-y-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <Label className="font-medium">
          Step 2: Select Sizes ({selectedSizes.length} selected)
        </Label>
        
        {/* Standard Sizes */}
        <div>
          <Label className="text-xs text-blue-700 mb-2 block">Standard Sizes</Label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {allStandardSizes.map(size => (
              <Button
                key={size}
                type="button"
                variant={selectedSizes.includes(size) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSize(size)}
                className={selectedSizes.includes(size) ? "bg-blue-600" : ""}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Size Input */}
        <div>
          <Label className="text-xs text-blue-700 mb-2 block">Add Custom Size</Label>
          <div>
            <Input
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="e.g., 46, 3XL, Free Size"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
            />
          </div>
          <div className="flex justify-center mt-2">
            <Button 
              type="button" 
              onClick={addCustomSize}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Check className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </div>
        </div>

        {/* Display all selected sizes */}
        {selectedSizes.length > 0 && (
          <div>
            <Label className="text-xs text-blue-700 mb-2 block">Selected Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {selectedSizes.map((size) => (
                <Badge 
                  key={size} 
                  variant="secondary"
                  className="px-3 py-2 flex items-center gap-2"
                >
                  <span>{size}</span>
                  <button
                    type="button"
                    onClick={() => toggleSize(size)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Optional Patterns - Inline Form Style */}






      {/* Preview Section - Now just shows count, auto-generates */}
      {expectedCombos > 0 && !showPreview && (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{expectedCombos}</p>
            </div>
            <div>
              <p className="font-medium">Generating Combinations...</p>
              <p className="text-sm text-muted-foreground">
                {selectedColors.length} colors × {selectedSizes.length} sizes
                {selectedPatterns.length > 0 && ` × ${selectedPatterns.length} patterns`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Combos Table */}
      {showPreview && generatedCombos.length > 0 && (
        <div className="border-4 rounded-xl shadow-lg border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="p-5 border-b-2 bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-200">
                  <Layers className="h-6 w-6 text-purple-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-purple-800">
                    Items in the group
                  </h4>
                  <p className="text-sm text-purple-700">
                    {generatedCombos.length} variants created
                  </p>
                </div>
              </div>
              
              {/* Quick Apply Quantity Controls */}
              <div className="flex items-center gap-2">
                <Label htmlFor="quick-qty" className="text-sm font-medium text-purple-800 whitespace-nowrap">
                  Quick Apply Qty:
                </Label>
                <Input
                  id="quick-qty"
                  type="number"
                  min="1"
                  placeholder="e.g., 50"
                  className="w-24 h-9 bg-white border-purple-300 focus:border-purple-500"
                  value={quickApplyQuantity}
                  onChange={(e) => setQuickApplyQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleQuickApplyQuantity}
                  className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply to All
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-2">
              {generatedCombos.map((combo) => (
                <div key={combo.id} className="flex items-center justify-between border border-purple-200 rounded-lg p-3 bg-white hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Color */}
                    <div className="flex items-center gap-2">
                      {combo.color.type === 'color' ? (
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-200"
                          style={{ backgroundColor: combo.color.value }}
                        />
                      ) : (
                        (combo.color.type === 'pattern' && combo.color.value) || editedImages[combo.id] ? (
                          <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-white shadow-sm">
                            <img 
                              src={editedImages[combo.id] || combo.color.value} 
                              alt={combo.color.name || "Preview"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs">
                            🎨
                          </div>
                        )
                      )}
                      <span className="font-medium text-sm text-gray-900">{combo.color.name}</span>
                    </div>

                    <div className="h-4 w-px bg-gray-200" />

                    {/* Size */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Size:</span>
                      <Badge variant="secondary" className="font-mono">{combo.size}</Badge>
                    </div>

                    {/* Pattern (if applicable) */}
                    {selectedPatterns.length > 0 && combo.pattern && (
                      <>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Pattern:</span>
                          <span className="text-sm font-medium">{combo.pattern}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quantity Input */}
                    <div className="flex items-center gap-2 mr-2">
                      <Label htmlFor={`qty-${combo.id}`} className="text-xs font-medium text-gray-600">Qty:</Label>
                      <Input 
                        id={`qty-${combo.id}`}
                        type="number" 
                        min="0"
                        placeholder="10"
                        className="w-20 h-8 text-sm bg-white border-purple-200 focus:border-purple-400"
                        value={editedQuantities[combo.id] ?? ''}
                        onChange={(e) => {
                          const valueStr = e.target.value;
                          setEditedQuantities(prev => {
                            const next = { ...prev };
                            if (valueStr === '') {
                              delete next[combo.id];
                            } else {
                              next[combo.id] = parseInt(valueStr);
                            }
                            return next;
                          });
                        }}
                      />
                    </div>

                    <Badge variant="outline" className="text-xs text-gray-400 font-normal">
                      {combo.id}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => deleteCombo(combo.id)}
                      className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Footer */}
          <div className="bg-purple-50 border-t-2 border-purple-300 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <p className="font-semibold text-purple-800">Total Variants Created:</p>
                </div>
                <Badge className="bg-purple-600 text-lg px-4 py-1">
                  {generatedCombos.length}
                </Badge>
              </div>
              
              {/* Main Image Status */}
              {mainImageComboId && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                  <p className="text-xs text-amber-900">
                    <strong>Main Image:</strong> Variant {mainImageComboId} {
                      generatedCombos.find(c => c.id === mainImageComboId) && (
                        <span>
                          ({generatedCombos.find(c => c.id === mainImageComboId)?.color.name} - {generatedCombos.find(c => c.id === mainImageComboId)?.size})
                        </span>
                      )
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Button - Always visible when combos are generated */}
      {showPreview && generatedCombos.length > 0 && (
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowPreview(false);
              setGeneratedCombos([]);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              // If editing and has pricing data, navigate to pricing section
              if (Object.keys(initialPricingData).length > 0 && onNavigateToPricing) {
                onNavigateToPricing();
              } else {
                // Otherwise, apply combos as usual
                applyCombos();
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {Object.keys(initialPricingData).length > 0 
              ? 'See Pricing Details' 
              : existingGroupsCount > 0 
                ? 'Add Next Variant Group' 
                : 'Add Pricing Details'}
          </Button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Save, ChevronLeft, ChevronRight, Check, Package, X, Loader2, Info,
  ChevronsUpDown, Plus, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { StockItem } from './StockCard';
import { AddStockPage3Variants } from './AddStockPage3Variants';
import { AddStockPage4PricingOffers } from './AddStockPage4PricingOffers';
import { AddStockPage4Images } from './AddStockPage4Images';
import { AddStockPage5Review } from './AddStockPage5Review';
import { MobileBottomNavigation } from '../layout/MobileBottomNavigation';
import { MobileHeader } from '../layout/MobileHeader';
import { ColorOrPattern } from '../ui/color-pattern-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import { addDocument, updateDocument } from '../../utils/firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { uploadImages, isStorageAvailable, uploadProductVariantImage } from '../../utils/firebase/storage';
import { VirtualTryOn } from '../vton/VirtualTryOn';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import { useCategories } from '../context/CategoryProvider';
// Import HSN codes safely, with local fallback
import { apparelHSNCodes as importedHSNCodes } from '../../utils/hsnCodes';

// --- Interfaces ---

export interface WizardFormData {
  name: string;
  category: string;
  hsnCode: string;
  description: string;
  fabricType: string;
  fabricDescription: string;
  unitMode: 'individual' | 'bulk';
  unitOfMeasure: string;
  itemCode: string;
  batchCode: string;
  minOrderQuantity: string;
  bulkSellingMode: 'pieces' | 'bulksets';
  price: string;
  mrp: string;
  singleShopPrice: string;
  multiShopPrice: string;
  dealerPrice: string;
  retailerPrice: string;
  hasOffer: boolean;
  offerPrice: string;
  offerType: 'time' | 'quantity';
  offerTimeWeeks: string;
  offerMinQuantity: string;
  deliveryTime: string;
  notes: string;
  tradersOnly: boolean;
  selectedTraders: string[];
}

export interface Variant {
  colorOrPattern: ColorOrPattern;
  size: string;
  quantity: number;
  piecePrice?: number;
  mrpPerPiece?: number;
  singleShopPrice?: number;
  multiShopPrice?: number;
  dealerPrice?: number;
  retailerPrice?: number;
  offerPrice?: number;
  imageUrl?: string;
  images?: string[];
  color?: string;
  mainImage?: boolean;
}

export interface VariantGroup {
  id: string;
  name: string;
  groupNumber?: string;
  variants: Variant[];
  createdAt: Date;
}

interface AddStockWizardProps {
  onSubmit: (stock: Omit<StockItem, 'id' | 'dateAdded'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
  initialStock?: any;
  navigation?: {
    currentPage: string;
    onNavigate: (page: string) => void;
    setActiveTab?: (tab: string) => void;
    cartItemCount?: number;
    notificationCount?: number;
  };
}

const STEPS = [
  { number: 1, title: 'Product Basics', short: 'Basics' },
  { number: 2, title: 'Fabric & Specs', short: 'Specs' },
  { number: 3, title: 'Create Variants', short: 'Variants' },
  { number: 4, title: 'Set Pricing', short: 'Pricing' },
  { number: 5, title: 'Product Images', short: 'Images' },
  { number: 6, title: 'Review & Submit', short: 'Review' }
];

const DEFAULT_FORM_DATA: WizardFormData = {
  name: '', category: '', hsnCode: '', description: '',
  fabricType: '', fabricDescription: '', unitMode: 'individual', unitOfMeasure: 'PCS',
  itemCode: '', batchCode: '', minOrderQuantity: '1', bulkSellingMode: 'pieces',
  price: '', mrp: '', singleShopPrice: '', multiShopPrice: '', dealerPrice: '', retailerPrice: '',
  hasOffer: false, offerPrice: '', offerType: 'time', offerTimeWeeks: '', offerMinQuantity: '',
  deliveryTime: '', notes: '', tradersOnly: false, selectedTraders: []
};

// --- Static Data & Fallbacks ---

const DEFAULT_FABRICS = [
  'Cotton', 'Polyester', 'Cotton Blend', 'Linen', 'Silk', 'Wool',
  'Rayon', 'Viscose', 'Lycra', 'Spandex', 'Denim', 'Canvas',
  'Chiffon', 'Georgette', 'Crepe', 'Khadi', 'Jute', 'Bamboo',
  'Modal', 'Tencel', 'Nylon', 'Acrylic', 'Cashmere', 'Flannel'
];

const INDIVIDUAL_UNITS = [
  { value: 'PCS', label: 'PCS (Pieces)' },
  { value: 'MTR', label: 'MTR (Meters)' },
  { value: 'YRD', label: 'YRD (Yards)' },
  { value: 'KG', label: 'KG (Kilograms)' }
];

const BULK_UNITS = [
  { value: 'SET', label: 'SET (Sets)' },
  { value: 'PAIR', label: 'PAIR (Pairs)' },
  { value: 'DOZ', label: 'DOZ (Dozen)' },
  { value: 'GRS', label: 'GRS (Gross)' },
  { value: 'BAG', label: 'BAG (Bags)' },
  { value: 'BOX', label: 'BOX (Boxes)' },
  { value: 'CTN', label: 'CTN (Cartons)' },
  { value: 'ROLL', label: 'ROLL (Rolls)' },
  { value: 'BOL', label: 'BOL (Bales)' }
];

// Fallback HSN Codes in case import fails
const FALLBACK_HSN_CODES = [
  { code: '6101', gstRate: 12, description: "Men's or boys' overcoats, car-coats, capes, cloaks, anoraks (including ski-jackets), wind-cheaters, wind-jackets and similar articles, knitted or crocheted, other than those of heading 6103" },
  { code: '6102', gstRate: 12, description: "Women's or girls' overcoats, car-coats, capes, cloaks, anoraks (including ski-jackets), wind-cheaters, wind-jackets and similar articles, knitted or crocheted, other than those of heading 6104" },
  { code: '6103', gstRate: 12, description: "Men's or boys' suits, ensembles, jackets, blazers, trousers, bib and brace overalls, breeches and shorts (other than swimwear), knitted or crocheted" },
  { code: '6104', gstRate: 12, description: "Women's or girls' suits, ensembles, jackets, blazers, dresses, skirts, divided skirts, trousers, bib and brace overalls, breeches and shorts (other than swimwear), knitted or crocheted" },
  { code: '6105', gstRate: 12, description: "Men's or boys' shirts, knitted or crocheted" },
  { code: '6106', gstRate: 12, description: "Women's or girls' blouses, shirts and shirt-blouses, knitted or crocheted" },
  { code: '6109', gstRate: 12, description: "T-shirts, singlets and other vests, knitted or crocheted" },
  { code: '6203', gstRate: 12, description: "Men's or boys' suits, ensembles, jackets, blazers, trousers, bib and brace overalls, breeches and shorts (other than swimwear)" },
  { code: '6204', gstRate: 12, description: "Women's or girls' suits, ensembles, jackets, blazers, dresses, skirts, divided skirts, trousers, bib and brace overalls, breeches and shorts (other than swimwear)" }
];

// --- Smart Combobox Component ---

interface SmartComboboxProps {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string; meta?: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  addNewLabel?: string;
  onAddNew?: (newValue: string) => void;
}

function SmartCombobox({
  value, onChange, items = [], placeholder = "Select...",
  searchPlaceholder = "Search...", addNewLabel = "Add New", onAddNew
}: SmartComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const safeItems = Array.isArray(items) ? items : [];
  const selectedItem = safeItems.find(item => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={0}
          className="w-full flex items-center justify-between h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-normal hover:bg-slate-50 hover:text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#FF8C42] transition-all cursor-pointer"
        >
          {selectedItem ? (
            <span className="truncate flex-1 text-left">{selectedItem.label}</span>
          ) : value ? (
            <span className="truncate flex-1 text-left">{value}</span>
          ) : (
            <span className="text-slate-400 truncate flex-1 text-left">{placeholder}</span>
          )}
          <div className="flex items-center gap-2 ml-2">
            {onAddNew && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNew('');
                }}
                className="p-1 hover:bg-orange-100 text-slate-400 hover:text-[#FF8C42] rounded-full transition-colors"
                title={addNewLabel}
              >
                <Plus className="h-4 w-4" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 rounded-xl shadow-lg border-slate-100 z-[10000]"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} onValueChange={setQuery} className="h-11" />
          <CommandList className="max-h-[240px]">
            <CommandEmpty className="py-2 px-2 text-sm text-center text-slate-500">
              {onAddNew ? (
                <button
                  type="button"
                  onClick={() => {
                    onAddNew(query);
                    setOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-orange-50 text-[#FF8C42] hover:bg-orange-100 transition-colors font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add "{query}"
                </button>
              ) : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {safeItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Use label for search
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer py-2.5 px-3 aria-selected:bg-orange-50 aria-selected:text-orange-900 rounded-lg my-0.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-[#FF8C42]",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.meta && <span className="text-xs text-slate-400 font-normal truncate">{item.meta}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// --- Main Wizard Component ---

export function AddStockWizard({ onSubmit, onCancel, navigation, isEditing = false, initialStock }: AddStockWizardProps) {
  const { user } = useAuth();

  // Safe consumption of context
  const categoryContext = useCategories();
  const categories = categoryContext?.categories || [];
  const addCategory = categoryContext?.addCategory || ((name: string) => console.warn('addCategory not available', name));

  // Safe consumption of HSN codes
  const apparelHSNCodes = Array.isArray(importedHSNCodes) ? importedHSNCodes : FALLBACK_HSN_CODES;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigationPage, setPendingNavigationPage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Modals State ---
  const [newItemDialog, setNewItemDialog] = useState<{
    open: boolean;
    type: 'category' | 'hsn' | 'fabric' | 'unit' | null;
    value: string;
  }>({ open: false, type: null, value: '' });

  // --- Dynamic Lists ---
  const [fabricList, setFabricList] = useState<string[]>(DEFAULT_FABRICS);
  const [customUnits, setCustomUnits] = useState<{ value: string, label: string }[]>([]);

  // --- Form State ---
  const [formData, setFormData] = useState<WizardFormData>(DEFAULT_FORM_DATA);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [vtonImageUrl, setVtonImageUrl] = useState<string | null>(null);
  const [showVtonPreview, setShowVtonPreview] = useState(false);
  const [selectedVtonPattern, setSelectedVtonPattern] = useState<string | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [tempVariantsForPricing, setTempVariantsForPricing] = useState<Variant[] | null>(null);
  const [pendingGroupName, setPendingGroupName] = useState('');
  const [pendingGroupNumber, setPendingGroupNumber] = useState('');

  // --- Helpers ---
  const dataURLtoBlob = (dataurl: string): Blob => {
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    } catch (e) { return new Blob([]); }
  };

  useEffect(() => {
    const interval = setInterval(() => saveDraft(), 30000);
    return () => clearInterval(interval);
  }, [formData, variants, variantGroups, tempVariantsForPricing]);

  useEffect(() => { loadDraft(); }, []);

  // Initialize from initialStock if provided (Edit Mode)
  useEffect(() => {
    if (isEditing && initialStock) {
      console.log('📝 Initializing wizard in Edit Mode with:', initialStock);

      // Map initialStock to formData
      setFormData({
        name: initialStock.name || '',
        category: initialStock.category || '',
        hsnCode: initialStock.hsn_code || initialStock.hsnCode || '',
        description: initialStock.description || '',
        fabricType: initialStock.fabric_type || initialStock.fabricType || '',
        fabricDescription: initialStock.fabric_description || initialStock.fabricDescription || '',
        unitMode: initialStock.unit_mode || initialStock.unitMode || 'individual',
        unitOfMeasure: initialStock.unit_of_measure || initialStock.unitOfMeasure || 'PCS',
        itemCode: initialStock.item_code || initialStock.itemCode || '',
        batchCode: initialStock.batch_code || initialStock.batchCode || '',
        minOrderQuantity: String(initialStock.min_order_quantity || initialStock.minOrderQuantity || '1'),
        bulkSellingMode: initialStock.bulk_selling_mode || initialStock.bulkSellingMode || 'pieces',
        price: String(initialStock.base_price || initialStock.price || ''),
        mrp: initialStock.mrp ? String(initialStock.mrp) : '',
        singleShopPrice: (initialStock.single_shop_price || initialStock.singleShopPrice) ? String(initialStock.single_shop_price || initialStock.singleShopPrice) : '',
        multiShopPrice: (initialStock.multi_shop_price || initialStock.multiShopPrice) ? String(initialStock.multi_shop_price || initialStock.multiShopPrice) : '',
        dealerPrice: (initialStock.dealer_price || initialStock.dealerPrice) ? String(initialStock.dealer_price || initialStock.dealerPrice) : '',
        retailerPrice: (initialStock.retailer_price || initialStock.retailerPrice) ? String(initialStock.retailer_price || initialStock.retailerPrice) : '',
        hasOffer: initialStock.has_offer || initialStock.hasOffer || false,
        offerPrice: (initialStock.offer_price || initialStock.offerPrice) ? String(initialStock.offer_price || initialStock.offerPrice) : '',
        offerType: initialStock.offer_type || initialStock.offerType || 'time',
        offerTimeWeeks: (initialStock.offer_time_weeks || initialStock.offerTimeWeeks) ? String(initialStock.offer_time_weeks || initialStock.offerTimeWeeks) : '',
        offerMinQuantity: (initialStock.offer_min_quantity || initialStock.offerMinQuantity) ? String(initialStock.offer_min_quantity || initialStock.offerMinQuantity) : '',
        deliveryTime: initialStock.delivery_time || initialStock.deliveryTime || '',
        notes: initialStock.notes || '',
        tradersOnly: initialStock.traders_only || initialStock.tradersOnly || false,
        selectedTraders: initialStock.selected_traders || initialStock.selectedTraders || []
      });

      // Restore variants/groups
      if (initialStock.variant_groups) {
        // Map backend group format to wizard format
        const restoredGroups = initialStock.variant_groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          groupNumber: g.group_number || g.groupNumber,
          variants: g.variants || [],
          createdAt: new Date()
        }));
        setVariantGroups(restoredGroups);
      } else if (initialStock.variants && initialStock.variants.length > 0) {
        // Backward compatibility for flat variants
        const defaultGroup: VariantGroup = {
          id: 'default-group',
          name: 'Default Group',
          variants: initialStock.variants,
          createdAt: new Date()
        };
        setVariantGroups([defaultGroup]);
      }

      // Restore images
      if (initialStock.images && initialStock.images.length > 0) {
        setProductImages(initialStock.images);
      }
      
      if (initialStock.vtonImageUrl) {
        setVtonImageUrl(initialStock.vtonImageUrl);
      }

      if (initialStock.mainImageIndex !== undefined) {
        setMainImageIndex(initialStock.mainImageIndex);
      }
    }
  }, [isEditing, initialStock]);

  // Auto-generate Item Code
  useEffect(() => {
    if (!formData.itemCode && formData.category) {
      const prefix = formData.category.substring(0, 1).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, itemCode: `${prefix}${randomNum}` }));
    }
  }, [formData.category]);

  // Adjust Unit on Mode Change
  useEffect(() => {
    const isIndividual = formData.unitMode === 'individual';
    const currentUnits = isIndividual ? INDIVIDUAL_UNITS : BULK_UNITS;
    const isMismatch = !currentUnits.some(u => u.value === formData.unitOfMeasure) &&
      !customUnits.some(u => u.value === formData.unitOfMeasure);

    if (isMismatch) {
      setFormData(prev => ({ ...prev, unitOfMeasure: isIndividual ? 'PCS' : 'SET' }));
    }
  }, [formData.unitMode]);

  const saveDraft = () => {
    try {
      const draft = {
        formData, variants, variantGroups, tempVariantsForPricing,
        pendingGroupName, pendingGroupNumber, productImages, vtonImageUrl, mainImageIndex,
        currentStep, timestamp: new Date().toISOString()
      };
      localStorage.setItem('calico_add_stock_draft', JSON.stringify(draft));
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (error) { console.error('Error saving draft:', error); }
  };

  const loadDraft = () => {
    // Skip loading draft if editing
    if (isEditing) return;

    try {
      const savedDraft = localStorage.getItem('calico_add_stock_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData || formData);
        setVariants(draft.variants || []);
        setVariantGroups(draft.variantGroups || []);
        setTempVariantsForPricing(draft.tempVariantsForPricing || null);
        setPendingGroupName(draft.pendingGroupName || '');
        setPendingGroupNumber(draft.pendingGroupNumber || '');
        setProductImages(draft.productImages || []);
        setVtonImageUrl(draft.vtonImageUrl || null);
        setMainImageIndex(draft.mainImageIndex || 0);

        let savedStep = draft.currentStep || 1;
        // Migration logic: If user had an old draft that was on step 4 or 5, bump them up since we inserted a new Step 4.
        if (savedStep > 3) savedStep += 1;
        // Safety clamp: never let the step exceed the total number of wizard steps
        savedStep = Math.min(savedStep, STEPS.length);

        setCurrentStep(savedStep);
        setLastSaved(new Date(draft.timestamp));
      }
    } catch (error) { console.error('Error loading draft:', error); }
  };

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleAddNewItem = () => {
    const { type, value } = newItemDialog;
    if (!value.trim() || !type) return;

    if (type === 'category') {
      if (addCategory) addCategory(value.trim());
      updateFormData({ category: value.trim() });
    } else if (type === 'hsn') {
      updateFormData({ hsnCode: value.trim() });
    } else if (type === 'fabric') {
      setFabricList(prev => [...prev, value.trim()]);
      updateFormData({ fabricType: value.trim() });
    } else if (type === 'unit') {
      const newUnit = { value: value.trim().toUpperCase(), label: value.trim().toUpperCase() };
      setCustomUnits(prev => [...prev, newUnit]);
      updateFormData({ unitOfMeasure: newUnit.value });
    }

    setNewItemDialog({ open: false, type: null, value: '' });
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added!`);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!(formData.name?.trim() && formData.category?.trim());
      case 2:
        return !!(formData.unitOfMeasure && formData.minOrderQuantity &&
          !isNaN(Number(formData.minOrderQuantity)) && Number(formData.minOrderQuantity) > 0);
      case 3: return true; // variantGroups.length > 0;
      case 4: return true;
      case 5: return productImages.length > 0;
      default: return true;
    }
  };

  // Auto-import images when entering Step 4
  useEffect(() => {
    if (currentStep === 4) {
      const allVariantImages = new Set<string>();

      // 1. Collect from saved groups
      variantGroups.forEach(group => {
        group.variants.forEach(v => {
          if (v.imageUrl) allVariantImages.add(v.imageUrl);
          if (v.images && v.images.length > 0) v.images.forEach(img => allVariantImages.add(img));
        });
      });

      // 2. Collect from pending variants (if any)
      variants.forEach(v => {
        if (v.imageUrl) allVariantImages.add(v.imageUrl);
        if (v.images && v.images.length > 0) v.images.forEach(img => allVariantImages.add(img));
      });

      // 3. Collect from temp variants (if any)
      if (tempVariantsForPricing) {
        tempVariantsForPricing.forEach(v => {
          if (v.imageUrl) allVariantImages.add(v.imageUrl);
          if (v.images && v.images.length > 0) v.images.forEach(img => allVariantImages.add(img));
        });
      }

      if (allVariantImages.size > 0) {
        setProductImages(prev => {
          const existing = new Set(prev);
          const newImgs = Array.from(allVariantImages).filter(img => !existing.has(img));
          if (newImgs.length > 0) {
            toast.success(`Imported ${newImgs.length} new images from variants`);
            return [...prev, ...newImgs];
          }
          return prev;
        });
      }
    }
  }, [currentStep, variantGroups, variants, tempVariantsForPricing]);

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Please complete all required fields.');
      return;
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      const contentArea = document.getElementById('wizard-content-area');
      if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Check if form has any user input
  const isFormDirty = React.useMemo(() => {
    const isFormDataChanged = JSON.stringify(formData) !== JSON.stringify(DEFAULT_FORM_DATA);
    const hasVariants = variants.length > 0;
    const hasGroups = variantGroups.length > 0;
    const hasImages = productImages.length > 0;

    return isFormDataChanged || hasVariants || hasGroups || hasImages;
  }, [formData, variants, variantGroups, productImages]);

  const handleCancel = () => {
    if (isFormDirty) {
      setShowDiscardDialog(true);
    } else {
      // Ensure navigation state is reset to home as a safe default
      if (navigation?.setActiveTab) {
        navigation.setActiveTab('home');
      }
      onCancel();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      const contentArea = document.getElementById('wizard-content-area');
      if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleCancel();
    }
  };

  const finalizePendingGroup = () => {
    if (variants && variants.length > 0) {
      const newGroup: VariantGroup = {
        id: `group-${Date.now()}`,
        name: pendingGroupName || `Group ${variantGroups.length + 1}`,
        groupNumber: pendingGroupNumber || undefined,
        variants: variants,
        createdAt: new Date()
      };
      setVariantGroups([...variantGroups, newGroup]);
      setVariants([]);
      setTempVariantsForPricing(null);
      setPendingGroupName('');
      setPendingGroupNumber('');
    }
  };

  const handleSubmitClick = () => {
    console.log('🔵 [PUBLISH] Submit button clicked');
    console.log('📊 [PUBLISH] Form validation:', {
      canProceed: canProceed(),
      currentStep,
      formData,
      variantGroups: variantGroups.length,
      productImages: productImages.length
    });

    if (canProceed()) {
      console.log('✅ [PUBLISH] Validation passed, showing confirmation dialog');
      setShowConfirmDialog(true);
    } else {
      console.error('❌ [PUBLISH] Validation failed - cannot proceed');
      toast.error('Please complete all required fields before publishing');
    }
  };

  const handleConfirmedSubmit = async () => {
    console.log('🚀 [PUBLISH] Starting submission process...');
    setIsSubmitting(true);

    const urlToFile = async (url: string, filename: string, mimeType: string = 'image/jpeg'): Promise<File> => {
      const res = await fetch(url);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type || mimeType });
    };

    try {
      const { isFirebaseDemoMode, firebaseDb, firebaseAuth } = await import('../../utils/firebase/config');
      console.log('🔧 [PUBLISH] Firebase config loaded:', {
        isFirebaseDemoMode,
        hasDb: !!firebaseDb,
        hasAuth: !!firebaseAuth,
        currentUser: firebaseAuth?.currentUser?.uid
      });

      const currentUserId = user?.id || firebaseAuth?.currentUser?.uid || 'temp';
      const timestamp = Date.now();

      let finalProductImages = [...productImages];
      let finalVtonImageUrl = vtonImageUrl;
      if (!isFirebaseDemoMode && isStorageAvailable() && (productImages.length > 0 || vtonImageUrl)) {
        console.log('📤 [PUBLISH] Processing main images...', productImages.length);
        const filesToUpload: File[] = [];
        const indicesToReplace: number[] = [];

        for (let i = 0; i < productImages.length; i++) {
          const img = productImages[i];
          if (img.startsWith('data:') || img.startsWith('blob:')) {
            try {
              // Ensure we have a valid file to upload
              const file = await urlToFile(img, `image_${timestamp}_${i}.jpg`);
              filesToUpload.push(file);
              indicesToReplace.push(i);
            } catch (err) {
              console.error('Failed to convert main image to file:', img, err);
            }
          }
        }

        if (filesToUpload.length > 0) {
          console.log('⬆️ [PUBLISH] Uploading', filesToUpload.length, 'main images...');
          const uploadedUrls = await uploadImages(filesToUpload, `products/${currentUserId}/${timestamp}`);
          uploadedUrls.forEach((url, i) => finalProductImages[indicesToReplace[i]] = url);
          console.log('✅ [PUBLISH] Main images uploaded successfully');
        }
        
        // Handle VTON Image Upload
        if (vtonImageUrl && (vtonImageUrl.startsWith('data:') || vtonImageUrl.startsWith('blob:'))) {
          try {
            console.log('⬆️ [PUBLISH] Uploading VTON baseline image...');
            const file = await urlToFile(vtonImageUrl, `vton_${timestamp}.jpg`);
            const urls = await uploadImages([file], `products/${currentUserId}/vton`);
            finalVtonImageUrl = urls[0];
            console.log('✅ [PUBLISH] VTON image uploaded successfully');
          } catch (err) {
            console.error('Failed to convert/upload VTON image:', err);
          }
        }
      }

      const processedVariantGroups = JSON.parse(JSON.stringify(variantGroups));

      if (!isFirebaseDemoMode && isStorageAvailable()) {
        console.log('📤 [PUBLISH] Check & Upload Variant Images...');
        const groups = processedVariantGroups as VariantGroup[];

        // Helper: Upload a pattern image
        // Helper: Upload a pattern image
        const uploadPattern = async (blobUrl: string, name: string): Promise<string> => {
          try {
            console.log(`Uploading pattern image: ${name}`);
            const file = await urlToFile(blobUrl, `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`);
            // Use 'products/patterns' path to be safer with storage rules
            const urls = await uploadImages([file], `products/${currentUserId}/patterns`);
            return urls[0];
          } catch (e) {
            console.error('Failed to upload pattern image', e);
            toast.error(`Failed to upload pattern image for ${name}`);
            return blobUrl;
          }
        };

        // Cache for uploaded patterns to avoid duplicate uploads
        const patternCache: Record<string, string> = {};

        for (const group of groups) {
          for (const variant of group.variants) {
            // A. Handle Pattern Images (ColorOrPattern)
            if (variant.colorOrPattern?.type === 'pattern' && variant.colorOrPattern.value && (variant.colorOrPattern.value.startsWith('blob:') || variant.colorOrPattern.value.startsWith('data:'))) {
              const blobUrl = variant.colorOrPattern.value;
              if (!patternCache[blobUrl]) {
                const newUrl = await uploadPattern(blobUrl, variant.colorOrPattern.name || 'pattern');
                patternCache[blobUrl] = newUrl;
              }
              variant.colorOrPattern.value = patternCache[blobUrl];
            }

            // B. Handle Variant-Specific Images
            if (variant.imageUrl && (variant.imageUrl.startsWith('blob:') || variant.imageUrl.startsWith('data:'))) {
              try {
                console.log(`Uploading variant image for ${variant.colorOrPattern?.name || 'variant'}...`);
                const variantId = `${group.id}_${variant.size}_${Math.random().toString(36).substr(2, 5)}`;
                const file = await urlToFile(variant.imageUrl, `var_${variantId}.jpg`);
                const url = await uploadProductVariantImage(file, currentUserId, variantId);
                variant.imageUrl = url;

                // Sync with images array if present
                if (variant.images && variant.images.length > 0) {
                  variant.images = variant.images.map(img =>
                    (img.startsWith('blob:') || img.startsWith('data:')) ? url : img
                  );
                  if (!variant.images.includes(url)) variant.images.unshift(url);
                }
              } catch (e) {
                console.error('Failed to upload variant image', e);
              }
            }

            // C. Handle Remaining Images in Array
            if (variant.images && variant.images.length > 0) {
              const newImages = [];
              for (let i = 0; i < variant.images.length; i++) {
                const img = variant.images[i];
                if ((img.startsWith('blob:') || img.startsWith('data:')) && !img.includes('firebasestorage')) {
                  try {
                    if (img !== variant.imageUrl) {
                      const variantId = `${group.id}_${variant.size}_${i}_${Math.random().toString(36).substr(2, 5)}`;
                      const file = await urlToFile(img, `var_extra_${variantId}.jpg`);
                      const url = await uploadProductVariantImage(file, currentUserId, variantId);
                      newImages.push(url);
                    } else {
                      newImages.push(img);
                    }
                  } catch (e) {
                    console.error('Failed to upload extra variant image', e);
                    newImages.push(img);
                  }
                } else {
                  newImages.push(img);
                }
              }
              variant.images = newImages;
            }
          }
        }
      }

      const allVariants = processedVariantGroups.flatMap((group: any) => group.variants);
      const basePrice = allVariants.length > 0 ? (allVariants[0].piecePrice || 0) : parseFloat(formData.price || '0');

      console.log('📦 [PUBLISH] Variants processed:', {
        totalVariants: allVariants.length,
        basePrice,
        totalQuantity: allVariants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0),
        variantsWithImages: allVariants.filter((v: any) => v.imageUrl || (v.images && v.images.length > 0)).length
      });

      // DEBUG: Log first few variant image URLs to confirm upload
      if (allVariants.length > 0) {
        console.log('🔍 [PUBLISH] First Variant Images:', {
          imageUrl: allVariants[0].imageUrl,
          images: allVariants[0].images,
          pattern: allVariants[0].colorOrPattern?.value
        });
      }

      const stockItem: Omit<StockItem, 'id' | 'dateAdded'> = {
        name: formData.name,
        category: formData.category || '',
        hsnCode: formData.hsnCode || '',
        description: formData.description || '',
        size: '', color: '',
        quantity: allVariants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0),
        price: basePrice,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        singleShopPrice: formData.singleShopPrice ? parseFloat(formData.singleShopPrice) : undefined,
        multiShopPrice: formData.multiShopPrice ? parseFloat(formData.multiShopPrice) : undefined,
        dealerPrice: formData.dealerPrice ? parseFloat(formData.dealerPrice) : undefined,
        retailerPrice: formData.retailerPrice ? parseFloat(formData.retailerPrice) : undefined,
        minOrderQuantity: parseInt(formData.minOrderQuantity || '1'),
        fabricType: formData.fabricType || '',
        fabricDescription: formData.fabricDescription || '',
        deliveryTime: formData.deliveryTime as any,
        itemCode: formData.itemCode || '',
        unitOfMeasure: formData.unitOfMeasure || 'PCS',
        batchCode: formData.batchCode || '',
        variants: allVariants,
        images: finalProductImages || [],
        vtonImageUrl: finalVtonImageUrl || undefined,
        mainImageIndex: mainImageIndex || 0,
        notes: formData.notes || '',
        tradersOnly: formData.tradersOnly || false,
        selectedTraders: formData.selectedTraders || [],
        hasOffer: formData.hasOffer || false,
        offerPrice: formData.hasOffer && formData.offerPrice ? parseFloat(formData.offerPrice) : undefined,
        offerType: formData.offerType || 'time',
        offerTimeWeeks: formData.hasOffer && formData.offerTimeWeeks ? parseInt(formData.offerTimeWeeks) : undefined,
        offerMinQuantity: formData.hasOffer && formData.offerMinQuantity ? parseInt(formData.offerMinQuantity) : undefined,
        supplier: user?.company || 'Demo Company',
        sellerId: user?.id || (firebaseAuth?.currentUser?.uid),
        supplierType: (user?.role === 'manufacturer' ? 'manufacturer' : 'trader') as any,
        location: user?.profile?.address?.city || 'India',
        unitMode: formData.unitMode || 'individual',
        bulkSellingMode: formData.bulkSellingMode || 'pieces'
      };

      console.log('💾 [PUBLISH] Stock item prepared:', {
        name: stockItem.name,
        productImages: stockItem.images.length
      });

      // Mapping helper for Supabase snake_case
      const mapToSupabase = (item: any) => ({
        name: item.name,
        category: item.category,
        hsn_code: item.hsnCode,
        description: item.description,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        base_price: item.price || item.basePrice,
        mrp: item.mrp,
        single_shop_price: item.singleShopPrice,
        multi_shop_price: item.multiShopPrice,
        dealer_price: item.dealerPrice,
        retailer_price: item.retailerPrice,
        min_order_quantity: item.minOrderQuantity,
        fabric_type: item.fabricType,
        fabric_description: item.fabricDescription,
        delivery_time: item.deliveryTime,
        item_code: item.itemCode,
        unit_of_measure: item.unitOfMeasure,
        batch_code: item.batchCode,
        variants: item.variants,
        images: item.images,
        vton_image_url: item.vtonImageUrl,
        main_image_index: item.mainImageIndex,
        notes: item.notes,
        traders_only: item.tradersOnly,
        selected_traders: item.selectedTraders,
        has_offer: item.hasOffer,
        offer_price: item.offerPrice,
        offer_type: item.offerType,
        offer_time_weeks: item.offerTimeWeeks,
        offer_min_quantity: item.offerMinQuantity,
        supplier: user?.company || 'Demo Company',
        supplier_type: (user?.role === 'manufacturer' ? 'manufacturer' : 'trader'),
        location: item.location,
        unit_mode: item.unitMode,
        bulk_selling_mode: item.bulkSellingMode,
        gst_number: user?.id || 'demo_company',
        // seller_id & company_id are UUID columns — omit them when user has no Supabase Auth UUID
        // identity is tracked via gst_number + seller_company
        seller_company: user?.company || 'Demo Company',
        status: 'active',
        variant_groups: processedVariantGroups.map((group: any) => ({
          id: group.id,
          name: group.name,
          group_number: group.groupNumber,
          variants: group.variants
        }))
      });

      let stockId: string | null = null;
      
      // We always use the Supabase shim (addDocument/updateDocument)
      if (isEditing && initialStock?.id) {
        console.log('🔄 [PUBLISH] Updating existing stock:', initialStock.id);
        const success = await updateDocument('stock_items', initialStock.id, {
          ...mapToSupabase(stockItem),
          updated_at: new Date().toISOString()
        });
        stockId = success ? initialStock.id : null;
        console.log(success ? '✅ [PUBLISH] Update successful' : '❌ [PUBLISH] Update failed');
      } else {
        console.log('➕ [PUBLISH] Adding new stock item to Supabase...');
        const itemToAdd = mapToSupabase(stockItem);
        stockId = await addDocument('stock_items', itemToAdd);
        console.log('📄 [PUBLISH] Document added with ID:', stockId);
      }

      if (stockId) {
        console.log('🎉 [PUBLISH] Success! Stock ID:', stockId);
        toast.success(isEditing ? 'Stock item updated successfully!' : 'Stock item published successfully!');

        // Ensure ID is passed back so EditStockForm's hook can update the cache
        const finalItemToSubmit = isEditing && stockId ? { id: stockId, ...stockItem } : stockItem;
        onSubmit(finalItemToSubmit);

        localStorage.removeItem('calico_add_stock_draft');
        setShowConfirmDialog(false);
      } else {
        console.error('❌ [PUBLISH] Stock insert failed — likely a Supabase RLS policy or schema mismatch. Check the console for the addDoc error above.');
        toast.error('Failed to save stock item. Database policy blocked the insert — please check Supabase RLS on the stock_items table.', { duration: 8000 });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('💥 [PUBLISH] Error during submission:', error);
      console.error('Stack trace:', error?.stack);
      toast.error(error?.message || 'Error saving item. Check console for details.');
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 6) * 100;
  const AccentColor = '#FF8C42';

  // Add this handler
  const handleOpenVtonPreview = (patternUrl: string) => {
    console.log('👗 Opening VTON Preview with pattern:', patternUrl);
    setSelectedVtonPattern(patternUrl);
    setShowVtonPreview(true);
  };

  const handleSafeNavigation = (page: string) => {
    if (!isFormDirty) {
      // If form is clean, navigate immediately without dialog
      if (navigation?.onNavigate) {
        navigation.onNavigate(page);
      } else if (onCancel) {
        onCancel();
      }
      return;
    }
    setPendingNavigationPage(page);
    setShowDiscardDialog(true);
  };

  const handleConfirmDiscard = () => {
    localStorage.removeItem('calico_add_stock_draft');

    if (pendingNavigationPage) {
      if (navigation?.onNavigate) {
        navigation.onNavigate(pendingNavigationPage);
      } else if (onCancel) {
        onCancel();
      }
    } else {
      // Reset form or close if editing
      if (isEditing) {
        if (onCancel) onCancel();
        return;
      }

      setFormData(DEFAULT_FORM_DATA);
      setVariants([]);
      setVariantGroups([]);
      setProductImages([]);
      setVtonImageUrl(null);
      setMainImageIndex(0);
      setCurrentStep(1);
      setTempVariantsForPricing(null);
      setPendingGroupName('');
      setPendingGroupNumber('');
      setLastSaved(null);

      // Close the form
      if (navigation?.setActiveTab) {
        navigation.setActiveTab('home');
      }

      if (onCancel) {
        onCancel();
      } else if (navigation?.onNavigate) {
        // Fallback if onCancel is not provided but navigation is
        navigation.onNavigate('my-stock');
      }

      toast.success('Form discarded');
    }

    setShowDiscardDialog(false);
    setPendingNavigationPage(null);
  };

  // --- Render ---
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#F8F9FA] flex flex-col h-[100dvh] font-sans text-slate-900 pointer-events-auto touch-auto isolate">

      {/* Global Header */}
      <MobileHeader
        title={isEditing ? "Edit Stock" : "Add Stock"}
        showBack={false}
        onNavigate={handleSafeNavigation}
        cartItemCount={navigation?.cartItemCount}
        notificationCount={navigation?.notificationCount}
      />

      {/* 1. Header (Wizard specific) */}
      <div className="flex-none h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-40 shadow-sm relative">
        <div className="flex items-center -ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="hover:bg-slate-50 text-slate-500 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiscardDialog(true)}
            className="hover:bg-red-50 text-slate-400 hover:text-red-500 px-2 ml-1 h-8 text-xs font-medium"
          >
            Discard
          </Button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-800">{isEditing ? "Edit Product" : "New Product"}</span>
        </div>
        <div className="w-9 flex justify-end">
          {lastSaved && (
            <div className="h-2 w-2 rounded-full bg-green-500" title="Draft saved" />
          )}
        </div>
      </div>

      {/* Progress Line */}
      <div className="h-1 w-full bg-slate-100">
        <motion.div
          className="h-full bg-[#FF8C42]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* 2. Main Content */}
      <div
        id="wizard-content-area"
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth"
      >
        <div className="min-h-full py-6 px-4 md:px-8 flex justify-center pb-32">
          <div className="w-full max-w-[95%] xl:max-w-[1800px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full space-y-4"
              >
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-[#FF8C42] font-bold text-sm">
                    {currentStep}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {STEPS[currentStep - 1]?.title ?? ''}
                  </h2>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden p-6 md:p-8 space-y-6">

                  {/* STEP 1: BASICS */}
                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2 lg:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => updateFormData({ name: e.target.value })}
                          placeholder="e.g. Cotton T-Shirt"
                          className="h-12 text-lg focus:border-[#FF8C42] focus:ring-orange-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</Label>
                        <SmartCombobox
                          value={formData.category}
                          onChange={(val) => updateFormData({ category: val })}
                          items={categories.map(c => ({ value: c, label: c }))}
                          placeholder="Select Category..."
                          onAddNew={(val) => setNewItemDialog({ open: true, type: 'category', value: val })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">HSN Code (GST)</Label>
                        <SmartCombobox
                          value={formData.hsnCode}
                          onChange={(val) => updateFormData({ hsnCode: val })}
                          items={apparelHSNCodes.map(h => ({
                            value: h.code,
                            label: `${h.code}: ${h.description}`
                          }))}
                          placeholder="Select HSN Code..."
                          searchPlaceholder="Search by code or description..."
                          onAddNew={(val) => setNewItemDialog({ open: true, type: 'hsn', value: val })}
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Product details..."
                          className="min-h-[120px] focus:border-[#FF8C42] focus:ring-orange-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: FABRIC & SPECS */}
                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fabric Type</Label>
                        <SmartCombobox
                          value={formData.fabricType}
                          onChange={(val) => updateFormData({ fabricType: val })}
                          items={fabricList.map(f => ({ value: f, label: f }))}
                          placeholder="Select Fabric..."
                          onAddNew={(val) => setNewItemDialog({ open: true, type: 'fabric', value: val })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fabric Description</Label>
                        <Textarea
                          value={formData.fabricDescription}
                          onChange={(e) => updateFormData({ fabricDescription: e.target.value })}
                          placeholder="Composition, feel, etc."
                          className="focus:border-[#FF8C42] focus:ring-orange-100"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 lg:col-span-2">
                        <Label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">Stock Unit Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => updateFormData({ unitMode: 'individual' })}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all",
                              formData.unitMode === 'individual'
                                ? "bg-white border-[#FF8C42] ring-1 ring-orange-200 shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <div className="font-semibold text-sm mb-1">Individual</div>
                            <div className="text-xs text-slate-500">PCS, MTR, KG</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFormData({ unitMode: 'bulk' })}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all",
                              formData.unitMode === 'bulk'
                                ? "bg-white border-[#FF8C42] ring-1 ring-orange-200 shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <div className="font-semibold text-sm mb-1">Bulk Sets</div>
                            <div className="text-xs text-slate-500">Sets, Dozens, Boxes</div>
                          </button>

                          {formData.unitMode === 'bulk' && (
                            <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                              <div className="flex items-center gap-2 mb-3">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selling Mode</Label>
                                <div className="group relative">
                                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                  <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-normal leading-relaxed">
                                    This determines how the item appears in the catalog.
                                    <strong>Flexible:</strong> Buyers pick specific sizes.
                                    <strong>Set:</strong> Buyers must buy full sets.
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => updateFormData({ bulkSellingMode: 'pieces' })}
                                  className={cn(
                                    "p-3 rounded-xl border text-left transition-all relative",
                                    formData.bulkSellingMode === 'pieces'
                                      ? "bg-orange-50/50 border-[#FF8C42] ring-1 ring-orange-200 shadow-sm"
                                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  )}
                                >
                                  {formData.bulkSellingMode === 'pieces' && (
                                    <div className="absolute top-2 right-2 text-[#FF8C42]">
                                      <Check className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className={cn("font-semibold text-sm mb-1", formData.bulkSellingMode === 'pieces' ? "text-orange-900" : "text-slate-700")}>
                                    Flexible Selection
                                  </div>
                                  <div className="text-xs text-slate-500 leading-snug pr-4">
                                    Sell as individual pieces. Buyers choose specific sizes.
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFormData({ bulkSellingMode: 'bulksets' })}
                                  className={cn(
                                    "p-3 rounded-xl border text-left transition-all relative",
                                    formData.bulkSellingMode === 'bulksets'
                                      ? "bg-orange-50/50 border-[#FF8C42] ring-1 ring-orange-200 shadow-sm"
                                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  )}
                                >
                                  {formData.bulkSellingMode === 'bulksets' && (
                                    <div className="absolute top-2 right-2 text-[#FF8C42]">
                                      <Check className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className={cn("font-semibold text-sm mb-1 flex items-center gap-1.5", formData.bulkSellingMode === 'bulksets' ? "text-orange-900" : "text-slate-700")}>
                                    <Package className="h-3.5 w-3.5" />
                                    Sold as Set
                                  </div>
                                  <div className="text-xs text-slate-500 leading-snug pr-4">
                                    Sell as full sets only. One of each size per set.
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit of Measure</Label>
                        <SmartCombobox
                          value={formData.unitOfMeasure}
                          onChange={(val) => updateFormData({ unitOfMeasure: val })}
                          items={[
                            ...(formData.unitMode === 'individual' ? INDIVIDUAL_UNITS : BULK_UNITS),
                            ...customUnits
                          ]}
                          placeholder="Unit..."
                          onAddNew={(val) => setNewItemDialog({ open: true, type: 'unit', value: val })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formData.unitMode === 'bulk' && formData.bulkSellingMode === 'bulksets'
                            ? "Min Set Qty"
                            : "Min Piece Qty"}
                        </Label>
                        <Input
                          type="number"
                          value={formData.minOrderQuantity}
                          onChange={(e) => updateFormData({ minOrderQuantity: e.target.value })}
                          className="h-12 focus:border-[#FF8C42] focus:ring-orange-100"
                          placeholder={formData.unitMode === 'bulk' && formData.bulkSellingMode === 'bulksets' ? "e.g. 5" : "e.g. 10"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item Code / SKU</Label>
                        <Input
                          value={formData.itemCode}
                          onChange={(e) => updateFormData({ itemCode: e.target.value })}
                          className="font-mono text-sm h-12 focus:border-[#FF8C42] focus:ring-orange-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Batch Code</Label>
                        <Input
                          value={formData.batchCode}
                          onChange={(e) => updateFormData({ batchCode: e.target.value })}
                          className="font-mono text-sm h-12 focus:border-[#FF8C42] focus:ring-orange-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: VARIANTS */}
                  {currentStep === 3 && (
                    <AddStockPage3Variants
                      formData={formData}
                      variants={variants} setVariants={setVariants}
                      productImages={productImages} setProductImages={setProductImages}
                      mainImageIndex={mainImageIndex} setMainImageIndex={setMainImageIndex}
                      variantGroups={variantGroups} setVariantGroups={setVariantGroups}
                      tempVariantsForPricing={tempVariantsForPricing} setTempVariantsForPricing={setTempVariantsForPricing}
                      pendingGroupName={pendingGroupName} setPendingGroupName={setPendingGroupName}
                      pendingGroupNumber={pendingGroupNumber} setPendingGroupNumber={setPendingGroupNumber}
                      onNavigateToPricing={handleNext}
                    />
                  )}

                  {/* STEP 4: PRICING */}
                  {currentStep === 4 && (
                    <AddStockPage4PricingOffers
                      formData={formData}
                      updateFormData={updateFormData}
                      variants={variants}
                      setVariants={setVariants}
                      variantGroups={variantGroups}
                      setVariantGroups={setVariantGroups}
                      pendingGroupName={pendingGroupName}
                      pendingGroupNumber={pendingGroupNumber}
                      onSaveGroupAndContinue={handleNext}
                    />
                  )}

                  {/* STEP 5: IMAGES */}
                  {currentStep === 5 && (
                    <AddStockPage4Images
                      productImages={productImages} setProductImages={setProductImages}
                      mainImageIndex={mainImageIndex} setMainImageIndex={setMainImageIndex}
                      variants={variants}
                      variantGroups={variantGroups}
                      vtonImageUrl={vtonImageUrl}
                      setVtonImageUrl={setVtonImageUrl}
                      onPreviewVton={handleOpenVtonPreview}
                    />
                  )}

                  {/* STEP 6: REVIEW */}
                  {currentStep === 6 && (
                    <AddStockPage5Review
                      formData={formData}
                      variants={variants}
                      variantGroups={variantGroups}
                      productImages={productImages}
                      mainImageIndex={mainImageIndex}
                      vtonImageUrl={vtonImageUrl}
                      onEdit={setCurrentStep}
                      onPreviewVton={handleOpenVtonPreview}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── Inline Step Navigation ─────────────────────────────────────── */}
          <div className="sticky bottom-0 z-30 mt-6 pb-4">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-3 flex items-center justify-between gap-3">
              {/* Step dots */}
              <div className="flex items-center gap-1.5 pl-2 shrink-0">
                {STEPS.map((step) => (
                  <div
                    key={step.number}
                    className={`rounded-full transition-all duration-300 ${
                      step.number === currentStep
                        ? 'w-6 h-2 bg-[#FF8C42]'
                        : step.number < currentStep
                        ? 'w-2 h-2 bg-slate-400'
                        : 'w-2 h-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Step label */}
              <span className="text-xs font-semibold text-slate-500 hidden sm:block flex-1 text-center">
                Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.short}
              </span>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="h-11 px-4 rounded-xl text-slate-600 hover:text-black hover:bg-slate-100 font-semibold text-sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={currentStep === 6 ? handleSubmitClick : handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className={`h-11 px-8 rounded-xl font-black text-xs tracking-[0.15em] uppercase transition-all shadow-md relative overflow-hidden group
                    ${currentStep === 6
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200'
                      : 'bg-slate-900 hover:bg-black text-white'}
                    ${(!canProceed() || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : currentStep === 6 ? (
                      <>
                        <Check className="h-4 w-4" />
                        Publish Now
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add New Item Dialog */}
      <Dialog open={newItemDialog.open} onOpenChange={(open) => !open && setNewItemDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="rounded-2xl max-w-sm z-[10000]" aria-describedby="new-item-description">
          <DialogHeader>
            <DialogTitle>Add New {newItemDialog.type === 'hsn' ? 'HSN Code' : newItemDialog.type?.charAt(0).toUpperCase() + newItemDialog.type?.slice(1)}</DialogTitle>
            <DialogDescription id="new-item-description">
              Create a new entry for your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Value</Label>
            <Input
              value={newItemDialog.value}
              onChange={(e) => setNewItemDialog(prev => ({ ...prev, value: e.target.value }))}
              className="h-12 text-lg focus:border-[#FF8C42] focus:ring-orange-100"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewItemDialog({ open: false, type: null, value: '' })}>Cancel</Button>
            <Button onClick={handleAddNewItem} style={{ backgroundColor: AccentColor }}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl w-[90%] max-w-sm z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">{isEditing ? "Update Product?" : "Publish listing?"}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {isEditing ? "Your changes will be saved immediately." : "Your product will be live immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="rounded-xl h-11 border-none bg-slate-100 hover:bg-slate-200 mt-0">Edit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              className="rounded-xl h-11 font-semibold bg-green-600 hover:bg-green-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl w-[90%] max-w-sm z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Discard changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              {pendingNavigationPage
                ? "You have unsaved changes. Leaving this page will discard your current draft."
                : "Are you sure you want to discard your changes? This will clear the form."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel
              onClick={() => {
                setShowDiscardDialog(false);
                setPendingNavigationPage(null);
              }}
              className="rounded-xl h-11 border-none bg-slate-100 hover:bg-slate-200 mt-0 text-slate-700 font-medium"
            >
              {pendingNavigationPage ? "Keep Editing" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="rounded-xl h-11 font-semibold bg-red-500 hover:bg-red-600 text-white"
            >
              {pendingNavigationPage ? "Discard & Leave" : "Discard Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Navigation - Always Visible */}
      <MobileBottomNavigation
        currentPage={navigation?.currentPage || (isEditing ? 'my-stock' : 'add-stock')}
        onNavigate={handleSafeNavigation}
        cartItemCount={navigation?.cartItemCount}
        notificationCount={navigation?.notificationCount}
        wizardConfig={{
          show: true,
          canProceed: canProceed(),
          isSubmitting: isSubmitting,
          isLastStep: currentStep === 6,
          onBack: handleBack,
          onNext: currentStep === 6 ? handleSubmitClick : handleNext
        }}
      />

      {/* VTON Preview Overlay */}
      {showVtonPreview && (
        <VirtualTryOn
          initialSubjectImage={vtonImageUrl || ''}
          initialPatternImage={selectedVtonPattern || ''}
          onClose={() => setShowVtonPreview(false)}
        />
      )}

    </div>,
    document.body
  );
}

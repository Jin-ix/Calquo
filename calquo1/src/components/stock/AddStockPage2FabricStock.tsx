import React, { useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Shirt, Package, Code, Archive, ShoppingCart, Info } from 'lucide-react';
import { WizardFormData } from './AddStockWizard';
import { toast } from 'sonner';

interface AddStockPage2FabricStockProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const fabricTypes = [
  'Cotton', 'Polyester', 'Cotton Blend', 'Linen', 'Silk', 'Wool',
  'Rayon', 'Viscose', 'Lycra', 'Spandex', 'Denim', 'Canvas',
  'Chiffon', 'Georgette', 'Crepe', 'Khadi', 'Jute', 'Bamboo',
  'Modal', 'Tencel', 'Nylon', 'Acrylic', 'Cashmere', 'Flannel'
];

const individualUnits = [
  { value: 'PCS', label: 'PCS (Pieces)', description: 'Individual items' },
  { value: 'MTR', label: 'MTR (Meters)', description: 'Fabric by length' },
  { value: 'YRD', label: 'YRD (Yards)', description: 'Fabric by length' },
  { value: 'KG', label: 'KG (Kilograms)', description: 'By weight' }
];

const bulkUnits = [
  { value: 'SET', label: 'SET (Sets)', description: 'Coordinated sets' },
  { value: 'PAIR', label: 'PAIR (Pairs)', description: 'Matched pairs' },
  { value: 'DOZ', label: 'DOZ (Dozen - 12 pcs)', description: 'Small bulk packs' },
  { value: 'GRS', label: 'GRS (Gross - 144 pcs)', description: 'Large bulk packs' },
  { value: 'BAG', label: 'BAG (Bags)', description: 'Bagged stock' },
  { value: 'BOX', label: 'BOX (Boxes)', description: 'Boxed shipments' },
  { value: 'CTN', label: 'CTN (Cartons)', description: 'Carton packs' },
  { value: 'ROLL', label: 'ROLL (Fabric Rolls)', description: 'Complete rolls' },
  { value: 'BOL', label: 'BOL (Bales)', description: 'Raw material bales' }
];

export function AddStockPage2FabricStock({ formData, updateFormData }: AddStockPage2FabricStockProps) {
  // Auto-generate Item Code when category changes
  useEffect(() => {
    if (!formData.itemCode && formData.category) {
      const prefix = formData.category.substring(0, 1).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `${prefix}${randomNum}`;
      updateFormData({ itemCode: generatedCode });
    }
  }, [formData.category]);

  // Check if unit matches mode
  const isUnitMismatch = () => {
    if (!formData.unitOfMeasure) return false;
    const individualUnitValues = individualUnits.map(u => u.value);
    const bulkUnitValues = bulkUnits.map(u => u.value);
    
    if (formData.unitMode === 'individual' && bulkUnitValues.includes(formData.unitOfMeasure)) {
      return true;
    }
    if (formData.unitMode === 'bulk' && individualUnitValues.includes(formData.unitOfMeasure)) {
      return true;
    }
    return false;
  };

  // Auto-adjust unit when mode changes
  useEffect(() => {
    if (isUnitMismatch()) {
      const defaultUnit = formData.unitMode === 'individual' ? 'PCS' : 'SET';
      updateFormData({ unitOfMeasure: defaultUnit });
      toast.info(`Unit changed to ${defaultUnit} to match ${formData.unitMode} mode`);
    }
  }, [formData.unitMode]);

  const currentModeUnits = formData.unitMode === 'individual' ? individualUnits : bulkUnits;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
          <Shirt className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Fabric & Stock Details</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Define material composition and stock measurement units
        </p>
      </div>

      <div className="space-y-5">
        {/* Fabric Type */}
        <div className="space-y-2">
          <Label htmlFor="fabricType" className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-green-600" />
            Fabric Type
          </Label>
          <Select 
            value={formData.fabricType} 
            onValueChange={(value) => updateFormData({ fabricType: value })}
          >
            <SelectTrigger className="text-base">
              <SelectValue placeholder="Select fabric type" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {fabricTypes.map(fabric => (
                <SelectItem key={fabric} value={fabric}>{fabric}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose the primary material of your product
          </p>
        </div>

        {/* Fabric Description */}
        <div className="space-y-2">
          <Label htmlFor="fabricDescription" className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-green-600" />
            Fabric Description
          </Label>
          <Textarea
            id="fabricDescription"
            value={formData.fabricDescription}
            onChange={(e) => updateFormData({ fabricDescription: e.target.value })}
            placeholder="E.g., 100% Pure Cotton, Soft texture, Machine washable, Breathable"
            rows={3}
            className="text-base resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Describe fabric composition, texture, care instructions
          </p>
        </div>

        {/* Unit Mode Selection */}
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg space-y-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="font-medium">Stock Unit Mode *</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateFormData({ unitMode: 'individual' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.unitMode === 'individual'
                    ? 'bg-green-100 border-green-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shirt className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Individual Units</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  For single sales (pieces, meters, etc.)
                </p>
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ unitMode: 'bulk' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.unitMode === 'bulk'
                    ? 'bg-green-100 border-green-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Bulk Sets</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  For packaged stock (sets, pairs, dozens, cartons, etc.)
                </p>
              </button>
            </div>
          </div>

          {/* Unit of Measure */}
          <div className="space-y-2">
            <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
            <Select 
              value={formData.unitOfMeasure} 
              onValueChange={(value) => updateFormData({ unitOfMeasure: value })}
            >
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {currentModeUnits.map(unit => (
                  <SelectItem key={unit.value} value={unit.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{unit.label}</span>
                      <span className="text-xs text-muted-foreground">{unit.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item Code */}
          <div className="space-y-2">
            <Label htmlFor="itemCode" className="flex items-center gap-2">
              <Code className="h-4 w-4 text-green-600" />
              Item Code / SKU
            </Label>
            <Input
              id="itemCode"
              value={formData.itemCode}
              onChange={(e) => updateFormData({ itemCode: e.target.value })}
              placeholder="Auto-generated or enter custom code"
              className="text-base font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for inventory tracking
            </p>
          </div>

          {/* Batch Code */}
          <div className="space-y-2">
            <Label htmlFor="batchCode" className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-green-600" />
              Batch Code
            </Label>
            <Input
              id="batchCode"
              value={formData.batchCode}
              onChange={(e) => updateFormData({ batchCode: e.target.value })}
              placeholder="Manufacturing batch number (optional)"
              className="text-base font-mono"
            />
            <p className="text-xs text-muted-foreground">
              For quality control and traceability
            </p>
          </div>
        </div>

        {/* Bulk Selling Mode (only shown for bulk units) */}
        {formData.unitMode === 'bulk' && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
            <Label className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="font-medium">How will buyers purchase this stock? *</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateFormData({ bulkSellingMode: 'pieces' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.bulkSellingMode === 'pieces'
                    ? 'bg-blue-100 border-blue-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shirt className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Selling as Pieces</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Buyers can order individual pieces
                </p>
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ bulkSellingMode: 'bulksets' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.bulkSellingMode === 'bulksets'
                    ? 'bg-green-100 border-green-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Selling as Bulk Sets</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Buyers must order complete {formData.unitOfMeasure || 'bulk units'}
                </p>
              </button>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                  {formData.bulkSellingMode === 'pieces' 
                    ? `Stock is managed in ${formData.unitOfMeasure || 'bulk units'}, but buyers can order individual pieces.`
                    : `Buyers must purchase complete ${formData.unitOfMeasure || 'bulk sets'} only.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Minimum Order Quantity */}
        <div className="space-y-2">
          <Label htmlFor="minOrderQuantity" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-green-600" />
            Minimum Order Quantity (MOQ) *
          </Label>
          <Input
            id="minOrderQuantity"
            type="number"
            value={formData.minOrderQuantity}
            onChange={(e) => updateFormData({ minOrderQuantity: e.target.value })}
            placeholder={
              formData.unitMode === 'bulk' && formData.bulkSellingMode === 'pieces'
                ? 'Minimum number of pieces'
                : formData.unitMode === 'bulk' && formData.bulkSellingMode === 'bulksets'
                ? `Minimum number of ${formData.unitOfMeasure || 'bulk sets'}`
                : `Minimum quantity in ${formData.unitOfMeasure || 'units'}`
            }
            min="1"
            required
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            {formData.unitMode === 'bulk' && formData.bulkSellingMode === 'pieces'
              ? 'Enter minimum pieces buyers must order'
              : formData.unitMode === 'bulk' && formData.bulkSellingMode === 'bulksets'
              ? `Enter minimum number of ${formData.unitOfMeasure || 'bulk sets'} buyers must order`
              : `Minimum quantity buyers must order (in ${formData.unitOfMeasure || 'units'})`}
          </p>
        </div>
      </div>

      {/* Required Fields Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-green-900">
          <strong>Required fields:</strong> Stock Unit Mode, Unit of Measure, and MOQ are mandatory.
        </p>
      </div>
    </div>
  );
}

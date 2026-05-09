import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { CheckCircle2, Edit, Package, Shirt, Palette, Layers, Image as ImageIcon } from 'lucide-react';
import { WizardFormData, Variant, VariantGroup } from './AddStockWizard';

interface AddStockPage5ReviewProps {
  formData: WizardFormData;
  variants: Variant[];
  variantGroups: VariantGroup[];
  productImages?: string[];
  mainImageIndex?: number;
  vtonImageUrl?: string | null;
  onEdit: (step: number) => void;
  onPreviewVton?: (patternUrl: string) => void;
}

export function AddStockPage5Review({ 
  formData, 
  variants, 
  variantGroups, 
  productImages = [], 
  mainImageIndex = 0,
  vtonImageUrl = null,
  onEdit,
  onPreviewVton
}: AddStockPage5ReviewProps) {
  // Calculate totals from variant groups if available, otherwise fallback to variants
  const totalVariantQuantity = variantGroups.length > 0
    ? variantGroups.reduce((sum, group) => sum + group.variants.reduce((groupSum, v) => {
        const qty = typeof v.quantity === 'number' ? v.quantity : parseInt(v.quantity || '0');
        return groupSum + qty;
      }, 0), 0)
    : variants.reduce((sum, v) => {
        const qty = typeof v.quantity === 'number' ? v.quantity : parseInt(v.quantity || '0');
        return sum + qty;
      }, 0);
  
  const totalVariantsCount = variantGroups.length > 0
    ? variantGroups.reduce((sum, group) => sum + group.variants.length, 0)
    : variants.length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Review & Confirm</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please review all details before submitting
        </p>
      </div>

      <div className="space-y-4">
        {/* Section 1: Basic Information */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Basic Information</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="gap-1 h-8"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="p-4 space-y-3 bg-white">
            <div>
              <p className="text-xs text-muted-foreground">Product Name</p>
              <p className="font-medium">{formData.name || '—'}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium text-sm">{formData.category || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">HSN Code</p>
                <p className="font-medium text-sm">{formData.hsnCode || 'Not set'}</p>
              </div>
            </div>
            {formData.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Fabric & Stock */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-green-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-900">Fabric & Stock Details</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="gap-1 h-8"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="p-4 space-y-3 bg-white">
            {formData.fabricType && (
              <div>
                <p className="text-xs text-muted-foreground">Fabric Type</p>
                <p className="font-medium text-sm">{formData.fabricType}</p>
              </div>
            )}
            {formData.fabricType && formData.fabricDescription && <Separator />}
            {formData.fabricDescription && (
              <div>
                <p className="text-xs text-muted-foreground">Fabric Description</p>
                <p className="text-sm">{formData.fabricDescription}</p>
              </div>
            )}
            {(formData.fabricType || formData.fabricDescription) && <Separator />}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Unit Mode</p>
                <Badge variant="outline" className="mt-1">
                  {formData.unitMode === 'individual' ? 'Individual Units' : 'Bulk Sets'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit of Measure</p>
                <Badge variant="outline" className="mt-1">{formData.unitOfMeasure}</Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              {formData.itemCode && (
                <div>
                  <p className="text-xs text-muted-foreground">Item Code</p>
                  <p className="font-medium text-sm font-mono">{formData.itemCode}</p>
                </div>
              )}
              {formData.batchCode && (
                <div>
                  <p className="text-xs text-muted-foreground">Batch Code</p>
                  <p className="font-medium text-sm font-mono">{formData.batchCode}</p>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Minimum Order Quantity</p>
              <p className="font-medium">
                {formData.minOrderQuantity} {formData.unitOfMeasure}
              </p>
            </div>
            {formData.unitMode === 'bulk' && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Selling Mode</p>
                  <Badge variant="outline" className="mt-1">
                    {formData.bulkSellingMode === 'pieces' ? 'Selling as Pieces' : 'Selling as Bulk Sets'}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 3: Variants */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-purple-900">Groups</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="gap-1 h-8"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="p-4 bg-white">
            {variantGroups.length > 0 ? (
              <div className="space-y-6">
                {/* Global Summary Stats */}
                <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{variantGroups.length} Groups</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{totalVariantsCount} Variants</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{totalVariantQuantity} {formData.unitOfMeasure}</span>
                  </div>
                </div>

                {/* Groups List */}
                <div className="grid gap-4">
                  {variantGroups.map((group, groupIndex) => {
                    const numberOfSets = group.variants[0]?.quantity || 0;
                    
                    // Helper to sum up variant prices
                    const calculateSum = (key: keyof Variant) => group.variants.reduce((sum, v) => {
                       const val = v[key];
                       // Ensure we handle potential string values safely
                       const price = typeof val === 'number' ? val : parseFloat(String(val || '0'));
                       return sum + price;
                    }, 0);

                    const setBasePrice = calculateSum('piecePrice');
                    const setMrp = calculateSum('mrpPerPiece');
                    const setSingleShopPrice = calculateSum('singleShopPrice');
                    const setMultiShopPrice = calculateSum('multiShopPrice');
                    const setDealerPrice = calculateSum('dealerPrice');
                    const setRetailerPrice = calculateSum('retailerPrice');

                    return (
                      <div key={group.id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                        {/* Group Header */}
                        <div className="bg-slate-50/80 px-4 py-3 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold">
                                {groupIndex + 1}
                             </div>
                             <span className="font-semibold text-slate-900">{group.name || `Group ${groupIndex + 1}`}</span>
                             {group.groupNumber && <Badge variant="outline" className="text-[10px] h-5">#{group.groupNumber}</Badge>}
                          </div>
                          {formData.bulkSellingMode === 'bulksets' && (
                             <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-none">
                                {numberOfSets} Set{numberOfSets !== 1 ? 's' : ''}
                             </Badge>
                          )}
                        </div>

                        {/* Pricing Grid */}
                        {(formData.bulkSellingMode === 'bulksets' || formData.bulkSellingMode === 'pieces') && (
                          <div className="px-4 py-3 bg-white border-b border-slate-100">
                             <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                               {formData.bulkSellingMode === 'bulksets' ? 'Set Price Breakdown' : 'Group Average Prices'}
                             </p>
                             <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {[
                                  { label: 'Base', val: setBasePrice },
                                  { label: 'MRP', val: setMrp },
                                  { label: 'Single', val: setSingleShopPrice },
                                  { label: 'Multi', val: setMultiShopPrice },
                                  { label: 'Dealer', val: setDealerPrice },
                                  { label: 'Retail', val: setRetailerPrice },
                                ].map((item, i) => (
                                   item.val > 0 && (
                                     <div key={i} className="flex flex-col">
                                        <span className="text-[10px] text-slate-400">{item.label}</span>
                                        <span className="text-sm font-semibold text-slate-700">
                                           ₹{formData.bulkSellingMode === 'pieces' ? (item.val / group.variants.length).toFixed(2) : item.val.toFixed(2)}
                                        </span>
                                     </div>
                                   )
                                ))}
                             </div>
                          </div>
                        )}

                        {/* Variants Compact List */}
                        <div className="bg-slate-50/30">
                           {formData.bulkSellingMode === 'bulksets' ? (
                              <div className="p-4 flex items-start gap-4">
                                 {/* Representative Image */}
                                 <div className="h-14 w-14 rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-shrink-0 bg-white">
                                    {group.variants[0]?.colorOrPattern?.type === 'pattern' && group.variants[0]?.colorOrPattern?.value ? (
                                       <img src={group.variants[0].colorOrPattern.value} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                       <div className="h-full w-full" style={{ background: group.variants[0]?.colorOrPattern?.value || '#eee' }} />
                                    )}
                                 </div>
                                 
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                       <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Set Includes (1 of each):</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                       {group.variants.map((v, vIdx) => (
                                          <Badge key={vIdx} variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
                                             {v.size}
                                          </Badge>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              group.variants.map((variant, vIdx) => (
                                <div key={vIdx} className="px-4 py-2 flex items-center gap-3 border-b last:border-0 border-slate-100 hover:bg-white transition-colors">
                                   {/* Color Swatch */}
                                   <div className="h-8 w-8 rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-shrink-0">
                                      {variant.colorOrPattern?.type === 'pattern' && variant.colorOrPattern?.value ? (
                                         <img src={variant.colorOrPattern.value} className="h-full w-full object-cover" alt="" />
                                      ) : (
                                         <div 
                                           className="h-full w-full" 
                                           style={{ background: variant.colorOrPattern?.value || '#eee' }} 
                                         />
                                      )}
                                   </div>
                                   
                                   {/* Info */}
                                   <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                         <p className="text-sm font-medium text-slate-900 truncate">
                                            {variant.colorOrPattern?.name || variant.colorOrPattern?.value || 'Variant'} 
                                            <span className="text-slate-400 font-normal"> • </span> 
                                            {variant.size}
                                         </p>
                                         <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                            x {variant.quantity}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                              ))
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : variants.length > 0 ? (
               // Simple list for non-grouped
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                     <Package className="h-4 w-4" />
                     <span>{totalVariantsCount} variants total</span>
                  </div>
                  <div className="border rounded-xl overflow-hidden divide-y divide-slate-100">
                     {variants.map((variant, idx) => (
                        <div key={idx} className="p-3 bg-white flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-slate-100 border flex items-center justify-center text-xs font-medium text-slate-500">
                                 {variant.colorOrPattern?.type === 'pattern' && variant.colorOrPattern.value ? (
                                  <div className="w-12 h-12 rounded border overflow-hidden">
                                    <img src={variant.colorOrPattern.value} alt={variant.colorOrPattern.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  variant.size
                                )}
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-slate-900">
                                    {variant.colorOrPattern?.name || variant.colorOrPattern?.value || 'Variant'}
                                 </p>
                                 <p className="text-xs text-slate-500">
                                    Size: {variant.size}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">
                                 {variant.quantity} <span className="text-slate-400 text-xs font-normal">{formData.unitOfMeasure}</span>
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                 <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                 <p className="text-sm">No variants added yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Product Images */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-orange-600" />
              <h4 className="font-medium text-orange-900">Product Images</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(4)}
              className="gap-1 h-8"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="p-4 bg-white">
            {productImages.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`aspect-square rounded-md overflow-hidden border relative ${
                      idx === mainImageIndex ? 'ring-2 ring-orange-500 ring-offset-1' : ''
                    }`}
                  >
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === mainImageIndex && (
                      <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-[10px] text-center py-0.5">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No images uploaded</p>
            )}
          </div>
        </div>

        {/* Section 5: Virtual Try-On (Optional) */}
        {vtonImageUrl && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shirt className="h-4 w-4 text-indigo-600" />
                <h4 className="font-medium text-indigo-900">Virtual Try-On Subject</h4>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(5)} className="gap-1 h-8">
                <Edit className="h-3 w-3" />
                Edit
              </Button>
            </div>
            <div className="p-4 bg-white">
              <div className="flex gap-4 items-start">
                <div className="w-32 aspect-[3/4] rounded-md overflow-hidden border flex-shrink-0">
                  <img src={vtonImageUrl} alt="VTON Subject" className="w-full h-full object-cover" />
                </div>
                
                {onPreviewVton && (
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Preview with Pattern:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v, idx) => v.colorOrPattern?.type === 'pattern' && v.colorOrPattern?.value && (
                        <button
                          key={idx}
                          onClick={() => onPreviewVton(v.colorOrPattern.value!)}
                          className="h-12 w-12 rounded-md border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
                          title={`Preview ${v.colorOrPattern.name || 'this pattern'}`}
                        >
                          <img src={v.colorOrPattern.value} className="h-full w-full object-cover" alt="" />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      Click a pattern above to see how it looks on this subject image.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Final Confirmation Notice */}

    </div>
  );
}

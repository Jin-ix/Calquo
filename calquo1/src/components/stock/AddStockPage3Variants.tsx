import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Palette, AlertCircle, Sparkles, Plus, Edit2, Trash2, Package, Check } from 'lucide-react';
import { WizardFormData, Variant } from './AddStockWizard';
import { AutoGenerateCombos } from './AutoGenerateCombos';
import { Alert, AlertDescription } from '../ui/alert';
import { ColorOrPattern } from '../ui/color-pattern-input';

import { VariantGroup } from './AddStockWizard';

interface AddStockPage3VariantsProps {
  formData: WizardFormData;
  variants: Variant[];
  setVariants: (variants: Variant[]) => void;
  productImages: string[];
  setProductImages: (images: string[]) => void;
  mainImageIndex: number;
  setMainImageIndex: (index: number) => void;
  variantGroups: VariantGroup[];
  setVariantGroups: (groups: VariantGroup[]) => void;
  tempVariantsForPricing: Variant[] | null;
  setTempVariantsForPricing: (variants: Variant[] | null) => void;
  pendingGroupName: string;
  setPendingGroupName: (name: string) => void;
  pendingGroupNumber: string;
  setPendingGroupNumber: (number: string) => void;
  onNavigateToPricing?: () => void;
}

export function AddStockPage3Variants({
  formData,
  variants,
  setVariants,
  productImages,
  setProductImages,
  mainImageIndex,
  setMainImageIndex,
  variantGroups,
  setVariantGroups,
  tempVariantsForPricing,
  setTempVariantsForPricing,
  pendingGroupName,
  setPendingGroupName,
  pendingGroupNumber,
  setPendingGroupNumber,
  onNavigateToPricing
}: AddStockPage3VariantsProps) {
  const [showAutoGenerate, setShowAutoGenerate] = useState(variantGroups.length === 0);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupNumberInput, setGroupNumberInput] = useState('');
  const [editingColors, setEditingColors] = useState<ColorOrPattern[]>([]);
  const [editingSizes, setEditingSizes] = useState<string[]>([]);
  const [editingPricingData, setEditingPricingData] = useState<Record<string, any>>({});

  // Ensure form is open if no groups exist
  useEffect(() => {
    if (variantGroups.length === 0) {
      setShowAutoGenerate(true);
    }
  }, [variantGroups.length]);

  // Calculate total variants across all groups
  const totalVariantsCount = variantGroups.reduce((sum, group) => sum + group.variants.length, 0);

  // Handle new group creation
  const handleAddNewGroup = () => {
    setGroupNameInput('');
    setGroupNumberInput('');
    setEditingGroupId(null);
    setEditingColors([]);
    setEditingSizes([]);
    setEditingPricingData({});
    setShowAutoGenerate(true);
  };

  // Handle applying generated variants - now stores temporarily for pricing
  const handleApplyVariantGroup = (generatedVariants: Variant[]) => {
    const groupName = groupNameInput.trim() || `Group ${variantGroups.length + 1}`;
    const groupNumber = groupNumberInput.trim() || `GRP-${String(variantGroups.length + 1).padStart(3, '0')}`;
    
    if (editingGroupId) {
      // Editing existing group - update immediately
      const updatedGroups = variantGroups.map(group => 
        group.id === editingGroupId 
          ? { ...group, name: groupName, groupNumber: groupNumber || undefined, variants: generatedVariants }
          : group
      );
      setVariantGroups(updatedGroups);
      // FIXED: Don't combine all variants when editing
      // Keep variants array clear since we track groups separately
      console.log('🔵 Updated existing group:', groupName);
      setEditingGroupId(null);
      setShowAutoGenerate(false);
      setGroupNameInput('');
      setGroupNumberInput('');
      setEditingColors([]);
      setEditingSizes([]);
    } else {
      // NEW WORKFLOW: Store variants temporarily for pricing
      console.log('🟡 Storing temp variants for pricing:', generatedVariants.length, 'variants');
      console.log('🟡 Group name:', groupName, 'Group number:', groupNumber);
      
      setTempVariantsForPricing(generatedVariants);
      setPendingGroupName(groupName);
      setPendingGroupNumber(groupNumber);
      
      // FIXED: Only set the NEW group's variants, not combined with old groups
      // The pricing table should only show the CURRENT group being created
      console.log('🟢 Setting variants to only new group:', generatedVariants.length);
      setVariants(generatedVariants);
      
      setShowAutoGenerate(false);
      setGroupNameInput('');
      setGroupNumberInput('');
      
      // AUTO-NAVIGATE to pricing page
      console.log('🟡 Navigating to pricing page');
      if (onNavigateToPricing) {
        onNavigateToPricing();
      }
    }
  };

  // Delete a group
  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = variantGroups.filter(g => g.id !== groupId);
    setVariantGroups(updatedGroups);
    updateCombinedVariants(updatedGroups);
  };

  // Edit a group
  const handleEditGroup = (group: VariantGroup) => {
    setEditingGroupId(group.id);
    setGroupNameInput(group.name);
    setGroupNumberInput(group.groupNumber || '');
    
    // Extract unique colors and sizes from the group's variants
    const uniqueColors: ColorOrPattern[] = [];
    const uniqueSizes: string[] = [];
    const pricingData: Record<string, any> = {};
    
    console.log('📝 Editing group:', group.name, 'with', group.variants.length, 'variants');
    
    group.variants.forEach(variant => {
      // Add color/pattern if not already in the list
      if (variant.colorOrPattern) {
        const exists = uniqueColors.some(c => 
          c.type === variant.colorOrPattern?.type && 
          c.value === variant.colorOrPattern?.value
        );
        if (!exists) {
          uniqueColors.push(variant.colorOrPattern);
        }
      }
      
      // Add size if not already in the list
      if (variant.size && !uniqueSizes.includes(variant.size)) {
        uniqueSizes.push(variant.size);
      }
      
      // Store pricing data for this variant
      // Map Variant field names to AutoGenerateCombos field names
      const key = `${variant.colorOrPattern?.value || variant.color}-${variant.size}`;
      pricingData[key] = {
        quantity: variant.quantity,
        basePrice: variant.piecePrice,  // Map piecePrice -> basePrice
        piecePrice: variant.piecePrice,
        priceForTraders: variant.dealerPrice,  // Map dealerPrice -> priceForTraders
        priceForSingleShopRetailers: variant.singleShopPrice,  // Map singleShopPrice -> priceForSingleShopRetailers
        priceForMultiShopRetailers: variant.multiShopPrice,  // Map multiShopPrice -> priceForMultiShopRetailers
        mrpPerPiece: variant.mrpPerPiece,
        image: variant.imageUrl || (variant.images && variant.images[0])  // Get first image
      };
      
      console.log(`  - ${key}:`, {
        qty: variant.quantity,
        piece: variant.piecePrice,
        single: variant.singleShopPrice,
        multi: variant.multiShopPrice,
        dealer: variant.dealerPrice,
        mrp: variant.mrpPerPiece
      });
    });
    
    console.log('💾 Pricing data prepared:', Object.keys(pricingData).length, 'entries');
    console.log('🎨 Colors:', uniqueColors.map(c => c.name));
    console.log('📏 Sizes:', uniqueSizes);
    
    // Store these for passing to AutoGenerateCombos
    setEditingColors(uniqueColors);
    setEditingSizes(uniqueSizes);
    setEditingPricingData(pricingData);
    
    setShowAutoGenerate(true);
  };

  // REMOVED: updateCombinedVariants function
  // No longer needed since we track groups separately and only show current group variants in pricing table

  // Debug logging
  console.log('🎨 Page3 Render State:', {
    variantGroupsCount: variantGroups.length,
    showAutoGenerate,
    hasTempVariants: !!tempVariantsForPricing,
    tempVariantsCount: tempVariantsForPricing?.length || 0
  });

  return (
    <div className="space-y-3">
      <div className="space-y-3">


        {/* Detailed Groups View - Show when not creating/editing */}
        {variantGroups.length > 0 && !showAutoGenerate && (
          <div className="space-y-2">

            {variantGroups.map((group) => (
              null
            ))}
            
            {/* Create Next Group Button */}

          </div>
        )}

        {/* Auto-Generate Component */}
        {showAutoGenerate && (
          <div className="space-y-2">
            {/* Compact Summary of Existing Groups */}
            {variantGroups.length > 0 && !editingGroupId && (
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-blue-600" />
                    <h5 className="text-xs font-semibold text-blue-900">
                      Existing Groups
                    </h5>
                    <Badge variant="secondary" className="bg-blue-600 text-white text-[10px] h-4 px-1">
                      {variantGroups.length}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {totalVariantsCount} total
                    </Badge>
                  </div>
                </div>
                
                {/* Compact Group List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {variantGroups.map((group) => {
                    // Extract unique colors and sizes
                    const uniqueColors = new Set(group.variants.map(v => v.colorOrPattern?.name).filter(Boolean));
                    const uniqueSizes = new Set(group.variants.map(v => v.size).filter(Boolean));
                    
                    return (
                      <div 
                        key={group.id}
                        className="bg-white border border-blue-200 rounded p-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
                            <span className="text-[11px] font-medium truncate">{group.name}</span>
                            {group.groupNumber && (
                              <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                                #{group.groupNumber}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 ml-1 flex-shrink-0">
                            {group.variants.length}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border border-purple-200 rounded-lg p-3 bg-white">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    {editingGroupId ? 'Edit Group' : 'Create Group'}
                  </h4>
                  {variantGroups.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        setShowAutoGenerate(false);
                        setEditingGroupId(null);
                        setGroupNameInput('');
                        setGroupNumberInput('');
                        setEditingColors([]);
                        setEditingSizes([]);
                        setEditingPricingData({});
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              
              {/* Group Name and Number Inputs */}
              <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="groupName" className="text-xs">
                    Group Name (Optional)
                  </Label>
                  <input
                    id="groupName"
                    type="text"
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    placeholder={`e.g., "Group ${variantGroups.length + 1}"`}
                    className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="groupNumber" className="text-xs">
                    Group Number (Optional)
                  </Label>
                  <input
                    id="groupNumber"
                    type="text"
                    value={groupNumberInput}
                    onChange={(e) => setGroupNumberInput(e.target.value)}
                    placeholder={`e.g., "GRP-${String(variantGroups.length + 1).padStart(3, '0')}"`}
                    className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <AutoGenerateCombos
              onGenerate={(generatedVariants) => {
                handleApplyVariantGroup(generatedVariants);
              }}
              unitOfMeasure={formData.unitOfMeasure}
              unitMode={formData.unitMode}
              bulkSellingMode={formData.bulkSellingMode}
              existingGroupsCount={variantGroups.length}
              initialColors={editingGroupId ? editingColors : []}
              initialSizes={editingGroupId ? editingSizes : []}
              initialPricingData={editingGroupId ? editingPricingData : {}}
              onNavigateToPricing={onNavigateToPricing}
            />
          </div>
          </div>
        )}

        {/* Empty State - Only show when no groups exist */}
        {/* Removed "Create First Group" button as the form now auto-opens when no groups exist */}

        {/* Saved Groups Display - Only show when groups exist */}
        {variantGroups.length > 0 && !showAutoGenerate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-green-900">Saved Groups</h4>
                  <Badge className="bg-green-600 text-xs h-5">
                    {variantGroups.length}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {totalVariantsCount} total
                  </Badge>
                </div>
              </div>

              {/* Groups List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {variantGroups.map((group, index) => {
                  const uniqueColors = new Set(group.variants.map(v => v.colorOrPattern?.name || v.color).filter(Boolean));
                  const uniqueSizes = new Set(group.variants.map(v => v.size).filter(Boolean));
                  
                  // Calculate pricing info
                  const totalSets = formData.bulkSellingMode === 'bulksets' ? group.variants.length : 0;
                  const prices = group.variants
                    .map(v => v.piecePrice)
                    .filter((p): p is number => p !== undefined && p > 0);
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                  
                  return (
                    <div
                      key={group.id}
                      className="bg-white border border-green-200 rounded-lg p-2 hover:border-green-400 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-semibold text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-sm font-semibold text-gray-900">{group.name}</h5>
                              {group.groupNumber && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  #{group.groupNumber}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {group.variants.length} variants • {uniqueColors.size} colors × {uniqueSizes.size} sizes
                            </p>
                            {/* Show sets and pricing info */}
                            {totalSets > 0 && (
                              <p className="text-xs text-green-700 font-medium mt-0.5">
                                {totalSets} {totalSets === 1 ? 'set' : 'sets'} available
                              </p>
                            )}
                            {minPrice > 0 && (
                              <p className="text-xs text-blue-700 font-medium mt-0.5">
                                ₹{minPrice}{maxPrice > minPrice ? ` - ₹${maxPrice}` : ''} /pc
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditGroup(group)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Variants Preview Grid - Compact */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {group.variants.map((variant, vIndex) => {
                          // Collect all unique images for this variant
                          const allImages = [
                            ...(variant.imageUrl ? [variant.imageUrl] : []),
                            ...(Array.isArray(variant.images) ? variant.images : [])
                          ].filter((url, i, arr) => url && arr.indexOf(url) === i);

                          return (
                          <div 
                            key={vIndex}
                            className="flex flex-col gap-2 p-2 bg-green-50 rounded-lg border border-green-200 shadow-sm"
                            title={variant.colorOrPattern?.name || variant.color}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-sm text-slate-800 truncate">
                                {variant.size}
                              </div>
                              {allImages.length > 1 && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-white">
                                  {allImages.length} pics
                                </Badge>
                              )}
                            </div>
                            
                            {allImages.length > 0 ? (
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
                                {allImages.map((img, i) => (
                                  <div key={i} className="w-10 h-10 rounded-md border border-gray-200 overflow-hidden flex-shrink-0 bg-white shadow-sm">
                                    <img 
                                      src={img} 
                                      alt={`Preview ${i+1}`} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : variant.colorOrPattern?.type === 'pattern' && variant.colorOrPattern.value ? (
                              <div className="w-10 h-10 rounded-md border border-gray-200 overflow-hidden flex-shrink-0 bg-white shadow-sm">
                                <img 
                                  src={variant.colorOrPattern.value} 
                                  alt={variant.colorOrPattern.name || "Pattern"}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-md border border-gray-200 flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: variant.colorOrPattern?.value || '#eee' }}
                              />
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create Next Group Button */}
              <div className="text-center pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNewGroup}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create Next Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { IndianRupee, Users, Package, Sparkles, DollarSign, AlertCircle, Edit, History, CheckCircle, XCircle, Menu, Check, ChevronRight } from 'lucide-react';
import { WizardFormData, Variant, VariantGroup } from './AddStockWizard';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AddStockPage4PricingOffersProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  variants: Variant[];
  setVariants: (variants: Variant[]) => void;
  variantGroups?: VariantGroup[];
  setVariantGroups?: (groups: VariantGroup[]) => void;
  pendingGroupName?: string;
  pendingGroupNumber?: string;
  onSaveGroupAndAddAnother?: () => void;
  onSaveGroupAndContinue?: () => void;
}

export function AddStockPage4PricingOffers({
  formData,
  updateFormData,
  variants,
  setVariants,
  variantGroups = [],
  setVariantGroups,
  pendingGroupName = '',
  pendingGroupNumber = '',
  onSaveGroupAndAddAnother,
  onSaveGroupAndContinue
}: AddStockPage4PricingOffersProps) {
  // State for "Apply to All" functionality
  const [applyAllQuantity, setApplyAllQuantity] = useState<number | ''>('');
  const [applyAllBasePrice, setApplyAllBasePrice] = useState<number | ''>('');
  const [applyAllMrp, setApplyAllMrp] = useState<number | ''>('');
  const [applyAllSingleShopPrice, setApplyAllSingleShopPrice] = useState<number | ''>('');
  const [applyAllMultiShopPrice, setApplyAllMultiShopPrice] = useState<number | ''>('');
  const [applyAllDealerPrice, setApplyAllDealerPrice] = useState<number | ''>('');
  const [applyAllRetailerPrice, setApplyAllRetailerPrice] = useState<number | ''>('');
  const [applyAllOfferPrice, setApplyAllOfferPrice] = useState<number | ''>('');

  // State for editing past groups
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingVariants, setEditingVariants] = useState<Variant[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);

  // Determine current group info
  const currentGroupName = pendingGroupName || `Group ${variantGroups.length + 1}`;
  const currentGroupNumber = pendingGroupNumber || `GRP-${String(variantGroups.length + 1).padStart(3, '0')}`;

  // Get current variants (either editing a past group or working with current)
  const currentVariants = editingGroupId ? editingVariants : variants;
  const isEditingPastGroup = editingGroupId !== null;

  // Map variants to display format (no longer need unique filtering since we fixed the root cause)
  const displayVariants = currentVariants.map((variant, index) => ({
    variant,
    originalIndex: index
  }));

  // Check if group is priced
  const isGroupPriced = (group: VariantGroup) => {
    return group.variants.every(v => v.piecePrice && v.piecePrice > 0);
  };

  // Check if current group has valid pricing
  const hasValidPricing = currentVariants.some(v => v.piecePrice && v.piecePrice > 0);

  // Check if all variants have valid quantities
  const hasValidQuantities = currentVariants.every(v => v.quantity && v.quantity > 0);

  // Update variant pricing
  const updateVariantPrice = (index: number, field: keyof Variant, value: number) => {
    console.log(`💰 UPDATE PRICE: index=${index}, field=${field}, value=${value}`);

    if (isEditingPastGroup) {
      const updated = [...editingVariants];
      updated[index] = { ...updated[index], [field]: value };
      console.log(`💰 Updated editingVariants[${index}]:`, updated[index]);
      setEditingVariants(updated);
    } else {
      const updated = [...variants];
      updated[index] = { ...updated[index], [field]: value };
      console.log(`💰 Updated variants[${index}]:`, updated[index]);
      console.log(`💰 Full updated array length: ${updated.length}`);
      setVariants(updated);
    }
  };

  // Apply price to all variants
  const applyToAll = (field: keyof Variant, value: number) => {
    const varsToUpdate = isEditingPastGroup ? editingVariants : variants;
    const updated = varsToUpdate.map(v => ({ ...v, [field]: value }));

    if (isEditingPastGroup) {
      setEditingVariants(updated);
    } else {
      setVariants(updated);
    }
  };

  const handleApplyAllQuantity = () => {
    if (!applyAllQuantity) return;
    applyToAll('quantity', applyAllQuantity as number);
  };

  const handleApplyAllBasePrice = () => {
    if (!applyAllBasePrice) return;
    applyToAll('piecePrice', applyAllBasePrice as number);
  };

  const handleApplyAllMrp = () => {
    if (!applyAllMrp) return;
    applyToAll('mrpPerPiece', applyAllMrp as number);
  };

  const handleApplyAllSingleShop = () => {
    if (!applyAllSingleShopPrice) return;
    applyToAll('singleShopPrice', applyAllSingleShopPrice as number);
  };

  const handleApplyAllMultiShop = () => {
    if (!applyAllMultiShopPrice) return;
    applyToAll('multiShopPrice', applyAllMultiShopPrice as number);
  };

  const handleApplyAllDealer = () => {
    if (!applyAllDealerPrice) return;
    applyToAll('dealerPrice', applyAllDealerPrice as number);
  };

  const handleApplyAllRetailer = () => {
    if (!applyAllRetailerPrice) return;
    applyToAll('retailerPrice', applyAllRetailerPrice as number);
  };

  const handleApplyAllOfferPrice = () => {
    if (!applyAllOfferPrice) return;
    applyToAll('offerPrice', applyAllOfferPrice as number);
  };

  // Load past group for editing
  const handleLoadPastGroup = (groupId: string) => {
    const group = variantGroups.find(g => g.id === groupId);
    if (!group) return;

    toast.warning(
      `Switched to ${group.groupNumber || group.name}—any unsaved changes to current group will be lost!`,
      { duration: 4000 }
    );

    setEditingGroupId(groupId);
    setEditingVariants([...group.variants]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save edited past group
  const handleSaveEditedGroup = () => {
    if (!editingGroupId || !setVariantGroups) return;

    const allHaveQuantity = editingVariants.every(v => v.quantity && v.quantity > 0);
    if (!allHaveQuantity) {
      toast.error('All variants must have a Quantity before saving!');
      return;
    }

    const allHaveBasePrice = editingVariants.every(v => v.piecePrice && v.piecePrice > 0);
    if (!allHaveBasePrice) {
      toast.error('All variants must have a Base Price before saving!');
      return;
    }

    const updated = variantGroups.map(g =>
      g.id === editingGroupId
        ? { ...g, variants: editingVariants }
        : g
    );

    setVariantGroups(updated);
    toast.success('Group updated successfully!');
    setEditingGroupId(null);
    setEditingVariants([]);
  };

  // Cancel editing past group
  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingVariants([]);
    toast.info('Returned to current group');
  };

  // Check if we have variants
  const hasVariants = currentVariants.length > 0;

  // Validation: Check if all variants have Quantity and Base Price
  const allVariantsHaveQuantity = currentVariants.every(v => v.quantity && v.quantity > 0);
  const allVariantsHaveBasePrice = currentVariants.every(v => v.piecePrice && v.piecePrice > 0);
  const allVariantsComplete = allVariantsHaveQuantity && allVariantsHaveBasePrice;

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mb-1">
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-semibold">Pricing & Offers</h3>
        <p className="text-xs text-muted-foreground">
          Set pricing for all your variants
        </p>
      </div>

      {/* Main Content Area */}
      <div className="space-y-3">
        {/* Compact Current Group Header */}
        {hasVariants && (
          <Card className={`border ${isEditingPastGroup ? 'border-blue-400 bg-blue-50' : 'border-green-400 bg-green-50'}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${isEditingPastGroup ? 'bg-blue-200' : 'bg-green-200'}`}>
                    <Package className={`h-4 w-4 ${isEditingPastGroup ? 'text-blue-700' : 'text-green-700'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold">
                        {isEditingPastGroup
                          ? `Editing: ${variantGroups.find(g => g.id === editingGroupId)?.groupNumber || 'Group'}`
                          : `Current Group: ${pendingGroupNumber || `GRP-${String(variantGroups.length + 1).padStart(3, '0')}`}`
                        }
                      </h4>

                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  {allVariantsComplete ? (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      All Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {currentVariants.filter(v => !v.piecePrice || v.piecePrice <= 0).length} Need Pricing
                    </Badge>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>
        )}

        {!hasVariants && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>No variants created yet.</strong> Please go back to the Variants page to create your product variants first.
            </AlertDescription>
          </Alert>
        )}

        {/* Compact Variant Pricing Table */}
        {hasVariants && (
          <Card className="border border-emerald-300">
            <CardContent className="p-0">
              {/* Compact Apply to All Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200 p-3">
                <h5 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Quick Apply to All
                </h5>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Quantity</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={applyAllQuantity}
                        onChange={(e) => setApplyAllQuantity(e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="Qty"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllQuantity}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllQuantity}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Base Price</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllBasePrice}
                        onChange={(e) => setApplyAllBasePrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllBasePrice}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllBasePrice}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">MRP</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllMrp}
                        onChange={(e) => setApplyAllMrp(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllMrp}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllMrp}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Single</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllSingleShopPrice}
                        onChange={(e) => setApplyAllSingleShopPrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllSingleShop}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllSingleShopPrice}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Multi</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllMultiShopPrice}
                        onChange={(e) => setApplyAllMultiShopPrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllMultiShop}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllMultiShopPrice}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Wholesale (Dealer)</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllDealerPrice}
                        onChange={(e) => setApplyAllDealerPrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllDealer}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllDealerPrice}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Retailer</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllRetailerPrice}
                        onChange={(e) => setApplyAllRetailerPrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllRetailer}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllRetailerPrice}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-xs text-blue-800">Offer Price</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyAllOfferPrice}
                        onChange={(e) => setApplyAllOfferPrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="₹"
                        className="flex-1 h-7 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyAllOfferPrice}
                        className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                        disabled={!applyAllOfferPrice}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-blue-700 mt-1.5">
                  💡 Quick apply same price to all variants
                </p>
              </div>

              {/* Compact Variants Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gradient-to-r from-emerald-100 to-green-100">
                    <TableRow>
                      <TableHead className="w-12 p-2 text-xs">#</TableHead>
                      <TableHead className="min-w-[100px] p-2 text-xs">Color</TableHead>
                      <TableHead className="w-16 p-2 text-xs">Size</TableHead>
                      <TableHead className="w-20 p-2 text-xs bg-gray-100">
                        <span className="flex items-center gap-0.5">
                          <Package className="h-3 w-3" />
                          Qty<span className="text-red-600">*</span>
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-emerald-200">
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          Base<span className="text-red-600">*</span>
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-emerald-200">
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          MRP
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-blue-100">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          Single
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-blue-100">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          Multi
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-blue-100">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          Wholesale
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-blue-100">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          Retailer
                        </span>
                      </TableHead>
                      <TableHead className="min-w-[90px] p-2 text-xs bg-orange-100">
                        <span className="flex items-center gap-0.5">
                          <Sparkles className="h-3 w-3" />
                          Offer
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayVariants.map(({ variant, originalIndex }, displayIndex) => {
                      const isIncomplete = !variant.piecePrice || variant.piecePrice <= 0;
                      return (
                        <TableRow key={originalIndex} className={`h-12 ${isIncomplete ? 'bg-red-50' : ''}`}>
                          <TableCell className="font-mono text-xs p-2">
                            {displayIndex + 1}
                            {isIncomplete && <span className="ml-1 text-red-600">⚠️</span>}
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center gap-1.5">
                              {variant.colorOrPattern?.type === 'color' ? (
                                <div
                                  className="w-5 h-5 rounded border flex-shrink-0"
                                  style={{ backgroundColor: variant.colorOrPattern.value }}
                                />
                              ) : (
                                <div className="w-5 h-5 rounded border overflow-hidden flex-shrink-0">
                                  {variant.colorOrPattern?.value ? (
                                    <img
                                      src={variant.colorOrPattern.value}
                                      alt={variant.colorOrPattern.name || 'Pattern'}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs">
                                      🎨
                                    </div>
                                  )}
                                </div>
                              )}
                              <span className="text-xs truncate">{variant.colorOrPattern?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Badge variant="outline" className="text-xs h-5">{variant.size}</Badge>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.quantity ?? ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'quantity', parseInt(e.target.value) || 0)}
                              className={`w-full h-7 text-xs ${!variant.quantity || variant.quantity <= 0 ? 'border-red-300 focus:border-red-500' : ''}`}
                              placeholder="Qty"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.piecePrice || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'piecePrice', parseFloat(e.target.value) || 0)}
                              className={`w-full h-7 text-xs ${!variant.piecePrice || variant.piecePrice <= 0 ? 'border-red-300 focus:border-red-500' : ''}`}
                              placeholder="₹"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.mrpPerPiece || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'mrpPerPiece', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs"
                              placeholder="₹"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.singleShopPrice || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'singleShopPrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs"
                              placeholder="₹"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.multiShopPrice || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'multiShopPrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs"
                              placeholder="₹"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.dealerPrice || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'dealerPrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs"
                              placeholder="₹"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.retailerPrice || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'retailerPrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs"
                              placeholder="₹"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.offerPrice || ''}
                              onChange={(e) => updateVariantPrice(originalIndex, 'offerPrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs bg-orange-50 border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                              placeholder="₹"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Compact Summary Footer */}
              <div className="bg-emerald-50 border-t border-emerald-300 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-800">Total:</p>
                  </div>
                  <Badge className="bg-emerald-600 text-xs h-5 px-2">
                    {currentVariants.length} variant{currentVariants.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Quantity Section */}
        {/* Stock Quantity Section Removed */}

        {/* Compact Action Buttons for Edited Group */}
        {isEditingPastGroup && (
          <Card className="border border-blue-300 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleSaveEditedGroup}
                  disabled={!allVariantsComplete}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1.5" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  size="sm"
                  className="h-8 text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1.5" />
                  Cancel
                </Button>
              </div>
              {!allVariantsComplete && (
                <p className="text-xs text-red-600 mt-1.5">
                  ⚠️ {!allVariantsHaveQuantity && 'Quantity and '}Base Price required for all variants
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons - For Current Group (Not Editing Past Group) */}
      {!isEditingPastGroup && hasVariants && (
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Group Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    {currentGroupName}
                  </p>
                  <p className="text-xs text-green-700">
                    {currentVariants.length} variant{currentVariants.length !== 1 ? 's' : ''} • {currentGroupNumber}
                  </p>
                </div>
                <Badge
                  variant={allVariantsComplete ? "default" : "outline"}
                  className={allVariantsComplete ? "bg-green-600" : "bg-amber-100 text-amber-800 border-amber-300"}
                >
                  {allVariantsComplete ? '✓ Complete' : '⚠ Incomplete'}
                </Badge>
              </div>

              {/* Validation Alert */}
              {!allVariantsComplete && (
                <Alert className="bg-red-50 border-red-300 py-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-xs text-red-900">
                    <strong>
                      ⚠️ Required: Please enter {!allVariantsHaveQuantity && 'quantity and '}base price for all variants before proceeding.
                    </strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Save & Add Another Group */}
                {onSaveGroupAndAddAnother && (
                  <Button
                    onClick={onSaveGroupAndAddAnother}
                    disabled={!allVariantsComplete}
                    variant="outline"
                    className="flex-1 gap-2 border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!allVariantsComplete ? 'Please fill all required fields (Quantity & Base Price) for all variants' : ''}
                  >
                    <Package className="h-4 w-4" />
                    Save & Add Another Group
                  </Button>
                )}

                {/* Save & Continue to Review */}
                {onSaveGroupAndContinue && (
                  <Button
                    onClick={onSaveGroupAndContinue}
                    disabled={!allVariantsComplete}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!allVariantsComplete ? 'Please fill all required fields (Quantity & Base Price) for all variants' : ''}
                  >
                    <Check className="h-4 w-4" />
                    Save Group & Continue to Review
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Helper Text */}
              <p className="text-xs text-center text-green-600">
                💡 You can add multiple groups or proceed to review once this group is complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

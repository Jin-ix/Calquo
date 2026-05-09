import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Package, Tag, FileText } from 'lucide-react';
import { useCategories } from '../context/CategoryProvider';
import { getRelevantHSNCodes, apparelHSNCodes } from '../../utils/hsnCodes';
import { WizardFormData } from './AddStockWizard';

interface AddStockPage1BasicsProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function AddStockPage1Basics({ formData, updateFormData }: AddStockPage1BasicsProps) {
  const { categories, addCategory } = useCategories();
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      updateFormData({ category: newCategoryName.trim() });
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
          <Package className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold">Basic Product Information</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Start by entering the essential details about your product
        </p>
      </div>

      <div className="space-y-5">
        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            Product Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Cotton T-Shirt, Silk Saree, Denim Jeans"
            required
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            Enter a clear, descriptive name for your product
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            Category *
          </Label>
          <div className="flex gap-2">
            <Select 
              value={formData.category} 
              onValueChange={(value) => updateFormData({ category: value })}
            >
              <SelectTrigger className="flex-1 text-base">
                <SelectValue placeholder="Select product category" />
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCategory();
                    }
                  }}
                />
                <DialogFooter>
                  <Button onClick={handleAddNewCategory}>Add Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose the appropriate category or create a new one
          </p>
        </div>

        {/* HSN Code */}
        <div className="space-y-2">
          <Label htmlFor="hsnCode" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            HSN Code
          </Label>
          <Select 
            value={formData.hsnCode} 
            onValueChange={(value) => updateFormData({ hsnCode: value })}
          >
            <SelectTrigger className="text-base">
              <SelectValue placeholder="Select HSN code for GST" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {formData.category ? (
                <>
                  {/* Recommended HSN codes for selected category */}
                  {getRelevantHSNCodes(formData.category).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
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
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
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
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
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
          {formData.hsnCode && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-100">
              <strong>Selected:</strong> {formData.hsnCode}
              {(() => {
                const hsnData = apparelHSNCodes.find(h => h.code === formData.hsnCode);
                return hsnData ? ` - ${hsnData.description.substring(0, 60)}... - GST: ${hsnData.gstRate}` : '';
              })()}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            HSN code is used for GST calculation (optional but recommended)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Product Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe your product in detail - materials, features, style, fit, etc."
            rows={4}
            className="text-base resize-none"
          />
          <p className="text-xs text-muted-foreground">
            A detailed description helps buyers understand your product better
          </p>
        </div>
      </div>

      {/* Required Fields Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900">
          <strong>Required fields:</strong> Product Name and Category are mandatory to proceed to the next step.
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useCategories } from '../context/CategoryProvider';
import { Plus, Edit3, Trash2, ShieldCheck, AlertTriangle, Settings, Tag } from 'lucide-react';
import { toast } from 'sonner';

export function CategoryManager() {
  const { categories, addCategory, removeCategory, editCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Default categories that cannot be deleted or edited
  const DEFAULT_CATEGORIES = [
    'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts', 
    'Jackets', 'Sweaters', 'Shorts', 'Activewear', 'Underwear', 'Accessories',
    'Baby Clothes', 'Kids Wear', 'School Uniforms', 'Sports Wear', 'Ethnic Wear'
  ];

  const handleAddCategory = () => {
    if (addCategory(newCategoryName)) {
      setNewCategoryName('');
      setShowAddDialog(false);
    }
  };

  const handleEditCategory = () => {
    if (editingCategory && editCategory(editingCategory, editedName)) {
      setEditingCategory(null);
      setEditedName('');
      setShowEditDialog(false);
    }
  };

  const handleRemoveCategory = (categoryName: string) => {
    removeCategory(categoryName);
  };

  const startEditingCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditedName(categoryName);
    setShowEditDialog(true);
  };

  const customCategories = categories.filter(cat => !DEFAULT_CATEGORIES.includes(cat));
  const totalCategories = categories.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Category Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage product categories for the Tex-App platform. 
            Manufacturers and traders can also add new categories when adding stock.
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new product category that will be available to all users when adding stock items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Winter Wear"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Category name should be descriptive and between 1-50 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Categories</p>
                <p className="text-2xl font-bold">{DEFAULT_CATEGORIES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custom Categories</p>
                <p className="text-2xl font-bold">{customCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 gap-6">
        {/* System Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              System Categories
              <Badge variant="secondary" className="ml-2">Protected</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Default categories that come with the system. These cannot be modified or deleted.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {DEFAULT_CATEGORIES.map(category => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50 border-green-200">
                  <span className="font-medium text-green-800">{category}</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    System
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Custom Categories
              <Badge variant="outline" className="ml-2">Editable</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Categories added by administrators or users. These can be edited or deleted.
            </p>
          </CardHeader>
          <CardContent>
            {customCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No custom categories yet</p>
                <p className="text-sm">Users can add new categories when creating stock items</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {customCategories.map(category => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline" className="text-xs">
                        Custom
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingCategory(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Delete Category
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the category "{category}"?
                              This action cannot be undone. Existing stock items with this category will keep their category, but it won't be available for new items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveCategory(category)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Category
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name. This will affect how it appears in the category list for all users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter new category name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditCategory();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Category name should be descriptive and between 1-50 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={!editedName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

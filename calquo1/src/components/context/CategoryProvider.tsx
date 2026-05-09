import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { toast } from 'sonner';
import { categoryAPI } from '../../utils/api';

interface CategoryContextType {
  categories: string[];
  addCategory: (categoryName: string) => Promise<boolean>;
  removeCategory: (categoryName: string) => boolean;
  editCategory: (oldName: string, newName: string) => boolean;
  isValidCategory: (categoryName: string) => boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

interface CategoryProviderProps {
  children: ReactNode;
}

// Default categories that come with the system
const DEFAULT_CATEGORIES = [
  'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts',
  'Jackets', 'Sweaters', 'Shorts', 'Activewear', 'Underwear', 'Accessories',
  'Baby Clothes', 'Kids Wear', 'School Uniforms', 'Sports Wear', 'Ethnic Wear'
];

export function CategoryProvider({ children }: CategoryProviderProps) {
  // Start with cached categories or defaults immediately
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('calico-categories');
    if (saved) {
      try {
        const parsedCategories = JSON.parse(saved);
        return Array.from(new Set([...DEFAULT_CATEGORIES, ...parsedCategories]));
      } catch (parseError) {
        console.warn('Error loading categories from localStorage:', parseError);
      }
    }
    return DEFAULT_CATEGORIES;
  });
  const [isLoading, setIsLoading] = useState(false); // Start as not loading

  // Simple background load - no complex timeout logic
  useEffect(() => {
    // Load categories from backend quietly in the background
    categoryAPI.getCategories()
      .then((response) => {
        if (response.success && response.categories && !response.fromFallback) {
          const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...response.categories]));
          setCategories(mergedCategories);
          console.log('Categories loaded from backend');
        }
      })
      .catch(() => {
        // Silent failure - continue with cached/default categories
        console.log('Using default categories');
      });
  }, []);

  // Save categories to localStorage whenever they change (backup)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('calico-categories', JSON.stringify(categories));
    }
  }, [categories, isLoading]);

  const isValidCategory = (categoryName: string): boolean => {
    const trimmed = categoryName.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
  };

  const addCategory = async (categoryName: string): Promise<boolean> => {
    const trimmed = categoryName.trim();

    if (!isValidCategory(trimmed)) {
      toast.error('Category name must be between 1 and 50 characters');
      return false;
    }

    // Check if category already exists (case-insensitive)
    const exists = categories.some(cat => cat.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error('Category already exists');
      return false;
    }

    try {
      // Add to backend
      const response = await categoryAPI.addCategory(trimmed);

      if (response.success) {
        setCategories(prev => [...prev, trimmed].sort());
        toast.success(`Category "${trimmed}" added successfully`);
        return true;
      } else {
        toast.error(response.error || 'Failed to add category');
        return false;
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      // Fallback to local storage only
      setCategories(prev => [...prev, trimmed].sort());
      toast.success(`Category "${trimmed}" added locally`);
      return true;
    }
  };

  const removeCategory = (categoryName: string): boolean => {
    const trimmed = categoryName.trim();

    // Prevent removal of default categories
    if (DEFAULT_CATEGORIES.includes(trimmed)) {
      toast.error('Cannot remove default system categories');
      return false;
    }

    const exists = categories.includes(trimmed);
    if (!exists) {
      toast.error('Category not found');
      return false;
    }

    setCategories(prev => prev.filter(cat => cat !== trimmed));
    toast.success(`Category "${trimmed}" removed successfully`);
    return true;
  };

  const editCategory = (oldName: string, newName: string): boolean => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    // Prevent editing of default categories
    if (DEFAULT_CATEGORIES.includes(trimmedOld)) {
      toast.error('Cannot edit default system categories');
      return false;
    }

    if (!isValidCategory(trimmedNew)) {
      toast.error('Category name must be between 1 and 50 characters');
      return false;
    }

    // Check if new name already exists (case-insensitive, excluding the old name)
    const existsElsewhere = categories.some(cat =>
      cat.toLowerCase() === trimmedNew.toLowerCase() && cat !== trimmedOld
    );
    if (existsElsewhere) {
      toast.error('A category with this name already exists');
      return false;
    }

    const exists = categories.includes(trimmedOld);
    if (!exists) {
      toast.error('Original category not found');
      return false;
    }

    setCategories(prev =>
      prev.map(cat => cat === trimmedOld ? trimmedNew : cat).sort()
    );
    toast.success(`Category renamed from "${trimmedOld}" to "${trimmedNew}"`);
    return true;
  };

  const value: CategoryContextType = {
    categories: categories.sort(),
    addCategory,
    removeCategory,
    editCategory,
    isValidCategory
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

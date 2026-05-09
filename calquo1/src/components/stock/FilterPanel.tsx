import React, { useState } from 'react';
import { X, RotateCcw, Package, MapPin, Building2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '../ui/sheet';

interface FilterState {
  colors: string[];
  sizes: string[];
  priceRange: [number, number];
  suppliers: string[];
  locations: string[];
  categories: string[];
  availability: 'all' | 'in_stock' | 'low_stock';
  itemType: 'all' | 'set_of_pattern' | 'single_color' | 'individual_flex';
}

interface FilterOptions {
  colors: string[];
  sizes: string[];
  suppliers: string[];
  locations: string[];
  categories: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filterOptions: FilterOptions;
  isMobile?: boolean;
  showMobileQuickFilters?: boolean;
}

export function FilterPanel({ 
  filters, 
  onFiltersChange, 
  filterOptions, 
  isMobile = false,
  showMobileQuickFilters = true 
}: FilterPanelProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['categories', 'locations', 'suppliers'])
  );

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'colors' | 'sizes' | 'suppliers' | 'locations' | 'categories', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      colors: [],
      sizes: [],
      priceRange: [0, 10000],
      suppliers: [],
      locations: [],
      categories: [],
      availability: 'all',
      itemType: 'all'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.colors.length > 0) count += filters.colors.length;
    if (filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.suppliers.length > 0) count += filters.suppliers.length;
    if (filters.locations.length > 0) count += filters.locations.length;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.availability !== 'all') count++;
    if (filters.itemType !== 'all') count++;
    return count;
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const activeCount = getActiveFilterCount();

  // Quick filter button component for mobile
  const quickFilterButton = (
    label: string,
    icon: React.ReactNode,
    count: number,
    onClear: () => void,
    color: string
  ) => (
    null
  );

  // Mobile collapsible section component
  const mobileFilterSection = (
    title: string,
    icon: React.ReactNode,
    sectionKey: string,
    items: string[],
    filterKey: 'colors' | 'sizes' | 'suppliers' | 'locations' | 'categories',
    colorClass: string
  ) => (
    <div className="space-y-3">
      <Button
        variant="ghost"
        className="w-full justify-between p-2 h-auto"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
          {filters[filterKey].length > 0 && (
            <Badge variant="secondary" className={`${colorClass} text-white text-xs`}>
              {filters[filterKey].length}
            </Badge>
          )}
        </div>
        {expandedSections.has(sectionKey) ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
        }
      </Button>
      
      {expandedSections.has(sectionKey) && (
        <div className="pl-6 space-y-2 max-h-40 overflow-y-auto">
          {items.map(item => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={`mobile-${filterKey}-${item}`}
                checked={filters[filterKey].includes(item)}
                onCheckedChange={() => toggleArrayFilter(filterKey, item)}
              />
              <Label
                htmlFor={`mobile-${filterKey}-${item}`}
                className="text-sm font-normal cursor-pointer"
              >
                {item}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Mobile view
  if (isMobile) {
    return (
      <>
        {/* Quick Filter Bar for Mobile */}
        {showMobileQuickFilters && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4 overflow-x-auto">
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 flex-shrink-0">
                  <Filter className="w-4 h-4 mr-2" />
                  All Filters
                  {activeCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {activeCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </span>
                    {activeCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear All
                      </Button>
                    )}
                  </SheetTitle>
                  <SheetDescription>
                    Adjust your search filters to find exactly what you're looking for
                  </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="h-full mt-4">
                  <div className="space-y-6 pr-4">
                    {/* Categories */}
                    {filterOptions.categories.length > 0 && (
                      <>
                        {mobileFilterSection(
                          "Categories",
                          <Package className="w-4 h-4 text-pastel-purple-text" />,
                          "categories",
                          filterOptions.categories,
                          "categories",
                          "bg-pastel-purple-text"
                        )}
                        <Separator />
                      </>
                    )}

                    {/* Cities/Locations */}
                    {filterOptions.locations.length > 0 && (
                      <>
                        {mobileFilterSection(
                          "Cities",
                          <MapPin className="w-4 h-4 text-pastel-blue-text" />,
                          "locations",
                          filterOptions.locations,
                          "locations",
                          "bg-pastel-blue-text"
                        )}
                        <Separator />
                      </>
                    )}

                    {/* Suppliers */}
                    {filterOptions.suppliers.length > 0 && (
                      <>
                        {mobileFilterSection(
                          "Suppliers",
                          <Building2 className="w-4 h-4 text-pastel-green-text" />,
                          "suppliers",
                          filterOptions.suppliers,
                          "suppliers",
                          "bg-pastel-green-text"
                        )}
                        <Separator />
                      </>
                    )}

                    {/* Colors */}
                    {filterOptions.colors.length > 0 && (
                      <>
                        {mobileFilterSection(
                          "Colors",
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-blue-400" />,
                          "colors",
                          filterOptions.colors,
                          "colors",
                          "bg-gray-500"
                        )}
                        <Separator />
                      </>
                    )}

                    {/* Sizes */}
                    {filterOptions.sizes.length > 0 && (
                      <>
                        {mobileFilterSection(
                          "Sizes",
                          <span className="w-4 h-4 border border-current rounded text-xs flex items-center justify-center">S</span>,
                          "sizes",
                          filterOptions.sizes,
                          "sizes",
                          "bg-gray-500"
                        )}
                        <Separator />
                      </>
                    )}

                    {/* Additional Filters */}
                    <div className="space-y-4">
                      {/* Item Type */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Item Type</Label>
                        <Select
                          value={filters.itemType}
                          onValueChange={(value: any) => updateFilter('itemType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="set_of_pattern">Set of Pattern</SelectItem>
                            <SelectItem value="single_color">Single Color</SelectItem>
                            <SelectItem value="individual_flex">Individual Flex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Availability */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Availability</Label>
                        <Select
                          value={filters.availability}
                          onValueChange={(value: any) => updateFilter('availability', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Stock</SelectItem>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="low_stock">Low Stock (≤10)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Price Range</Label>
                        <div className="px-2">
                          <Slider
                            value={filters.priceRange}
                            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                            max={10000}
                            min={0}
                            step={100}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>₹{filters.priceRange[0]}</span>
                            <span>₹{filters.priceRange[1]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Quick Filter Chips */}
            <div className="flex gap-2 overflow-x-auto">
              {quickFilterButton(
                "Categories",
                <Package className="w-3 h-3" />,
                filters.categories.length,
                () => updateFilter('categories', []),
                "bg-pastel-purple-text"
              )}
              
              {quickFilterButton(
                "Cities",
                <MapPin className="w-3 h-3" />,
                filters.locations.length,
                () => updateFilter('locations', []),
                "bg-pastel-blue-text"
              )}
              
              {quickFilterButton(
                "Suppliers",
                <Building2 className="w-3 h-3" />,
                filters.suppliers.length,
                () => updateFilter('suppliers', []),
                "bg-pastel-green-text"
              )}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mb-4 border border-primary/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                {activeCount} filter{activeCount !== 1 ? 's' : ''} active
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </>
    );
  }

  // Desktop view
  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Badge variant="secondary" className="bg-pastel-blue text-pastel-blue-text">
                {activeCount} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              disabled={activeCount === 0}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="space-y-6 pr-4">
            {/* Primary Filters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                <Label className="text-sm font-semibold text-primary">Primary Filters</Label>
              </div>

              {/* Category Filter - Enhanced */}
              {filterOptions.categories.length > 0 && (
                <div className="space-y-3 p-3 rounded-lg bg-pastel-purple border border-pastel-purple-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Package className="w-4 h-4 text-pastel-purple-text" />
                      Categories
                    </Label>
                    {filters.categories.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-pastel-purple-text text-white text-xs">
                          {filters.categories.length} selected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilter('categories', [])}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
                    {filterOptions.categories.map(category => (
                      <div key={category} className="flex items-center space-x-2 p-1 rounded hover:bg-white/50">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={() => toggleArrayFilter('categories', category)}
                        />
                        <Label
                          htmlFor={`category-${category}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cities/Locations Filter - Enhanced */}
              {filterOptions.locations.length > 0 && (
                <div className="space-y-3 p-3 rounded-lg bg-pastel-blue border border-pastel-blue-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-pastel-blue-text" />
                      Cities
                    </Label>
                    {filters.locations.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-pastel-blue-text text-white text-xs">
                          {filters.locations.length} selected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilter('locations', [])}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
                    {filterOptions.locations.map(location => (
                      <div key={location} className="flex items-center space-x-2 p-1 rounded hover:bg-white/50">
                        <Checkbox
                          id={`location-${location}`}
                          checked={filters.locations.includes(location)}
                          onCheckedChange={() => toggleArrayFilter('locations', location)}
                        />
                        <Label
                          htmlFor={`location-${location}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers Filter - Enhanced */}
              {filterOptions.suppliers.length > 0 && (
                <div className="space-y-3 p-3 rounded-lg bg-pastel-green border border-pastel-green-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-pastel-green-text" />
                      Suppliers
                    </Label>
                    {filters.suppliers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-pastel-green-text text-white text-xs">
                          {filters.suppliers.length} selected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilter('suppliers', [])}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
                    {filterOptions.suppliers.map(supplier => (
                      <div key={supplier} className="flex items-center space-x-2 p-1 rounded hover:bg-white/50">
                        <Checkbox
                          id={`supplier-${supplier}`}
                          checked={filters.suppliers.includes(supplier)}
                          onCheckedChange={() => toggleArrayFilter('suppliers', supplier)}
                        />
                        <Label
                          htmlFor={`supplier-${supplier}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {supplier}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Secondary Filters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                <Label className="text-sm font-semibold text-muted-foreground">Additional Filters</Label>
              </div>

              {/* Item Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Item Type</Label>
                <Select
                  value={filters.itemType}
                  onValueChange={(value: any) => updateFilter('itemType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="set_of_pattern">Set of Pattern</SelectItem>
                    <SelectItem value="single_color">Single Color</SelectItem>
                    <SelectItem value="individual_flex">Individual Flex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Availability</Label>
                <Select
                  value={filters.availability}
                  onValueChange={(value: any) => updateFilter('availability', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock (≤10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                    max={10000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>₹{filters.priceRange[0]}</span>
                    <span>₹{filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Tertiary Filters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/50"></div>
                <Label className="text-sm font-semibold text-muted-foreground/80">Style Filters</Label>
              </div>

              {/* Colors Filter */}
              {filterOptions.colors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Colors</Label>
                    {filters.colors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {filters.colors.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilter('colors', [])}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                    {filterOptions.colors.map(color => (
                      <div key={color} className="flex items-center space-x-2 p-1 rounded hover:bg-muted/30">
                        <Checkbox
                          id={`color-${color}`}
                          checked={filters.colors.includes(color)}
                          onCheckedChange={() => toggleArrayFilter('colors', color)}
                        />
                        <Label
                          htmlFor={`color-${color}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {color}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes Filter */}
              {filterOptions.sizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Sizes</Label>
                    {filters.sizes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {filters.sizes.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilter('sizes', [])}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                    {filterOptions.sizes.map(size => (
                      <div key={size} className="flex items-center space-x-2 p-1 rounded hover:bg-muted/30">
                        <Checkbox
                          id={`size-${size}`}
                          checked={filters.sizes.includes(size)}
                          onCheckedChange={() => toggleArrayFilter('sizes', size)}
                        />
                        <Label
                          htmlFor={`size-${size}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

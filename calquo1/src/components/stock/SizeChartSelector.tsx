import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Baby, Users, User, Shirt, Ruler } from 'lucide-react';

export interface SizeDetails {
  ageCategory: 'Baby' | 'Kids' | 'Adult';
  genderCategory: 'Male' | 'Female' | 'Unisex';
  sizeType: 'alphabet' | 'numerical';
  size: string;
  displayName: string; // Full display name for the size
}

interface SizeChartSelectorProps {
  value?: SizeDetails;
  onChange: (sizeDetails: SizeDetails) => void;
  className?: string;
}

// Size definitions for different categories
const ALPHABET_SIZES = {
  Baby: ['NB', 'XS', 'S', 'M', 'L', 'XL'],
  Kids: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  Adult: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
};

const NUMERICAL_SIZES = {
  Baby: Array.from({ length: 12 }, (_, i) => (i + 1).toString()), // 1-12 months
  Kids: Array.from({ length: 16 }, (_, i) => (i + 1).toString()), // 1-16 years
  Adult: Array.from({ length: 50 }, (_, i) => (i + 1).toString())  // 1-50 (numerical sizing)
};

const AGE_CATEGORIES = [
  { value: 'Baby' as const, label: 'Baby', icon: Baby, description: '0-2 years' },
  { value: 'Kids' as const, label: 'Kids', icon: Users, description: '2-16 years' },
  { value: 'Adult' as const, label: 'Adult', icon: User, description: '16+ years' }
];

const GENDER_CATEGORIES = [
  { value: 'Male' as const, label: 'Male' },
  { value: 'Female' as const, label: 'Female' },
  { value: 'Unisex' as const, label: 'Unisex' }
];

export function SizeChartSelector({ value, onChange, className }: SizeChartSelectorProps) {
  const [ageCategory, setAgeCategory] = useState<'Baby' | 'Kids' | 'Adult' | undefined>(value?.ageCategory);
  const [genderCategory, setGenderCategory] = useState<'Male' | 'Female' | 'Unisex' | undefined>(value?.genderCategory);
  const [sizeType, setSizeType] = useState<'alphabet' | 'numerical'>(value?.sizeType || 'alphabet');
  const [selectedSize, setSelectedSize] = useState<string | undefined>(value?.size);

  // Update when props change
  useEffect(() => {
    if (value) {
      setAgeCategory(value.ageCategory);
      setGenderCategory(value.genderCategory);
      setSizeType(value.sizeType);
      setSelectedSize(value.size);
    }
  }, [value]);

  // Generate display name for the size
  const generateDisplayName = (
    age: 'Baby' | 'Kids' | 'Adult',
    gender: 'Male' | 'Female' | 'Unisex',
    type: 'alphabet' | 'numerical',
    size: string
  ): string => {
    const parts = [age, gender, type === 'alphabet' ? 'Alpha' : 'Numeric', size];
    return parts.join(' - ');
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    if (!ageCategory || !genderCategory) return;

    setSelectedSize(size);
    
    const sizeDetails: SizeDetails = {
      ageCategory,
      genderCategory,
      sizeType,
      size,
      displayName: generateDisplayName(ageCategory, genderCategory, sizeType, size)
    };

    onChange(sizeDetails);
  };

  // Handle age category change
  const handleAgeCategoryChange = (age: 'Baby' | 'Kids' | 'Adult') => {
    setAgeCategory(age);
    setSelectedSize(undefined);
    
    // Auto-select recommended size type based on age
    const recommendedType = age === 'Baby' ? 'numerical' : 'alphabet';
    setSizeType(recommendedType);
  };

  // Handle gender category change
  const handleGenderCategoryChange = (gender: 'Male' | 'Female' | 'Unisex') => {
    setGenderCategory(gender);
    setSelectedSize(undefined);
  };

  // Handle size type change
  const handleSizeTypeChange = (type: 'alphabet' | 'numerical') => {
    setSizeType(type);
    setSelectedSize(undefined);
  };

  // Get available sizes based on current selections
  const getAvailableSizes = () => {
    if (!ageCategory) return [];
    
    if (sizeType === 'alphabet') {
      return ALPHABET_SIZES[ageCategory];
    } else {
      return NUMERICAL_SIZES[ageCategory];
    }
  };

  // Get size type description
  const getSizeTypeDescription = () => {
    if (sizeType === 'alphabet') {
      return 'Letter-based sizing (XS, S, M, L, etc.)';
    } else {
      if (ageCategory === 'Baby') return 'Month-based sizing (1-12 months)';
      if (ageCategory === 'Kids') return 'Age-based sizing (1-16 years)';
      return 'Numerical sizing (1-50)';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shirt className="h-5 w-5" />
          Size Chart Selection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select age category, gender, and size type for precise sizing information
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Age Category Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Age Category</Label>
          <div className="grid grid-cols-3 gap-3">
            {AGE_CATEGORIES.map(({ value, label, icon: Icon, description }) => (
              <Button
                key={value}
                variant={ageCategory === value ? "default" : "outline"}
                onClick={() => handleAgeCategoryChange(value)}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Gender Category Selection */}
        {ageCategory && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Gender Category</Label>
            <div className="grid grid-cols-3 gap-3">
              {GENDER_CATEGORIES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={genderCategory === value ? "default" : "outline"}
                  onClick={() => handleGenderCategoryChange(value)}
                  className="h-auto p-3"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Size Type Selection */}
        {ageCategory && genderCategory && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Size Type</Label>
            <Tabs value={sizeType} onValueChange={(value) => handleSizeTypeChange(value as 'alphabet' | 'numerical')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="alphabet" className="flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  Alphabet
                </TabsTrigger>
                <TabsTrigger value="numerical" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Numerical
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-2 p-3 bg-muted/50 rounded text-sm text-muted-foreground">
                {getSizeTypeDescription()}
              </div>
            </Tabs>
          </div>
        )}

        {/* Size Selection */}
        {ageCategory && genderCategory && (
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Select Size
              {ageCategory === 'Baby' && sizeType === 'numerical' && (
                <Badge variant="secondary" className="ml-2 text-xs">Months</Badge>
              )}
              {ageCategory === 'Kids' && sizeType === 'numerical' && (
                <Badge variant="secondary" className="ml-2 text-xs">Years</Badge>
              )}
            </Label>
            
            <Select value={selectedSize || ''} onValueChange={handleSizeSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a size" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableSizes().map(size => (
                  <SelectItem key={size} value={size}>
                    <div className="flex items-center gap-2">
                      <span>{size}</span>
                      {sizeType === 'numerical' && ageCategory === 'Baby' && (
                        <span className="text-xs text-muted-foreground">months</span>
                      )}
                      {sizeType === 'numerical' && ageCategory === 'Kids' && (
                        <span className="text-xs text-muted-foreground">years</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Size Guide */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {sizeType === 'alphabet' && (
                <div className="space-y-1">
                  <p className="font-medium">Alphabet Guide:</p>
                  <p className="text-muted-foreground">
                    XS (Extra Small), S (Small), M (Medium), L (Large), 
                    XL (Extra Large), XXL (Double XL), 3XL (Triple XL)
                  </p>
                </div>
              )}
              {sizeType === 'numerical' && ageCategory === 'Adult' && (
                <div className="space-y-1">
                  <p className="font-medium">Numerical Guide:</p>
                  <p className="text-muted-foreground">
                    Standard numerical sizing from 1-50 based on measurements
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Size Summary */}
        {ageCategory && genderCategory && selectedSize && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <Label className="text-base font-medium text-primary">Selected Size Details</Label>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Age Category:</span>
                <Badge variant="outline">{ageCategory}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gender:</span>
                <Badge variant="outline">{genderCategory}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size Type:</span>
                <Badge variant="outline">{sizeType === 'alphabet' ? 'Alphabet' : 'Numerical'}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <Badge className="bg-primary text-primary-foreground">{selectedSize}</Badge>
              </div>
              <div className="mt-2 pt-2 border-t border-primary/20">
                <span className="text-xs text-muted-foreground">Full Description:</span>
                <p className="font-medium text-sm">
                  {generateDisplayName(ageCategory, genderCategory, sizeType, selectedSize)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

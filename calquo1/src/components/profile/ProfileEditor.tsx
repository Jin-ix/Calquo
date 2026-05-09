import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth, BusinessCategory, RetailerType } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { useStock } from '../context/StockContext';
import { toast } from 'sonner';
import { User, Building, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';

interface ProfileEditorProps {
  onBack: () => void;
}

export function ProfileEditor({ onBack }: ProfileEditorProps) {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { refreshStock } = useStock();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.profile.fullName || '',
    phone: user?.profile.phone || '',
    company: user?.profile.company || '',
    businessCategory: user?.profile.businessCategory || 'retailer' as BusinessCategory,
    retailerType: user?.profile.retailerType || 'single-shop' as RetailerType,
    street: user?.profile.address.street || '',
    city: user?.profile.address.city || '',
    state: user?.profile.address.state || '',
    postalCode: user?.profile.address.postalCode || '',
    gstNumber: user?.profile.gstNumber || '',
    panNumber: user?.profile.panNumber || '',
    language: user?.profile.language || 'en' as 'en' | 'hi' | 'ml'
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        company: formData.company,
        businessCategory: formData.businessCategory,
        retailerType: formData.retailerType,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: 'India'
        },
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        language: formData.language
      });

      if (success) {
        toast.success('Profile updated successfully!');
        
        // Refresh stock data to reflect location changes (with small delay to ensure backend processing)
        setTimeout(async () => {
          try {
            await refreshStock();
            console.log('Stock data refreshed after profile update');
          } catch (error) {
            console.error('Failed to refresh stock data:', error);
          }
        }, 1000);
        
        onBack();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('profile.fullname')}</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')} (Read-only)</Label>
                  <Input
                    id="email"
                    value={user.profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value: 'en' | 'hi' | 'ml') => handleChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="ml">മലയാളം</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">{t('profile.company')}</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCategory">{t('profile.businesscategory')}</Label>
                  <Select value={formData.businessCategory} onValueChange={(value: BusinessCategory) => handleChange('businessCategory', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">{t('auth.manufacturer')}</SelectItem>
                      <SelectItem value="agent">{t('auth.agent')}</SelectItem>
                      <SelectItem value="dealer">{t('auth.dealer')}</SelectItem>
                      <SelectItem value="retailer">{t('auth.retailer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Retailer Type - Only show for retailers */}
                {(user.role === 'retailer' || formData.businessCategory === 'retailer') && (
                  <div className="space-y-2">
                    <Label htmlFor="retailerType">Retailer Type *</Label>
                    <Select value={formData.retailerType} onValueChange={(value: RetailerType) => handleChange('retailerType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-shop">Single Shop</SelectItem>
                        <SelectItem value="multi-shop">Multi Shop</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.retailerType === 'single-shop' ? 
                        'You operate a single retail outlet' : 
                        'You operate multiple retail outlets or a chain of stores'
                      }
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => handleChange('gstNumber', e.target.value)}
                    placeholder="27AAECE4266B1ZP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => handleChange('panNumber', e.target.value)}
                    placeholder="AAECE4266B"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Textarea
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    rows={2}
                    placeholder="Building, Street, Area"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : t('common.save')}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

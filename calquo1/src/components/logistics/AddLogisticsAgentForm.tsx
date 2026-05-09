import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, X } from 'lucide-react';
import { LogisticsAgent, DeliveryCity, MAJOR_INDIAN_CITIES } from './LogisticsTypes';
import { toast } from 'sonner';

interface AddLogisticsAgentFormProps {
  cities: DeliveryCity[];
  onSubmit: (agent: Omit<LogisticsAgent, 'id' | 'dateAdded' | 'isActive'>) => void;
  onCancel: () => void;
}

export function AddLogisticsAgentForm({ cities, onSubmit, onCancel }: AddLogisticsAgentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    gstNumber: '',
    mobileNumber: '',
    serviceAreaType: 'selected-cities' as 'all-india' | 'selected-cities',
    selectedCities: [] as string[],
    specialServices: [] as string[]
  });
  const [citySearch, setCitySearch] = useState('');
  const [customService, setCustomService] = useState('');

  const availableCities = MAJOR_INDIAN_CITIES.concat(
    cities.filter(city => city.isActive && !MAJOR_INDIAN_CITIES.includes(city.name))
         .map(city => city.name)
  ).sort();

  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase()) &&
    !formData.selectedCities.includes(city)
  );

  const predefinedServices = [
    'Same Day Delivery',
    'Next Day Delivery',
    'Express Delivery',
    'Bulk Transport',
    'Temperature Controlled',
    'Fragile Item Handling',
    'COD Available',
    'Return Pickup',
    'Real-time Tracking',
    'SMS Updates'
  ];

  const handleCityToggle = (city: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(city)
        ? prev.selectedCities.filter(c => c !== city)
        : [...prev.selectedCities, city]
    }));
  };

  const handleRemoveCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.filter(c => c !== city)
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      specialServices: prev.specialServices.includes(service)
        ? prev.specialServices.filter(s => s !== service)
        : [...prev.specialServices, service]
    }));
  };

  const handleAddCustomService = () => {
    if (customService.trim() && !formData.specialServices.includes(customService.trim())) {
      setFormData(prev => ({
        ...prev,
        specialServices: [...prev.specialServices, customService.trim()]
      }));
      setCustomService('');
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      specialServices: prev.specialServices.filter(s => s !== service)
    }));
  };

  const validateGST = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter agent name');
      return;
    }

    if (!validateGST(formData.gstNumber)) {
      toast.error('Please enter a valid GST number');
      return;
    }

    if (!validateMobile(formData.mobileNumber)) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    if (formData.serviceAreaType === 'selected-cities' && formData.selectedCities.length === 0) {
      toast.error('Please select at least one city for service area');
      return;
    }

    const agentData = {
      name: formData.name.trim(),
      gstNumber: formData.gstNumber.toUpperCase(),
      mobileNumber: formData.mobileNumber,
      serviceArea: {
        type: formData.serviceAreaType,
        ...(formData.serviceAreaType === 'selected-cities' && {
          cities: formData.selectedCities
        })
      },
      specialServices: formData.specialServices
    };

    onSubmit(agentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter agent/company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST Number *</Label>
            <Input
              id="gstNumber"
              value={formData.gstNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
              placeholder="9876543210"
              maxLength={10}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Area *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={formData.serviceAreaType} 
            onValueChange={(value: 'all-india' | 'selected-cities') => 
              setFormData(prev => ({ ...prev, serviceAreaType: value }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all-india" id="all-india" />
              <Label htmlFor="all-india">All India</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="selected-cities" id="selected-cities" />
              <Label htmlFor="selected-cities">Selected Cities</Label>
            </div>
          </RadioGroup>

          {formData.serviceAreaType === 'selected-cities' && (
            <div className="space-y-4">
              {/* Selected Cities Display */}
              {formData.selectedCities.length > 0 && (
                <div>
                  <Label className="text-sm">Selected Cities ({formData.selectedCities.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/50 rounded-md">
                    {formData.selectedCities.map(city => (
                      <Badge key={city} variant="secondary" className="pr-1">
                        {city}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveCity(city)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* City Search and Selection */}
              <div className="space-y-2">
                <Label>Search and Add Cities</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search cities..."
                    className="pl-10"
                  />
                </div>
                
                {citySearch && (
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto bg-background">
                    {filteredCities.length > 0 ? (
                      <div className="space-y-1">
                        {filteredCities.slice(0, 10).map(city => (
                          <div
                            key={city}
                            className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                            onClick={() => {
                              handleCityToggle(city);
                              setCitySearch('');
                            }}
                          >
                            {city}
                          </div>
                        ))}
                        {filteredCities.length > 10 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            +{filteredCities.length - 10} more cities...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No cities found. Contact admin to add new cities.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Special Services (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predefined Services */}
          <div>
            <Label className="text-sm">Available Services</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {predefinedServices.map(service => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={formData.specialServices.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <Label htmlFor={service} className="text-sm cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Service */}
          <div className="space-y-2">
            <Label>Add Custom Service</Label>
            <div className="flex space-x-2">
              <Input
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                placeholder="Enter custom service"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomService())}
              />
              <Button type="button" onClick={handleAddCustomService}>
                Add
              </Button>
            </div>
          </div>

          {/* Selected Services */}
          {formData.specialServices.length > 0 && (
            <div>
              <Label className="text-sm">Selected Services</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specialServices.map(service => (
                  <Badge key={service} variant="outline" className="pr-1">
                    {service}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleRemoveService(service)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex space-x-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Agent
        </Button>
      </div>
    </form>
  );
}

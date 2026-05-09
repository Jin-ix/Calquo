import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { MapPin, Loader2, Navigation } from 'lucide-react';

interface LocationData {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  formatted_address?: string;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  errors?: {
    street_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
}

export function LocationPicker({ value, onChange, errors }: LocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setShowManualEntry(true);
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'CALICO-PWA/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch location details');
          }

          const data = await response.json();
          const address = data.address;

          // Extract address components
          const locationData: LocationData = {
            street_address: [
              address.road,
              address.suburb || address.neighbourhood,
              address.city_district
            ].filter(Boolean).join(', ') || '',
            city: address.city || address.town || address.village || address.county || '',
            state: address.state || '',
            postal_code: address.postcode || '',
            formatted_address: data.display_name
          };

          onChange(locationData);
          toast.success('Location retrieved successfully!');
          setShowManualEntry(true); // Allow user to edit
        } catch (error) {
          console.error('Error fetching location:', error);
          toast.error('Failed to get location details. Please enter manually.');
          setShowManualEntry(true);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to retrieve location. Please enter manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        toast.error(errorMessage);
        setShowManualEntry(true);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#334155]">Address Information</h3>
        {!showManualEntry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="gap-2"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Use Current Location
              </>
            )}
          </Button>
        )}
        {showManualEntry && !value.street_address && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="gap-2"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Retry Location
              </>
            )}
          </Button>
        )}
      </div>

      {!showManualEntry && !value.street_address && (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Get Your Location</p>
            <p className="text-sm text-muted-foreground">
              Click the button above to automatically detect your location,
              <br />
              or{' '}
              <button
                type="button"
                onClick={() => setShowManualEntry(true)}
                className="text-primary underline hover:no-underline"
              >
                enter address manually
              </button>
            </p>
          </div>
        </div>
      )}

      {(showManualEntry || value.street_address) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street_address">Street Address *</Label>
            <Textarea
              id="street_address"
              value={value.street_address}
              onChange={(e) => onChange({ ...value, street_address: e.target.value })}
              placeholder="Enter street address"
              rows={2}
              className={errors?.street_address ? 'border-destructive rounded-xl' : 'rounded-xl'}
            />
            {errors?.street_address && (
              <p className="text-destructive text-sm">{errors.street_address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="Enter city"
              className={errors?.city ? 'border-destructive rounded-xl' : 'rounded-xl'}
            />
            {errors?.city && (
              <p className="text-destructive text-sm">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input
              id="postal_code"
              value={value.postal_code}
              onChange={(e) => onChange({ ...value, postal_code: e.target.value })}
              placeholder="Enter postal code"
              className={errors?.postal_code ? 'border-destructive rounded-xl' : 'rounded-xl'}
            />
            {errors?.postal_code && (
              <p className="text-destructive text-sm">{errors.postal_code}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder="Enter state"
              className={errors?.state ? 'border-destructive rounded-xl' : 'rounded-xl'}
            />
            {errors?.state && (
              <p className="text-destructive text-sm">{errors.state}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="gap-2"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Update to Current Location
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

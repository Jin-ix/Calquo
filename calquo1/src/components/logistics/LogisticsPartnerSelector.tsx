import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Truck, Star, Clock, MapPin, CheckCircle } from 'lucide-react';

interface LogisticsPartner {
  id: string;
  name: string;
  rating: number;
  estimatedDays: string;
  coverage: string[];
  specialties: string[];
  pricing: 'economy' | 'standard' | 'express';
  available: boolean;
}

interface LogisticsPartnerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignLogistics: (partnerId: string, partnerName: string, remarks: string) => void;
  buyerLocation?: string;
  sellerLocation?: string;
}

// Mock logistics partners data
const mockLogisticsPartners: LogisticsPartner[] = [
  {
    id: 'LOG-001',
    name: 'SwiftLogistics Express',
    rating: 4.8,
    estimatedDays: '1-2',
    coverage: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'],
    specialties: ['Express Delivery', 'Same Day', 'Fragile Items'],
    pricing: 'express',
    available: true
  },
  {
    id: 'LOG-002',
    name: 'NationWide Logistics',
    rating: 4.5,
    estimatedDays: '2-4',
    coverage: ['All Major Cities', 'Tier 2 Cities', 'Rural Areas'],
    specialties: ['Pan-India Coverage', 'Bulk Orders', 'COD Available'],
    pricing: 'standard',
    available: true
  },
  {
    id: 'LOG-003',
    name: 'EcoFriendly Transport',
    rating: 4.6,
    estimatedDays: '3-5',
    coverage: ['Western India', 'Southern India', 'Central India'],
    specialties: ['Eco-Friendly', 'Green Packaging', 'Carbon Neutral'],
    pricing: 'economy',
    available: true
  },
  {
    id: 'LOG-004',
    name: 'FastTrack Couriers',
    rating: 4.7,
    estimatedDays: '1-3',
    coverage: ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad'],
    specialties: ['Technology Hub', 'Real-time Tracking', '24/7 Support'],
    pricing: 'express',
    available: false
  }
];

export function LogisticsPartnerSelector({
  isOpen,
  onClose,
  onAssignLogistics,
  buyerLocation,
  sellerLocation
}: LogisticsPartnerSelectorProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPartnerId || !remarks.trim()) {
      return;
    }

    const selectedPartner = mockLogisticsPartners.find(p => p.id === selectedPartnerId);
    if (!selectedPartner) return;

    setIsSubmitting(true);
    try {
      onAssignLogistics(selectedPartnerId, selectedPartner.name, remarks.trim());
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPartnerId('');
    setRemarks('');
    onClose();
  };

  const getPricingColor = (pricing: LogisticsPartner['pricing']) => {
    switch (pricing) {
      case 'economy': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'express': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedPartner = mockLogisticsPartners.find(p => p.id === selectedPartnerId);
  const wordCount = remarks.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isRemarksValid = wordCount > 0 && wordCount <= 50;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Select Logistics Partner</h2>
              <p className="text-muted-foreground">Choose a logistics partner to handle the shipment</p>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>

          {/* Route Info */}
          {(sellerLocation || buyerLocation) && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Shipment Route</h3>
              <div className="flex items-center gap-4">
                {sellerLocation && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{sellerLocation}</span>
                  </div>
                )}
                <div className="flex-1 border-t border-dashed border-gray-300"></div>
                {buyerLocation && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{buyerLocation}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logistics Partners Grid */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Available Logistics Partners</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockLogisticsPartners.map((partner) => (
                  <Card 
                    key={partner.id} 
                    className={`cursor-pointer transition-all ${
                      selectedPartnerId === partner.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary/50'
                    } ${!partner.available ? 'opacity-50' : ''}`}
                    onClick={() => partner.available && setSelectedPartnerId(partner.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${!partner.available ? 'grayscale' : ''}`}>
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{partner.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{partner.rating}</span>
                              </div>
                              <Badge className={getPricingColor(partner.pricing)}>
                                {partner.pricing}
                              </Badge>
                              {!partner.available && (
                                <Badge variant="secondary">Unavailable</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedPartnerId === partner.id && partner.available && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Delivery: {partner.estimatedDays} days</span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Coverage: </span>
                          <span>{partner.coverage.slice(0, 2).join(', ')}</span>
                          {partner.coverage.length > 2 && (
                            <span className="text-muted-foreground"> +{partner.coverage.length - 2} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {partner.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Selected Partner Details */}
            {selectedPartner && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Selected: {selectedPartner.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedPartner.rating}/5.0</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delivery Time:</span>
                      <p className="font-medium mt-1">{selectedPartner.estimatedDays} days</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pricing:</span>
                      <Badge className={getPricingColor(selectedPartner.pricing)} variant="secondary">
                        {selectedPartner.pricing}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Coverage:</span>
                      <p className="font-medium mt-1">{selectedPartner.coverage.length} regions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="logistics-remarks">Shipping Instructions *</Label>
                <span className={`text-sm ${wordCount > 50 ? 'text-red-500' : wordCount > 40 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {wordCount}/50 words
                </span>
              </div>
              <Textarea
                id="logistics-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide shipping instructions, special handling requirements, or delivery notes (required, max 50 words)"
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              
              {remarks && !isRemarksValid && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {wordCount === 0 
                      ? "Shipping instructions are required."
                      : "Instructions must not exceed 50 words."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedPartnerId || !isRemarksValid || isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? 'Assigning...' : 'Assign & Ship'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

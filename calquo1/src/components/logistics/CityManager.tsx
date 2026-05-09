import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Plus, 
  Search, 
  MapPin, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { DeliveryCity, MAJOR_INDIAN_CITIES } from './LogisticsTypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';

interface CityManagerProps {
  cities: DeliveryCity[];
  onAddCity: (city: Omit<DeliveryCity, 'id' | 'dateAdded'>) => void;
  onUpdateCity: (cityId: string, updates: Partial<DeliveryCity>) => void;
  onDeleteCity: (cityId: string) => void;
}

interface AddCityFormData {
  name: string;
  state: string;
  pincode: string;
}

export function CityManager({ cities, onAddCity, onUpdateCity, onDeleteCity }: CityManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCity, setEditingCity] = useState<DeliveryCity | null>(null);
  const [formData, setFormData] = useState<AddCityFormData>({
    name: '',
    state: '',
    pincode: ''
  });

  // Filter out cities that are already in MAJOR_INDIAN_CITIES to avoid duplicates
  const customCities = cities.filter(city => !MAJOR_INDIAN_CITIES.includes(city.name));
  
  const filteredCities = customCities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (city.pincode && city.pincode.includes(searchTerm))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.state.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if city already exists
    const existingCity = cities.find(city => 
      city.name.toLowerCase() === formData.name.trim().toLowerCase()
    );
    
    if (existingCity && !editingCity) {
      toast.error('City already exists');
      return;
    }

    const cityData = {
      name: formData.name.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim() || undefined,
      isActive: true
    };

    if (editingCity) {
      onUpdateCity(editingCity.id, cityData);
      setEditingCity(null);
      toast.success('City updated successfully!');
    } else {
      onAddCity(cityData);
      toast.success('City added successfully!');
    }

    setFormData({ name: '', state: '', pincode: '' });
    setShowAddForm(false);
  };

  const handleEdit = (city: DeliveryCity) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      state: city.state,
      pincode: city.pincode || ''
    });
    setShowAddForm(true);
  };

  const handleToggleStatus = (cityId: string, currentStatus: boolean) => {
    onUpdateCity(cityId, { isActive: !currentStatus });
    toast.success(`City ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
  };

  const handleDelete = (cityId: string) => {
    if (window.confirm('Are you sure you want to delete this city?')) {
      onDeleteCity(cityId);
      toast.success('City deleted successfully!');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCity(null);
    setFormData({ name: '', state: '', pincode: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Delivery Cities Management</h2>
          <p className="text-muted-foreground">
            Manage additional delivery cities beyond major Indian cities
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add City
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm">
                <strong>{MAJOR_INDIAN_CITIES.length} major Indian cities</strong> are available by default.
                Use this panel to add additional cities for delivery coverage.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Major cities include: Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, and more.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <span>Custom Cities: {customCities.length}</span>
          <span>Active: {customCities.filter(c => c.isActive).length}</span>
          <span>Total Available: {MAJOR_INDIAN_CITIES.length + customCities.filter(c => c.isActive).length}</span>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCities.map((city) => (
          <Card key={city.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{city.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{city.state}</p>
                  <Badge variant={city.isActive ? 'default' : 'secondary'}>
                    {city.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(city)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(city.id, city.isActive)}
                    >
                      {city.isActive ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(city.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {city.pincode && (
                  <div>Pincode: {city.pincode}</div>
                )}
                <div>Added: {new Date(city.dateAdded).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'No cities found matching your search.' : 'No custom cities added yet.'}
        </div>
      )}

      {/* Add/Edit City Form Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCity ? 'Edit City' : 'Add New City'}</DialogTitle>
            <DialogDescription>
              {editingCity ? 'Update the city information below.' : 'Add a new city where logistics services are available.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">City Name *</Label>
              <Input
                id="cityName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter city name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stateName">State *</Label>
              <Input
                id="stateName"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Enter state name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode (Optional)</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                placeholder="Enter pincode"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingCity ? 'Update' : 'Add'} City
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

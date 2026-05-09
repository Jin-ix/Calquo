import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  MapPin,
  Phone,
  Truck,
  Star,
  Search,
  AlertCircle
} from 'lucide-react';
import { LogisticsAgent, DeliveryCity, OrderLogistics, MAJOR_INDIAN_CITIES } from '../logistics/LogisticsTypes';
import { toast } from 'sonner';

interface LogisticsSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (logistics: OrderLogistics) => void;
  agents: LogisticsAgent[];
  cities: DeliveryCity[];
}

export function LogisticsSelectionDialog({
  isOpen,
  onClose,
  onConfirm,
  agents,
  cities
}: LogisticsSelectionDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  // Get all available cities (major cities + custom cities)
  const availableCities = MAJOR_INDIAN_CITIES.concat(
    cities.filter(city => city.isActive && !MAJOR_INDIAN_CITIES.includes(city.name))
      .map(city => city.name)
  ).sort();

  // Filter active agents
  const activeAgents = agents.filter(agent => agent.isActive);

  // Filter agents based on search and selected city
  const filteredAgents = activeAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(agentSearch.toLowerCase());

    if (!deliveryCity) return matchesSearch;

    // Check if agent serves the selected city
    if (agent.serviceArea.type === 'all-india') return matchesSearch;

    return matchesSearch && agent.serviceArea.cities?.includes(deliveryCity);
  });

  const selectedAgent = activeAgents.find(agent => agent.id === selectedAgentId);

  const handleCityChange = (city: string) => {
    setDeliveryCity(city);
    setSelectedAgentId(''); // Reset agent selection when city changes

    // Check if any agent serves this city
    const hasAgentsForCity = activeAgents.some(agent =>
      agent.serviceArea.type === 'all-india' ||
      agent.serviceArea.cities?.includes(city)
    );

    setShowContactAdmin(!hasAgentsForCity);
  };

  const handleConfirm = () => {
    if (!deliveryCity.trim()) {
      toast.error('Please select a delivery city');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    const logistics: OrderLogistics = {
      preferredAgentId: selectedAgentId || undefined,
      deliveryCity: deliveryCity.trim(),
      deliveryAddress: deliveryAddress.trim(),
      specialInstructions: specialInstructions.trim() || undefined
    };

    onConfirm(logistics);
    handleClose();
  };

  const handleClose = () => {
    setSelectedAgentId('');
    setDeliveryCity('');
    setDeliveryAddress('');
    setSpecialInstructions('');
    setAgentSearch('');
    setShowContactAdmin(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-none border border-zinc-200 shadow-2xl overflow-hidden bg-white max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl tracking-tight text-zinc-900 flex items-center gap-3">
              <Truck className="h-6 w-6 text-black" strokeWidth={1.5} />
              Select Logistics & Delivery Details
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
              Choose your delivery city, address, and preferred logistics agent for order fulfillment.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto overflow-x-hidden flex-1">
          {/* Delivery Configuration */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-zinc-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4 mb-6">
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                Location
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="deliveryCity" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Delivery City *</Label>
                  <Select value={deliveryCity} onValueChange={handleCityChange}>
                    <SelectTrigger className="h-12 rounded-none border-zinc-200 focus:ring-0 focus:border-black">
                      <SelectValue placeholder="Select delivery city" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zinc-200 max-h-48">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city} className="rounded-none focus:bg-zinc-50 cursor-pointer">
                          {city}
                          {MAJOR_INDIAN_CITIES.includes(city) && (
                            <Badge variant="secondary" className="ml-2 text-[8px] uppercase tracking-widest font-bold rounded-none bg-zinc-100 text-zinc-600">
                              Major City
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!availableCities.includes(deliveryCity) && deliveryCity && (
                    <div className="flex items-center space-x-2 text-[10px] tracking-widest font-bold text-orange-600 mt-2">
                      <AlertCircle className="h-4 w-4" strokeWidth={2} />
                      <span className="uppercase">City not found? Contact admin.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="deliveryAddress" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Delivery Address *</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter complete delivery address..."
                    rows={4}
                    className="rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="border border-zinc-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4 mb-6">
                Notes
              </h3>
              <div className="space-y-3">
                <Label htmlFor="specialInstructions" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Special Delivery Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special instructions for delivery (fragile items, specific timing, etc.)"
                  rows={4}
                  className="rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black resize-none"
                />
              </div>
            </div>
          </div>

          {/* Logistics Agent Selection */}
          {deliveryCity && (
            <div className="border border-zinc-200 bg-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4 mb-6">
                <div>
                  <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 mb-1">
                    <Truck className="h-4 w-4" strokeWidth={1.5} />
                    Preferred Logistics Agent (Optional)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Choose a logistics partner for delivery. If none selected, admin will assign one.
                  </p>
                </div>

                {/* Agent Search */}
                {filteredAgents.length > 3 && !showContactAdmin && (
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <Input
                      placeholder="Search agents..."
                      value={agentSearch}
                      onChange={(e) => setAgentSearch(e.target.value)}
                      className="pl-10 h-10 rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black text-sm"
                    />
                  </div>
                )}
              </div>

              {showContactAdmin ? (
                <div className="bg-orange-50 border border-orange-200 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <AlertCircle className="h-8 w-8 text-orange-600 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-serif text-lg text-orange-900">No agents available for {deliveryCity}</p>
                    <p className="text-sm font-medium text-orange-700 mt-1">Contact admin to add logistics coverage for this city.</p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-2">
                  {filteredAgents.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-zinc-500 font-medium">
                      No logistics agents found matching your search.
                    </div>
                  ) : (
                    filteredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`cursor-pointer transition-all border p-5 ${selectedAgentId === agent.id
                          ? 'border-black bg-zinc-50 ring-1 ring-black ring-offset-1'
                          : 'border-zinc-200 hover:border-zinc-400 bg-white'
                          }`}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-serif text-lg leading-tight text-zinc-900">{agent.name}</h4>
                              {agent.rating && (
                                <div className="flex items-center space-x-1.5 bg-black text-white px-2 py-0.5 mt-0.5">
                                  <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                                  <span className="text-[10px] font-bold">
                                    {agent.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500">
                                <Phone className="h-3 w-3" strokeWidth={2} />
                                <span>{agent.mobileNumber}</span>
                              </div>

                              <div className="flex items-center space-x-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500">
                                <MapPin className="h-3 w-3" strokeWidth={2} />
                                <span>
                                  {agent.serviceArea.type === 'all-india'
                                    ? 'All India Region'
                                    : `${agent.serviceArea.cities?.length} Cities Indexed`
                                  }
                                </span>
                              </div>
                            </div>

                            {agent.specialServices && agent.specialServices.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-100">
                                {agent.specialServices.slice(0, 3).map((service) => (
                                  <span key={service} className="text-[9px] uppercase tracking-widest font-bold text-zinc-600 bg-zinc-100 px-2 py-1">
                                    {service}
                                  </span>
                                ))}
                                {agent.specialServices.length > 3 && (
                                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-600 bg-zinc-100 px-2 py-1">
                                    +{agent.specialServices.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex items-center justify-center shrink-0">
                            <div className={`w-5 h-5 border flex items-center justify-center rounded-full transition-colors ${selectedAgentId === agent.id ? 'border-none bg-black text-white' : 'border-zinc-300'
                              }`}>
                              {selectedAgentId === agent.id && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Agent Summary */}
          {selectedAgent && (
            <div className="p-4 border-l-2 border-black bg-zinc-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-900 mb-1 flex items-center gap-2">
                  <Truck className="h-3 w-3" />
                  Partner Selected: {selectedAgent.name}
                </p>
                <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  <span className="mr-3">{selectedAgent.mobileNumber}</span>
                  <span>{
                    selectedAgent.serviceArea.type === 'all-india'
                      ? 'Serves All India'
                      : `Serves ${selectedAgent.serviceArea.cities?.length} cities`
                  }</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-4 shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-12 px-8 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-12 px-8 rounded-none bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.2em] text-[10px] font-bold border border-black min-w-[200px]"
          >
            Confirm Options
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

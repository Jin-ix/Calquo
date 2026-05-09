import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Truck, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck // Added import
} from 'lucide-react';
import { LogisticsAgent, DeliveryCity } from './LogisticsTypes';
import { CompanyUser } from '../admin/UserManagement'; // Import CompanyUser type
import { AddLogisticsAgentForm } from './AddLogisticsAgentForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';

interface LogisticsAgentManagerProps {
  agents: LogisticsAgent[];
  cities: DeliveryCity[];
  users?: CompanyUser[]; // Optional prop for direct user list
  onAddAgent: (agent: Omit<LogisticsAgent, 'id' | 'dateAdded' | 'isActive'>) => void;
  onUpdateAgent: (agentId: string, updates: Partial<LogisticsAgent>) => void;
  onDeleteAgent: (agentId: string) => void;
}

export function LogisticsAgentManager({ 
  agents, 
  cities, 
  users = [], // Default to empty array
  onAddAgent, 
  onUpdateAgent, 
  onDeleteAgent 
}: LogisticsAgentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<LogisticsAgent | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);

  // Filter users for logistics roles
  const logisticsUsers = users.filter(u => {
    const role = (u.business_role || '').toLowerCase().trim();
    return role.includes('logistics') || role.includes('transport');
  });

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.mobileNumber.includes(searchTerm)
  );

  const handleAddAgent = (agentData: Omit<LogisticsAgent, 'id' | 'dateAdded' | 'isActive'>) => {
    onAddAgent(agentData);
    setShowAddForm(false);
    toast.success('Logistics agent added successfully!');
  };

  const handleToggleStatus = (agentId: string, currentStatus: boolean) => {
    onUpdateAgent(agentId, { isActive: !currentStatus });
    toast.success(`Agent ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
  };

  const handleDeleteAgent = (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this logistics agent?')) {
      onDeleteAgent(agentId);
      toast.success('Logistics agent deleted successfully!');
    }
  };

  const getServiceAreaText = (agent: LogisticsAgent) => {
    if (agent.serviceArea.type === 'all-india') {
      return 'All India';
    } else {
      return `${agent.serviceArea.cities?.length || 0} Cities`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Logistics Agent Management</h2>
          <p className="text-muted-foreground">
            Manage logistics partners and their service areas
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <span>Total: {agents.length}</span>
          <span>Active: {agents.filter(a => a.isActive).length}</span>
          <span>Inactive: {agents.filter(a => !a.isActive).length}</span>
        </div>
      </div>



      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'No agents found matching your search.' : 'No logistics agents added yet.'}
        </div>
      )}

      {/* Registered Logistics Users List */}
      <Card className="mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Registered Logistics Partners ({logisticsUsers.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These agents are synced directly from the User Database.
          </p>
        </CardHeader>
        <CardContent className="p-0 max-h-80 overflow-y-auto">
          {logisticsUsers.length > 0 ? (
            <div className="divide-y">
              {logisticsUsers.map(user => (
                <div key={user.id} className="p-4 hover:bg-muted/50 text-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium text-base flex items-center gap-1">
                       {user.company_name || user.owner_name}
                       {user.is_verified && <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-100" />}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                       <Badge variant="outline" className="h-5">{user.business_role}</Badge>
                       <span>•</span>
                       <span>GST: {user.gst_number || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{user.city}, {user.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <Phone className="h-3 w-3" />
                       <span>{user.mobile}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No users registered with 'Logistics' or 'Transport' role found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Agent Form Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Logistics Agent</DialogTitle>
            <DialogDescription>
              Register a new logistics agent to handle deliveries in specific cities.
            </DialogDescription>
          </DialogHeader>
          <AddLogisticsAgentForm
            cities={cities}
            onSubmit={handleAddAgent}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Agent Details Dialog */}
      {selectedAgent && (
        <Dialog open={showAgentDetails} onOpenChange={setShowAgentDetails}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agent Details</DialogTitle>
              <DialogDescription>
                View complete information about this logistics agent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">{selectedAgent.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">GST Number</label>
                <p className="text-sm text-muted-foreground">{selectedAgent.gstNumber}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Mobile Number</label>
                <p className="text-sm text-muted-foreground">{selectedAgent.mobileNumber}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Service Area</label>
                <p className="text-sm text-muted-foreground">
                  {selectedAgent.serviceArea.type === 'all-india' 
                    ? 'All India' 
                    : selectedAgent.serviceArea.cities?.join(', ') || 'No cities selected'
                  }
                </p>
              </div>
              
              {selectedAgent.specialServices && selectedAgent.specialServices.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Special Services</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedAgent.specialServices.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Date Added</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedAgent.dateAdded).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

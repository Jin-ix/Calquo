import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Building2, 
  Package, 
  CreditCard, 
  Shield,
  ShieldCheck, // Added ShieldCheck import
  Truck,
  Edit,
  Trash2,
  UserPlus,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Wrench,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageProvider';
import { useAuth, UserRole } from '../auth/AuthProvider';
import { registrationAPI } from '../../utils/api-supabase';
import { toast } from 'sonner';
import { useRegistrationEvents, registrationEvents } from '../../utils/registrationEvents';
import { OfflineModeWarning } from './OfflineModeWarning';

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyUser {
  id: string;
  owner_name: string;
  email: string;
  mobile: string;
  company_name: string;
  gst_number: string;
  business_role: UserRole;
  address: string;
  pin: string;
  city: string;
  state: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  last_login?: string;
  is_verified?: boolean;
  joining_fee_paid?: boolean;
}

interface UserFormData {
  owner_name: string;
  email: string;
  mobile: string;
  company_name: string;
  gst_number: string;
  business_role: UserRole;
  address: string;
  pin: string;
  city: string;
  state: string;
  status: CompanyUser['status'];
}

interface UserManagementProps {
  onUserUpdate?: (users: CompanyUser[]) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const initialFormData: UserFormData = {
  owner_name: '',
  email: '',
  mobile: '',
  company_name: '',
  gst_number: '',
  business_role: 'retailer',
  address: '',
  pin: '',
  city: '',
  state: '',
  status: 'pending'
};

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
  'Puducherry', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UserManagement({ onUserUpdate }: UserManagementProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  
  // State
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  
  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<{message?: string; code?: string; details?: string} | null>(null);

  // ============================================================================
  // DATA FETCHING - Load users from database on mount
  // ============================================================================

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * SYNC POINT 1: Fetch all users from database
   * Called on mount and after mutations to sync local state with DB
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('ðŸ“¥ Fetching users from database...');
      
      // Load companies data from the database via API
      const response = await registrationAPI.getCompanies();
      
      if (response.success && response.companies) {
        const formattedUsers: CompanyUser[] = response.companies.map((company: any, index: number) => {
          const userId = company.id || company.gst_number || `temp_${index}`;
          return {
            id: userId,
            owner_name: company.owner_name || 'N/A',
            email: company.email || 'N/A',
            mobile: company.mobile_number || company.mobile || 'N/A',
            company_name: company.company_name || 'N/A',
            gst_number: company.gst_number || 'N/A',
            business_role: (company.role || company.business_role) as UserRole || 'retailer',
            address: company.street_address || company.address || 'N/A',
            pin: company.postal_code || company.pin || 'N/A',
            city: company.city || 'N/A',
            state: company.state || 'N/A',
            status: company.is_verified ? 'active' : 'pending',
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
            last_login: company.last_login,
            is_verified: company.is_verified,
            joining_fee_paid: company.joining_fee_paid
          };
        });
        
        // Ensure all IDs are unique
        const uniqueUsers = formattedUsers.filter((user, index, arr) => 
          arr.findIndex(u => u.id === user.id) === index
        );
        
        console.log(`âœ… Loaded ${uniqueUsers.length} users from database`);
        setUsers(uniqueUsers);
        onUserUpdate?.(uniqueUsers);
      } else {
        console.warn('âš ï¸ API returned success but no companies array');
        console.warn('Response:', response);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('âŒ Failed to load users:', error);
      
      // Detect specific error types
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        toast.error('Backend not deployed or unreachable', {
          description: 'Run: firebase deploy --only functions',
          duration: 10000
        });
      } else if (error.message?.includes('timeout')) {
        toast.error('Request timed out', {
          description: 'Backend may be slow or not responding. Try refreshing.'
        });
      } else {
        toast.error('Failed to load users from database', {
          description: error.message || 'Check console for details'
        });
      }
      
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // AUTO-REFRESH - Periodically check for updates
  // ============================================================================

  useEffect(() => {
    // Set up periodic refresh every 30 seconds to catch external changes
    // This is a simple alternative to realtime subscriptions
    const intervalId = setInterval(() => {
      console.log('ðŸ”„ Auto-refresh: Checking for updates...');
      loadUsers();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // ============================================================================
  // REGISTRATION EVENTS - Listen for external registration events
  // ============================================================================

  useRegistrationEvents((event) => {
    console.log('ðŸ“¨ Received registration event:', event);
    
    if (event.type === 'user_registered') {
      toast.success('New User Registered', {
        description: `${event.companyName} has been registered successfully`
      });
      /**
       * SYNC POINT 3: Refetch after external registration
       */
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } else if (event.type === 'user_updated') {
      /**
       * SYNC POINT 4: Refetch after external update
       */
      setTimeout(() => {
        loadUsers();
      }, 500);
    }
  }, []);

  // ============================================================================
  // FILTERING - Client-side filtering of loaded users
  // ============================================================================

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus, filterState]);

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.owner_name.toLowerCase().includes(term) ||
        user.company_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.mobile.includes(term) ||
        user.gst_number.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.business_role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // State filter
    if (filterState !== 'all') {
      filtered = filtered.filter(user => user.state === filterState);
    }

    setFilteredUsers(filtered);
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.owner_name.trim()) {
      errors.owner_name = 'Owner name is required';
    }

    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      errors.mobile = 'Invalid Indian mobile number';
    }

    if (!formData.company_name.trim()) {
      errors.company_name = 'Company name is required';
    }

    if (!formData.gst_number.trim()) {
      errors.gst_number = 'GST number is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number)) {
      errors.gst_number = 'Invalid GST format';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state) {
      errors.state = 'State is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditUser = (user: CompanyUser) => {
    setEditingUser(user);
    setFormData({
      owner_name: user.owner_name,
      email: user.email,
      mobile: user.mobile,
      company_name: user.company_name,
      gst_number: user.gst_number,
      business_role: user.business_role,
      address: user.address,
      pin: user.pin,
      city: user.city,
      state: user.state,
      status: user.status
    });
    setShowAddDialog(true);
  };

  /**
   * SYNC POINT 5: Save user (create or update) to database
   * After successful API call, refetch users to sync local state
   */
  const handleSaveUser = async () => {
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    try {
      setFormLoading(true);

      if (editingUser) {
        // UPDATE existing user
        console.log('ðŸ“ Updating user:', editingUser.id);
        
        try {
          const response = await registrationAPI.updateCompany(editingUser.id, {
            owner_name: formData.owner_name,
            email: formData.email,
            mobile: formData.mobile,
            company_name: formData.company_name,
            business_role: formData.business_role,
            address: formData.address,
            pin: formData.pin,
            city: formData.city,
            state: formData.state
          });

          if (response.success) {
            console.log('âœ… User updated successfully in database');
            toast.success('User updated successfully');
            
            /**
             * SYNC POINT 5A: Refetch after update
             */
            await loadUsers();
            
            registrationEvents.userUpdated(editingUser.id, formData.company_name);
          } else {
            throw new Error(response.error || 'Update failed');
          }
        } catch (apiError) {
          console.error('âŒ Update API failed:', apiError);
          toast.error('Failed to update user in database', {
            description: apiError instanceof Error ? apiError.message : 'Unknown error'
          });
          return;
        }
      } else {
        // CREATE new user
        console.log('âž• Creating new user:', formData.company_name);
        console.log('ðŸ“‹ Form data:', {
          owner_name: formData.owner_name,
          mobile: formData.mobile,
          company_name: formData.company_name,
          gst_number: formData.gst_number,
          business_role: formData.business_role,
          city: formData.city,
          state: formData.state
        });
        
        try {
          // First check if GST already exists
          console.log('ðŸ” Checking if GST exists:', formData.gst_number);
          const existingCompanies = users.filter(u => u.gst_number === formData.gst_number);
          if (existingCompanies.length > 0) {
            console.warn('âš ï¸ GST already registered:', formData.gst_number);
            toast.error('GST number already registered', {
              description: `Company "${existingCompanies[0].company_name}" already uses this GST number`
            });
            return;
          }
          
          console.log('ðŸŒ Calling API to create user...');
          
          let response;
          try {
            response = await registrationAPI.registerCompany({
              owner_name: formData.owner_name,
              email: formData.email,
              mobile: formData.mobile,
              company_name: formData.company_name,
              gst_number: formData.gst_number,
              business_role: formData.business_role,
              address: formData.address,
              pin: formData.pin,
              city: formData.city,
              state: formData.state,
              status: formData.status
            });
          } catch (fetchError) {
            console.error('âŒ API call threw exception:', fetchError);
            console.error('âŒ Exception type:', fetchError?.constructor?.name);
            console.error('âŒ Exception message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
            
            setLastError({
              message: 'API call failed',
              details: fetchError instanceof Error ? fetchError.message : String(fetchError)
            });
            
            toast.error('API call failed', {
              description: fetchError instanceof Error ? fetchError.message : 'Check console for details'
            });
            return;
          }

          console.log('ðŸ“¡ API response:', response);
          console.log('ðŸ“¡ Response type:', typeof response);
          console.log('ðŸ“¡ Response keys:', response ? Object.keys(response) : 'null');
          console.log('ðŸ“¡ response.success:', response?.success);
          console.log('ðŸ“¡ response.company:', response?.company);
          console.log('ðŸ“¡ response.error:', response?.error);
          console.log('ðŸ“¡ response.details:', response?.details);
          console.log('ðŸ“¡ response.errorCode:', response?.errorCode);

          // Check for offline mode
          if (response?.message === 'Offline mode active') {
            console.error('âŒ OFFLINE MODE DETECTED!');
            console.error('The offline mode initializer is intercepting API calls.');
            console.error('Backend is not being reached. Offline mode should be disabled.');
            
            setLastError({
              message: 'Backend not deployed - Offline mode active',
              details: 'The app is running in offline mode with local data storage.'
            });
            
            toast.error('Backend not deployed', {
              description: 'Running in offline mode. Data is stored locally.',
              duration: 10000
            });
            return;
          }

          if (response && response.success && response.company) {
            console.log('âœ… User created successfully in database');
            console.log('âœ… Company ID:', response.company.id);
            console.log('âœ… User ID:', response.user?.id);
            
            // Clear any previous errors
            setLastError(null);
            
            toast.success('User created successfully', {
              description: `${formData.company_name} has been registered with GST ${formData.gst_number}`
            });
            
            /**
             * SYNC POINT 5B: Refetch after create
             */
            console.log('ðŸ”„ Reloading users from database...');
            await loadUsers();
            
            registrationEvents.userRegistered(
              response.company.id,
              response.company.gst_number,
              response.company.company_name
            );
          } else {
            // Handle specific API errors
            console.error('âŒ API returned non-success response');
            console.error('âŒ Full response object:', JSON.stringify(response, null, 2));
            console.error('âŒ response.error:', response?.error);
            console.error('âŒ response.message:', response?.message);
            console.error('âŒ response.details:', response?.details);
            console.error('âŒ response.errorCode:', response?.errorCode);
            
            // If response is completely empty or malformed
            if (!response || typeof response !== 'object') {
              setLastError({
                message: 'Invalid API response',
                details: `Expected object, got ${typeof response}: ${JSON.stringify(response)}`
              });
              toast.error('Invalid API response', {
                description: 'Backend returned invalid data. Check console and backend logs.'
              });
              return;
            }
            
            // Extract error message from various possible fields
            const errorMessage = response.error || response.message || 'Failed to create user';
            const errorDetails = response.details || response.hint || '';
            const errorCode = response.errorCode || response.code || '';
            
            console.error('âŒ Extracted error:', { errorMessage, errorDetails, errorCode });
            
            if (errorMessage?.includes('already exists')) {
              setLastError({
                message: 'User already exists',
                code: errorCode || '409',
                details: errorDetails || 'A company with this GST number or user with this email/phone already exists'
              });
              toast.error('User already exists', {
                description: errorDetails || 'A company with this GST number or user with this email/phone already exists'
              });
              return;
            } else if (errorMessage?.includes('duplicate')) {
              setLastError({
                message: 'Duplicate entry',
                code: errorCode,
                details: errorDetails
              });
              toast.error('Duplicate entry', {
                description: errorDetails || 'This GST number, email, or phone number is already registered'
              });
              return;
            } else if (response.missingFields) {
              setLastError({
                message: `Missing required fields: ${response.missingFields.join(', ')}`,
                details: JSON.stringify(response.missingFields)
              });
              toast.error(`Missing required fields: ${response.missingFields.join(', ')}`);
              return;
            } else if (errorCode === '23505') {
              setLastError({
                message: 'Duplicate record',
                code: '23505',
                details: errorDetails
              });
              toast.error('Duplicate record', {
                description: errorDetails || 'A record with these details already exists in the database'
              });
              return;
            } else if (errorCode === '42501') {
              setLastError({
                message: 'Permission denied - RLS policy blocking insert',
                code: '42501',
                details: errorDetails
              });
              toast.error('Permission denied', {
                description: 'Database RLS policy is blocking this operation. Contact admin.'
              });
              return;
            } else {
              setLastError({
                message: errorMessage,
                code: errorCode,
                details: errorDetails
              });
              
              // Include full response in error for debugging
              const fullError = `${errorMessage}\n\nDetails: ${errorDetails}\nCode: ${errorCode}\n\nFull response: ${JSON.stringify(response, null, 2)}`;
              
              toast.error(errorMessage, {
                description: errorDetails || 'Check console for full details'
              });
              
              throw new Error(fullError);
            }
          }
        } catch (apiError) {
          console.error('âŒ Create API failed:', apiError);
          console.error('âŒ Error details:', {
            message: apiError instanceof Error ? apiError.message : String(apiError),
            stack: apiError instanceof Error ? apiError.stack : undefined
          });
          
          // Check for validation errors that should prevent closing dialog
          if (apiError instanceof Error && (
            apiError.message?.includes('already exists') || 
            apiError.message?.includes('Missing required fields') ||
            apiError.message?.includes('Invalid GST number') ||
            apiError.message?.includes('duplicate') ||
            apiError.message?.includes('Duplicate')
          )) {
            toast.error(apiError.message);
            return;
          }
          
          // Check for network errors
          if (apiError instanceof Error && (
            apiError.message?.includes('fetch') ||
            apiError.message?.includes('Network') ||
            apiError.message?.includes('timed out')
          )) {
            setLastError({
              message: 'Network error - Cannot reach backend',
              details: apiError.message
            });
            toast.error('Network error', {
              description: 'Cannot reach backend server. Please check your internet connection.'
            });
            return;
          }
          
          setLastError({
            message: apiError instanceof Error ? apiError.message : 'Unknown error',
            details: apiError instanceof Error ? apiError.stack : String(apiError)
          });
          
          toast.error('Failed to create user', {
            description: apiError instanceof Error ? apiError.message : 'Unknown error occurred. Check console for details.'
          });
          return;
        }
      }
      
      // Close dialog and reset form on success
      setShowAddDialog(false);
      setFormData(initialFormData);
      setEditingUser(null);
      setFormErrors({});
    } catch (error) {
      console.error('âŒ Unexpected error saving user:', error);
      toast.error('Failed to save user', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * SYNC POINT 6: Delete user from database
   * After successful API call, refetch users to sync local state
   */
  const handleDeleteUser = async (userId: string) => {
    try {
      const deletedUser = users.find(user => user.id === userId);
      
      if (!deletedUser) {
        console.error('âŒ User not found in local state');
        toast.error('User not found. Please refresh and try again.');
        return;
      }
      
      console.log('ðŸ—‘ï¸ Deleting user from database:', {
        id: userId,
        name: deletedUser.owner_name,
        company: deletedUser.company_name
      });
      
      // Delete from database
      const response = await registrationAPI.deleteCompany(userId);
      
      if (response.success) {
        console.log('âœ… User deleted successfully from database');
        toast.success('User deleted successfully', {
          description: `${deletedUser.company_name} has been permanently removed`
        });
        
        /**
         * SYNC POINT 6A: Refetch after delete
         * This ensures local state matches database state
         */
        await loadUsers();
      } else {
        console.error('âŒ Database deletion failed:', response.error);
        toast.error('Failed to delete from database', {
          description: response.error || 'Backend returned error. Check if backend is deployed.'
        });
      }
    } catch (apiError: any) {
      console.error('âŒ Delete API failed:', apiError);
      
      // Check if it's a network error (backend not deployed)
      if (apiError.message?.includes('fetch') || apiError.message?.includes('Network')) {
        toast.error('Backend not reachable', {
          description: 'Please check your internet connection and try again.',
          duration: 5000
        });
      } else {
        toast.error('Failed to delete from database', {
          description: apiError.message || 'Unknown error occurred'
        });
      }
    }
  };

  const handleVerifyUser = async (user: CompanyUser) => {
    try {
      const newStatus = !user.is_verified;
      console.log(`ðŸ›¡ï¸ ${newStatus ? 'Verifying' : 'Unverifying'} user:`, user.id);
      
      const response = await registrationAPI.updateCompany(user.id, {
        is_verified: newStatus,
        // If we are verifying, automatically set status to 'active' if it was 'pending'
        ...(newStatus && user.status === 'pending' ? { status: 'active' } : {})
      });

      if (response.success) {
        toast.success(`User ${newStatus ? 'verified' : 'unverified'} successfully`, {
          description: newStatus ? `${user.company_name} is now a verified business` : 'Verification tag removed'
        });
        await loadUsers();
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (error) {
      console.error('âŒ Verification failed:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      console.log(`ðŸ›¡ï¸ ${newStatus === 'suspended' ? 'Suspending' : 'Activating'} user:`, userId);
      
      const response = await registrationAPI.updateCompany(userId, {
        status: newStatus
      });

      if (response.success) {
        toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
        await loadUsers();
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (error) {
      console.error('âŒ Status update failed:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Owner Name', 'Email', 'Mobile', 'Company', 'GST', 'Role', 'City', 'State', 'Status'].join(','),
      ...filteredUsers.map(user => 
        [
          user.owner_name,
          user.email,
          user.mobile,
          user.company_name,
          user.gst_number,
          user.business_role,
          user.city,
          user.state,
          user.status
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calico-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Users exported successfully');
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getRoleIcon = (role: UserRole) => {
    const icons = {
      manufacturer: Building2,
      trader: Package,
      retailer: Building2,
      financial: CreditCard,
      admin: Shield,
      'logistics-agent': Truck
    };
    const Icon = icons[role] || Building2;
    return <Icon className="h-4 w-4" />;
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      manufacturer: 'bg-blue-100 text-blue-800',
      trader: 'bg-purple-100 text-purple-800',
      retailer: 'bg-green-100 text-green-800',
      financial: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
      'logistics-agent': 'bg-teal-100 text-teal-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: CompanyUser['status'], isVerified?: boolean) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800', icon: Ban },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge className={`${config.color} flex items-center gap-1`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        {isVerified && (
          <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 fill-blue-100" />
            Verified
          </Badge>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Offline Mode / Backend Warning */}
      <OfflineModeWarning />
      
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage companies and users in the CALICO platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, email, mobile, or GST..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportUsers}
                disabled={filteredUsers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingUser(null);
                    setFormData(initialFormData);
                    setFormErrors({});
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser 
                        ? 'Update user and company information'
                        : 'Register a new company and user account in the system'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Owner Details */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Owner Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="owner_name">Owner Name *</Label>
                          <Input
                            id="owner_name"
                            value={formData.owner_name}
                            onChange={(e) => handleInputChange('owner_name', e.target.value)}
                            placeholder="John Doe"
                            disabled={formLoading}
                          />
                          {formErrors.owner_name && (
                            <p className="text-sm text-red-500">{formErrors.owner_name}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mobile">Mobile Number *</Label>
                          <Input
                            id="mobile"
                            value={formData.mobile}
                            onChange={(e) => handleInputChange('mobile', e.target.value)}
                            placeholder="9876543210"
                            disabled={formLoading}
                          />
                          {formErrors.mobile && (
                            <p className="text-sm text-red-500">{formErrors.mobile}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="john@example.com"
                          disabled={formLoading}
                        />
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Company Details</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          placeholder="ABC Textiles Pvt Ltd"
                          disabled={formLoading}
                        />
                        {formErrors.company_name && (
                          <p className="text-sm text-red-500">{formErrors.company_name}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gst_number">GST Number *</Label>
                          <Input
                            id="gst_number"
                            value={formData.gst_number}
                            onChange={(e) => handleInputChange('gst_number', e.target.value.toUpperCase())}
                            placeholder="27AABCU9603R1ZX"
                            disabled={formLoading || !!editingUser}
                          />
                          {formErrors.gst_number && (
                            <p className="text-sm text-red-500">{formErrors.gst_number}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_role">Business Role *</Label>
                          <Select
                            value={formData.business_role}
                            onValueChange={(value) => handleInputChange('business_role', value)}
                            disabled={formLoading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manufacturer">Manufacturer</SelectItem>
                              <SelectItem value="trader">Trader</SelectItem>
                              <SelectItem value="retailer">Retailer</SelectItem>
                              <SelectItem value="financial">Financial Agent</SelectItem>
                              <SelectItem value="logistics-agent">Logistics Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Address Details</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123, Main Street, Sector 15"
                          disabled={formLoading}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Mumbai"
                            disabled={formLoading}
                          />
                          {formErrors.city && (
                            <p className="text-sm text-red-500">{formErrors.city}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Select
                            value={formData.state}
                            onValueChange={(value) => handleInputChange('state', value)}
                            disabled={formLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {indianStates.map(state => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.state && (
                            <p className="text-sm text-red-500">{formErrors.state}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pin">PIN Code</Label>
                          <Input
                            id="pin"
                            value={formData.pin}
                            onChange={(e) => handleInputChange('pin', e.target.value)}
                            placeholder="400001"
                            disabled={formLoading}
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Account Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value as CompanyUser['status'])}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setFormData(initialFormData);
                        setEditingUser(null);
                        setFormErrors({});
                      }}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveUser}
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingUser ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingUser ? 'Update User' : 'Create User'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="logistics-agent">Logistics</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {indianStates.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || filterRole !== 'all' || filterStatus !== 'all' || filterState !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterStatus('all');
                  setFilterState('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.status === 'suspended').length}
            </div>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading users from database...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {users.length === 0 
                  ? 'No users found. Click "Add User" to register a new company.'
                  : 'No users match your filters. Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {user.company_name}
                            {user.is_verified && (
                              <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-100" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.gst_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{user.owner_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email !== 'N/A' && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          )}
                          {user.mobile !== 'N/A' && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {user.mobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {user.city}, {user.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(user.business_role)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(user.business_role)}
                          {user.business_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status, user.is_verified)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerifyUser(user)}
                            title={user.is_verified ? "Revoke Verification" : "Verify User"}
                            className={user.is_verified ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"}
                          >
                            <ShieldCheck className={`h-4 w-4 ${user.is_verified ? 'fill-blue-200' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspendUser(user.id, user.status)}
                            title={user.status === 'suspended' ? "Activate User" : "Suspend User"}
                            className={user.status === 'suspended' ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          
                          {isSuperAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{user.company_name}</strong>? 
                                    This action will permanently remove the company, user account, and all associated data from the database.
                                    This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Tools - Components temporarily removed */}
    </div>
  );
}


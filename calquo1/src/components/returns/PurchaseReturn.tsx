import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Upload, 
  Camera, 
  Link, 
  Package, 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  ImageIcon,
  FileImage,
  Trash2
} from 'lucide-react';
// Simple date formatting utility
const formatDate = (date: Date, formatType: 'PPP' | 'short' = 'short') => {
  if (formatType === 'PPP') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};
import { cn } from '../ui/utils';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';

interface ReturnRequest {
  id: string;
  itemName: string;
  purchasedDate: Date;
  returnReason: string;
  additionalDetails?: string;
  uploadedImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: Date;
  buyerCompany: string;
  supplierName: string;
}

const returnReasons = [
  'Wrong Item',
  'Damaged Product', 
  'Quality Issue',
  'Size Mismatch',
  'Color Variation',
  'Fabric Defect',
  'Late Delivery',
  'Not as Described',
  'Others'
];

// Mock data for previous returns
const mockReturns: ReturnRequest[] = [
  {
    id: 'RET-001',
    itemName: 'Premium Cotton T-Shirt',
    purchasedDate: new Date('2024-01-15'),
    returnReason: 'Quality Issue',
    additionalDetails: 'Fabric quality is not as expected, feels rough.',
    uploadedImage: 'https://images.unsplash.com/photo-1629196914380-bc80bf1b0009?w=400&h=300',
    status: 'approved',
    submittedDate: new Date('2024-01-20'),
    buyerCompany: 'Fashion Plus Retail',
    supplierName: 'FashionCorp Manufacturing'
  },
  {
    id: 'RET-002',
    itemName: 'Classic Formal Shirt',
    purchasedDate: new Date('2024-01-25'),
    returnReason: 'Wrong Item',
    additionalDetails: 'Received blue shirt instead of white.',
    uploadedImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=300',
    status: 'pending',
    submittedDate: new Date('2024-02-01'),
    buyerCompany: 'Fashion Plus Retail',
    supplierName: 'Elite Textiles Delhi'
  },
  {
    id: 'RET-003',
    itemName: 'Slim Fit Denim Jeans',
    purchasedDate: new Date('2024-02-10'),
    returnReason: 'Size Mismatch',
    additionalDetails: 'Ordered size 32 but received size 30.',
    status: 'rejected',
    submittedDate: new Date('2024-02-15'),
    buyerCompany: 'Fashion Plus Retail',
    supplierName: 'Bangalore Denim Works'
  }
];

export function PurchaseReturn() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new-return');
  
  // Form state
  const [purchasedDate, setPurchasedDate] = useState<Date>();
  const [returnReason, setReturnReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [imageUploadMethod, setImageUploadMethod] = useState<'device' | 'camera' | 'url'>('device');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // List state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  
  // Filter returns based on search and status
  const filteredReturns = mockReturns.filter(returnItem => {
    const matchesSearch = returnItem.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.returnReason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // In a real app, this would open camera capture
    toast.info('Camera capture would open here');
  };

  const handleUrlUpload = () => {
    if (imageUrl) {
      setUploadedImage(imageUrl);
      setImageUrl('');
    }
  };

  const handleSubmitReturn = () => {
    if (!purchasedDate || !returnReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // In a real app, this would submit to backend
    toast.success('Return request submitted successfully');
    
    // Reset form
    setPurchasedDate(undefined);
    setReturnReason('');
    setAdditionalDetails('');
    setUploadedImage('');
    setImageUrl('');
  };

  const removeUploadedImage = () => {
    setUploadedImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Purchase Returns</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-return">Submit New Return</TabsTrigger>
          <TabsTrigger value="previous-returns">Previous Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="new-return" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Return Request Form</CardTitle>
              <CardDescription>
                Submit a return request for purchased items. Please provide all required information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Purchased Date */}
              <div className="space-y-2">
                <Label htmlFor="purchased-date">Purchased Date *</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !purchasedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {purchasedDate ? formatDate(purchasedDate, "PPP") : "Select purchase date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={purchasedDate}
                      onSelect={(date) => {
                        setPurchasedDate(date);
                        setIsDatePickerOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Return Reason */}
              <div className="space-y-2">
                <Label htmlFor="return-reason">Why Returning? *</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason for return" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="additional-details">Additional Details</Label>
                <Textarea
                  id="additional-details"
                  placeholder="Provide additional details about the return reason..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Upload Image (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Upload from Device */}
                  <Card className={cn("cursor-pointer transition-colors", imageUploadMethod === 'device' && "ring-2 ring-primary")}>
                    <CardContent className="p-4 text-center space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Upload from Device</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setImageUploadMethod('device');
                          fileInputRef.current?.click();
                        }}
                      >
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>

                  {/* Camera Capture */}
                  <Card className={cn("cursor-pointer transition-colors", imageUploadMethod === 'camera' && "ring-2 ring-primary")}>
                    <CardContent className="p-4 text-center space-y-2">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Take Photo</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setImageUploadMethod('camera');
                          handleCameraCapture();
                        }}
                      >
                        Open Camera
                      </Button>
                    </CardContent>
                  </Card>

                  {/* URL Upload */}
                  <Card className={cn("cursor-pointer transition-colors", imageUploadMethod === 'url' && "ring-2 ring-primary")}>
                    <CardContent className="p-4 text-center space-y-2">
                      <Link className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">From URL</p>
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter image URL"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          onClick={() => setImageUploadMethod('url')}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleUrlUpload}
                          disabled={!imageUrl}
                        >
                          Upload
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview uploaded image */}
                {uploadedImage && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Uploaded Image Preview</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeUploadedImage}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="relative max-w-xs">
                        <img
                          src={uploadedImage}
                          alt="Return item"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSubmitReturn}
                  className="px-8"
                  disabled={!purchasedDate || !returnReason}
                >
                  Submit Return Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previous-returns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Previous Returns</CardTitle>
              <CardDescription>
                View and track your submitted return requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by item name or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Returns List - Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Purchased Date</TableHead>
                      <TableHead>Return Reason</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map((returnItem) => (
                      <TableRow key={returnItem.id}>
                        <TableCell className="font-medium">{returnItem.itemName}</TableCell>
                        <TableCell>{formatDate(returnItem.purchasedDate)}</TableCell>
                        <TableCell>{returnItem.returnReason}</TableCell>
                        <TableCell>
                          {returnItem.uploadedImage ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={returnItem.uploadedImage}
                                alt="Return item"
                                className="w-10 h-10 object-cover rounded border"
                              />
                              <FileImage className="h-4 w-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                              <span className="text-sm">No image</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReturn(returnItem)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Return Request Details</DialogTitle>
                                <DialogDescription>
                                  Request ID: {returnItem.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Item Name</Label>
                                    <p className="font-medium">{returnItem.itemName}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(returnItem.status)}</div>
                                  </div>
                                  <div>
                                    <Label>Purchased Date</Label>
                                    <p>{formatDate(returnItem.purchasedDate, "PPP")}</p>
                                  </div>
                                  <div>
                                    <Label>Submitted Date</Label>
                                    <p>{formatDate(returnItem.submittedDate, "PPP")}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Return Reason</Label>
                                  <p className="font-medium">{returnItem.returnReason}</p>
                                </div>
                                {returnItem.additionalDetails && (
                                  <div>
                                    <Label>Additional Details</Label>
                                    <p className="text-sm text-muted-foreground">{returnItem.additionalDetails}</p>
                                  </div>
                                )}
                                {returnItem.uploadedImage && (
                                  <div>
                                    <Label>Uploaded Image</Label>
                                    <img
                                      src={returnItem.uploadedImage}
                                      alt="Return item"
                                      className="w-full max-w-md h-64 object-cover rounded-lg border mt-2"
                                    />
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Returns List - Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredReturns.map((returnItem) => (
                  <Card key={returnItem.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-sm">{returnItem.itemName}</h3>
                        {getStatusBadge(returnItem.status)}
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Purchased:</span>
                          <span>{formatDate(returnItem.purchasedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reason:</span>
                          <span>{returnItem.returnReason}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Image:</span>
                          {returnItem.uploadedImage ? (
                            <img
                              src={returnItem.uploadedImage}
                              alt="Return item"
                              className="w-8 h-8 object-cover rounded border"
                            />
                          ) : (
                            <span className="text-xs">No image</span>
                          )}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => setSelectedReturn(returnItem)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return Request Details</DialogTitle>
                            <DialogDescription>
                              Request ID: {returnItem.id}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>Item Name</Label>
                                <p className="font-medium">{returnItem.itemName}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div className="mt-1">{getStatusBadge(returnItem.status)}</div>
                              </div>
                              <div>
                                <Label>Purchased Date</Label>
                                <p>{formatDate(returnItem.purchasedDate, "PPP")}</p>
                              </div>
                              <div>
                                <Label>Submitted Date</Label>
                                <p>{formatDate(returnItem.submittedDate, "PPP")}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Return Reason</Label>
                              <p className="font-medium">{returnItem.returnReason}</p>
                            </div>
                            {returnItem.additionalDetails && (
                              <div>
                                <Label>Additional Details</Label>
                                <p className="text-sm text-muted-foreground">{returnItem.additionalDetails}</p>
                              </div>
                            )}
                            {returnItem.uploadedImage && (
                              <div>
                                <Label>Uploaded Image</Label>
                                <img
                                  src={returnItem.uploadedImage}
                                  alt="Return item"
                                  className="w-full h-48 object-cover rounded-lg border mt-2"
                                />
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredReturns.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No return requests found</p>
                  {searchTerm || statusFilter !== 'all' ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

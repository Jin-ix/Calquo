import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format } from 'date-fns';

// Types based on Firestore data
interface BusinessUser {
  id: string; // GSTIN
  company_name: string;
  gst_number: string;
  owner_name: string;
  mobile: string;
  role: 'manufacturer' | 'retailer' | 'trader' | 'admin';
  status: 'active' | 'blocked' | 'pending';
  createdAt?: string | any; // Timestamp or string
}

const ITEMS_PER_PAGE = 10;

export function AdminUserList() {
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BusinessUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users from Firestore
  useEffect(() => {
    if (!firebaseDb) return;

    // Query 'companies' collection (mapped to businesses in requirement)
    const q = query(collection(firebaseDb, 'companies')); // Removing orderBy for now to avoid index errors

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers: BusinessUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedUsers.push({
          id: doc.id,
          company_name: data.company_name || 'N/A',
          gst_number: data.gst_number || doc.id,
          owner_name: data.owner_name || 'N/A',
          mobile: data.mobile || data.phone || 'N/A',
          role: data.role || 'retailer',
          status: data.status || 'active',
          createdAt: data.createdAt || data.dateAdded || new Date().toISOString()
        });
      });
      
      // Sort client-side to avoid index requirements
      fetchedUsers.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setUsers(fetchedUsers);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = users;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.company_name.toLowerCase().includes(lowerTerm) ||
          user.gst_number.toLowerCase().includes(lowerTerm)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      const date = typeof dateVal === 'object' && dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'bg-[#FF8C42]/10 text-[#FF8C42] border-[#FF8C42]/20';
      case 'retailer': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Users Directory</h2>
          <p className="text-muted-foreground text-sm">
            Manage and view all registered businesses.
          </p>
        </div>
        <Button variant="outline" className="gap-2 border-[#FF8C42]/20 text-[#FF8C42] hover:bg-[#FF8C42]/5">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Company or GSTIN..."
                className="pl-9 border-gray-200 focus:border-[#FF8C42] focus:ring-[#FF8C42]/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[150px] border-gray-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Filter Role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] border-gray-200">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold">Company Name</TableHead>
                  <TableHead className="font-semibold">GSTIN</TableHead>
                  <TableHead className="font-semibold">Owner</TableHead>
                  <TableHead className="font-semibold">Mobile</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {user.company_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">
                        {user.gst_number}
                      </TableCell>
                      <TableCell className="text-gray-600">{user.owner_name}</TableCell>
                      <TableCell className="text-gray-600">{user.mobile}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize font-normal ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize font-normal ${getStatusColor(user.status)}`}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} entries
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="inline-flex items-center justify-center text-sm font-medium">
                Page {currentPage} of {Math.max(1, totalPages)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

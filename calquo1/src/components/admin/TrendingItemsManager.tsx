import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { TrendingUp, X, Edit3, Plus, Search, Filter } from 'lucide-react';
import { StockItem } from '../stock/StockCard';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getSafeString } from '../../utils/stringUtils';

interface TrendingItemsManagerProps {
  stocks: StockItem[];
  onUpdateTrending: (stockId: string, isTrending: boolean, trendingText?: string) => void;
}

export function TrendingItemsManager({ stocks, onUpdateTrending }: TrendingItemsManagerProps) {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [trendingText, setTrendingText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyTrending, setShowOnlyTrending] = useState(false);

  const trendingItems = stocks.filter(stock => stock.isTrending);
  
  // Filter stocks based on search and trending filter
  const filteredStocks = stocks.filter(stock => {
    const name = getSafeString(stock.name).toLowerCase();
    const category = getSafeString(stock.category).toLowerCase();
    const supplier = getSafeString(stock.supplier).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery || 
      name.includes(query) ||
      category.includes(query) ||
      supplier.includes(query);
    
    const matchesTrendingFilter = !showOnlyTrending || stock.isTrending;
    
    return matchesSearch && matchesTrendingFilter;
  });

  const validateTrendingText = (text: string): boolean => {
    const words = text.trim().split(/\s+/);
    return words.length <= 10 && text.length <= 50;
  };

  const handleSetTrending = () => {
    if (!selectedItem) return;
    
    if (trendingText && !validateTrendingText(trendingText)) {
      toast.error('Trending text must be 10 words or less');
      return;
    }

    onUpdateTrending(selectedItem.id, true, trendingText.trim() || undefined);
    toast.success(`"${getSafeString(selectedItem.name)}" marked as trending!`);
    setIsDialogOpen(false);
    setSelectedItem(null);
    setTrendingText('');
  };

  const handleRemoveTrending = (stockId: string, stockName: string) => {
    onUpdateTrending(stockId, false);
    toast.success(`"${getSafeString(stockName)}" removed from trending`);
  };

  const openTrendingDialog = (stock: StockItem) => {
    setSelectedItem(stock);
    setTrendingText(stock.trendingText || '');
    setIsDialogOpen(true);
  };

  const wordCount = trendingText.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{trendingItems.length}</p>
                <p className="text-xs text-muted-foreground">Trending Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Plus className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stocks.length - trendingItems.length}</p>
                <p className="text-xs text-muted-foreground">Available to Mark</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div>
                <p className="text-2xl font-bold">{stocks.length}</p>
                <p className="text-xs text-muted-foreground">Total Stock Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Trending Items */}
      {trendingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Current Trending Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden">
                      <ImageWithFallback
                        src={item.images[0]}
                        alt={getSafeString(item.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium">{getSafeString(item.name)}</h4>
                      <p className="text-sm text-muted-foreground">{getSafeString(item.category)} • {getSafeString(item.supplier)}</p>
                      {item.trendingText && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.trendingText}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTrendingDialog(item)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTrending(item.id, item.name)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Items Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Trending Items</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, category, or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showOnlyTrending ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyTrending(!showOnlyTrending)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showOnlyTrending ? 'Show All' : 'Trending Only'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trending Text</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden">
                          <ImageWithFallback
                            src={stock.images[0]}
                            alt={getSafeString(stock.name)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{getSafeString(stock.name)}</p>
                          <p className="text-sm text-muted-foreground">{getSafeString(stock.color)} • Size {getSafeString(stock.size)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getSafeString(stock.category)}</TableCell>
                    <TableCell>{getSafeString(stock.supplier)}</TableCell>
                    <TableCell>
                      {stock.isTrending ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      ) : (
                        <Badge variant="outline">Regular</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {stock.trendingText ? (
                        <span className="text-sm">{stock.trendingText}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stock.isTrending ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTrendingDialog(stock)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveTrending(stock.id, stock.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTrendingDialog(stock)}
                        >
                          Mark Trending
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredStocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || showOnlyTrending ? 'No items match your filters' : 'No stock items available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="trending-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.isTrending ? 'Edit' : 'Mark as'} Trending
            </DialogTitle>
            <p id="trending-dialog-description" className="sr-only">
              Mark this item as trending or update trending item details
            </p>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-md overflow-hidden">
                  <ImageWithFallback
                    src={selectedItem.images[0]}
                    alt={getSafeString(selectedItem.name)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{getSafeString(selectedItem.name)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getSafeString(selectedItem.category)} • {getSafeString(selectedItem.supplier)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trending-text">
                  Trending Text (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    Max 10 words
                  </span>
                </Label>
                <Input
                  id="trending-text"
                  placeholder="e.g., Festival Season Hit, Summer Essential..."
                  value={trendingText}
                  onChange={(e) => setTrendingText(e.target.value)}
                  maxLength={50}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {wordCount}/10 words
                  </span>
                  <span>
                    {trendingText.length}/50 characters
                  </span>
                </div>
                {wordCount > 10 && (
                  <p className="text-xs text-red-600">
                    Text must be 10 words or less
                  </p>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSetTrending}
                  disabled={wordCount > 10}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {selectedItem.isTrending ? 'Update' : 'Mark as'} Trending
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

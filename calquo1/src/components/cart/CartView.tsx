import React, { useState } from 'react';
import { useCart } from './CartProvider';
import { CartItemComponent } from './CartItem';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { ShoppingCart, Package, Trash2, ShoppingBag, CheckCircle, ShieldCheck, Star, MapPin, Search, Shield, Zap, UserCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { BuyNowFlow } from '../orders/BuyNowFlow';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
};

// Mock Agents for the Directory
const MOCK_QC_AGENTS = [
  { id: 'qc_1', name: 'Aura Textiles QA', location: 'Mumbai, India', fee: '1.5%', rating: 4.9, reviews: 124, certified: true },
  { id: 'qc_2', name: 'Delhi Fabric Inspectors', location: 'New Delhi, India', fee: '1.2%', rating: 4.7, reviews: 89, certified: true },
  { id: 'qc_3', name: 'Global Standard QC', location: 'Surat, India', fee: '2.0%', rating: 5.0, reviews: 312, certified: true },
  { id: 'qc_4', name: 'Tirupur Quality Checkers', location: 'Tirupur, India', fee: '1.8%', rating: 4.6, reviews: 56, certified: false },
];

interface CartViewProps {
  onContinueShopping: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onContinueShopping }) => {
  const { cartItems, cartSummary, updateQuantity, removeFromCart, clearCart } = useCart();
  useAuth();
  const [showBuyNowFlow, setShowBuyNowFlow] = useState(false);
  const [useSecureTrade, setUseSecureTrade] = useState(false); // Default off
  const [destinationCity, setDestinationCity] = useState('');

  // Consensus Protocol State
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [proposedAgentId, setProposedAgentId] = useState<string | null>(null);
  const [proposedAgentName, setProposedAgentName] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()} `;
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (useSecureTrade && !destinationCity) {
      toast.error('Please enter a destination city to auto-assign a Middleman.');
      return;
    }

    // Open the Buy Now flow (now functioning as Proposal Creation)
    setShowBuyNowFlow(true);
  };

  const handleBuyNowSuccess = () => {
    // Clear cart after successful payment
    clearCart();
    setShowBuyNowFlow(false);
    toast.success('Order placed successfully!');
  };

  const selectedAgent = MOCK_QC_AGENTS.find(a => a.id === proposedAgentId);
  const middlemanFeePercentage = selectedAgent ? parseFloat(selectedAgent.fee) / 100 : (useSecureTrade ? 0.015 : 0);
  const middlemanFee = middlemanFeePercentage * cartSummary.totalAmount;
  const grandTotal = cartSummary.totalAmount + middlemanFee;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart to get started
          </p>
          <Button onClick={onContinueShopping} className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-zinc-900" strokeWidth={1.5} />
          <h1 className="text-4xl font-serif tracking-tight text-zinc-900">Shopping Cart</h1>
          <Badge variant="secondary" className="ml-2 font-mono text-[10px] tracking-widest uppercase bg-zinc-100 text-zinc-600 rounded-none border border-zinc-200">
            {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {cartItems.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-black uppercase text-[10px] tracking-[0.2em] font-bold">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Clear Cart
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-none border-zinc-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-2xl">Clear Cart</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-500 font-light">
                  Are you sure you want to remove all items from your cart? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none border-zinc-200 uppercase text-[10px] tracking-[0.2em] font-bold">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearCart} className="bg-black hover:bg-zinc-800 text-white rounded-none uppercase text-[10px] tracking-[0.2em] font-bold">
                  Clear Cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <CartItemComponent
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="sticky top-6 rounded-none border border-zinc-200 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-serif text-xl tracking-tight">
                <Package className="h-5 w-5 text-zinc-900" strokeWidth={1.5} />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-[0.1em] font-medium">
                  <span>Items ({cartSummary.totalItems})</span>
                  <span className="text-zinc-900">{formatCurrency(cartSummary.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-[0.1em] font-medium">
                  <span>Total Quantity</span>
                  <span className="text-zinc-900">{cartSummary.totalQuantity} pieces</span>
                </div>
              </div>

              <Separator className="bg-zinc-200" />

              {useSecureTrade && (
                <div className="flex justify-between text-[11px] text-zinc-500 uppercase tracking-[0.1em] font-bold">
                  <span>Middleman Fee (Est.)</span>
                  <span className="text-zinc-900">{formatCurrency(middlemanFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-end">
                <span className="font-serif text-2xl text-zinc-900">Total</span>
                <span className="font-serif text-2xl text-zinc-900">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Order Protections (Negotiation UI) */}
              <div className="mt-8 border border-zinc-200 bg-zinc-50/30 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="h-5 w-5 text-black" strokeWidth={1.5} />
                  <h3 className="text-xs font-bold tracking-[0.2em] text-black uppercase">Middleman & Escrow</h3>
                </div>

                <div className="flex flex-col gap-6 border-t border-zinc-200 pt-6 mt-2">
                  <div className="flex-1">
                    <span className="text-base font-serif text-black block mb-2">Request Independent Middleman</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block leading-relaxed max-w-sm">
                      A verified third-party logs fabric, count, and quality before funds are released.
                    </span>
                  </div>

                  <div
                    className="flex flex-col gap-4 p-5 border border-zinc-200 bg-white shadow-sm transition-all w-full mt-2"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-900 mb-1.5">
                        Independent Middleman
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                        Activate to utilize a Calico verified Quality Control agent.
                      </span>
                    </div>

                    <div className="mt-3 bg-zinc-100 p-1 flex gap-1 border border-zinc-200 shadow-inner relative overflow-hidden">
                      <div
                        className="absolute inset-y-1 transition-all duration-300 bg-white shadow-md ring-1 ring-black/5"
                        style={{
                          left: useSecureTrade ? 'calc(50% + 2px)' : '2px',
                          width: 'calc(50% - 4px)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setUseSecureTrade(false)}
                        className={`relative z-10 flex-1 h-9 flex items-center justify-center uppercase text-[10px] tracking-[0.15em] font-black transition-all duration-200 ${!useSecureTrade ? "text-black" : "text-zinc-400 hover:text-zinc-600"
                          }`}
                      >
                        Disable
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseSecureTrade(true)}
                        className={`relative z-10 flex-1 h-9 flex items-center justify-center uppercase text-[10px] tracking-[0.15em] font-black transition-all duration-200 ${useSecureTrade ? "text-black" : "text-zinc-400 hover:text-zinc-600"
                          }`}
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                </div>

                {useSecureTrade && (
                  <div className="mt-5 pt-4 border-t border-white/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* Destination City for Auto-Routing */}
                    <div>
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 block mb-2">
                        Destination City (For Auto-Routing Agent)
                      </label>
                      <input
                        type="text"
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        placeholder="e.g. Mumbai, Delhi"
                        className="w-full bg-white border border-zinc-200 rounded-none p-3 text-[10px] uppercase font-bold tracking-widest text-zinc-900 focus:outline-none focus:border-black transition-colors"
                      />
                      <p className="text-[9px] uppercase tracking-widest text-zinc-400 mt-2">Based on location, we will auto-assign a Calico Verified Middleman.</p>
                    </div>

                    <div className="pt-4">
                      <h4 className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-3">Middleman Selection</h4>

                      {proposedAgentId ? (
                        <div className="border border-zinc-200 bg-zinc-50 p-4 rounded-none flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-none bg-white border border-zinc-200 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-black" strokeWidth={1.5} />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-black uppercase tracking-widest block mb-0.5">{proposedAgentName}</span>
                              <span className="text-[9px] uppercase tracking-widest text-zinc-500">Proposed Middleman</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setProposedAgentId(null); setProposedAgentName(null); }}
                            className="text-[10px] text-red-400 hover:text-red-300 h-6 px-2"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
                          <Sheet open={isAgentDrawerOpen} onOpenChange={setIsAgentDrawerOpen}>
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-14 border-zinc-200 bg-white hover:bg-zinc-50 text-black rounded-none gap-3 justify-start px-4 transition-all overflow-hidden"
                              >
                                <Search className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
                                <div className="text-left flex-1 min-w-0 flex flex-col items-start leading-none gap-1.5">
                                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] truncate w-full">Select Middleman</span>
                                  <span className="text-[9px] text-zinc-500 tracking-widest uppercase truncate w-full">Browse Directory</span>
                                </div>
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-white border-l-0 w-full sm:max-w-md p-0 flex flex-col">
                              <div className="p-6 border-b border-gray-100 flex-none pb-4">
                                <SheetHeader>
                                  <SheetTitle className="font-serif text-2xl">Verified QC Directory</SheetTitle>
                                  <SheetDescription className="text-gray-500 text-sm mt-1">
                                    Select specialized quality control agents and escrow providers to build consensus with your seller.
                                  </SheetDescription>
                                </SheetHeader>
                                <div className="relative mt-5">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search by expertise, location, or name..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                  />
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Recommended Agents</h4>
                                {MOCK_QC_AGENTS.map(agent => (
                                  <div key={agent.id} className="border border-gray-200 rounded-xl p-4 hover:border-black transition-colors relative group">
                                    {agent.certified && (
                                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide">
                                        <ShieldCheck className="w-3 h-3" />
                                        CERTIFIED
                                      </div>
                                    )}
                                    <div className="flex gap-4 items-start">
                                      <div className="w-12 h-12 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center shrink-0">
                                        <UserCheck className="w-5 h-5 text-gray-500" />
                                      </div>
                                      <div className="flex-1 min-w-0 pr-16">
                                        <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                          <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {agent.location}
                                          </div>
                                          <div className="flex items-center gap-1 text-amber-500">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="text-gray-700 font-medium">{agent.rating}</span>
                                            <span>({agent.reviews})</span>
                                          </div>
                                        </div>
                                        <div className="bg-gray-50 px-2 py-1 rounded text-xs text-gray-600 mt-2 font-medium inline-block border border-gray-100">
                                          Fee: {agent.fee}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1 text-xs h-8 border-gray-200"
                                      >
                                        View Profile
                                      </Button>
                                      <Button
                                        className="flex-1 text-xs h-8 bg-black hover:bg-gray-800 text-white"
                                        onClick={() => {
                                          setProposedAgentId(agent.id);
                                          setProposedAgentName(agent.name);
                                          setIsAgentDrawerOpen(false);
                                        }}
                                      >
                                        Propose Agent
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </SheetContent>
                          </Sheet>

                          <Button
                            onClick={() => {
                              toast.success('Auto-assigned Global Standard QC based on geography.');
                              setProposedAgentId('qc_3');
                              setProposedAgentName('Global Standard QC');
                            }}
                            variant="outline"
                            className="w-full h-14 border-zinc-200 bg-black hover:bg-zinc-800 text-white rounded-none gap-3 justify-start px-4 overflow-hidden shrink-0"
                          >
                            <Zap className="h-4 w-4 text-white shrink-0" strokeWidth={1.5} />
                            <div className="text-left flex-1 min-w-0 flex flex-col items-start leading-none gap-1.5">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold truncate w-full">Auto-Assign</span>
                              <span className="text-[9px] text-zinc-400 uppercase tracking-widest truncate w-full">Impartial Selection</span>
                            </div>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>



              <div className="space-y-3 pt-6 border-t border-zinc-200 mt-6">
                <Button
                  onClick={handleCheckout}
                  className="w-full h-14 bg-black hover:bg-zinc-900 text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold transition-all hover:scale-[1.01]"
                >
                  {useSecureTrade ? 'Create Proposal' : 'Buy Now'}
                </Button>

                <Button
                  variant="outline"
                  onClick={onContinueShopping}
                  className="w-full h-14 border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold transition-all"
                >
                  Continue Shopping
                </Button>
              </div>

              {/* Checkout Info */}
              <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-none">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-zinc-900 mt-0.5" strokeWidth={1.5} />
                  <div className="text-xs">
                    <p className="font-bold uppercase tracking-[0.1em] text-zinc-900 mb-1">Risk-Free Process</p>
                    <p className="text-zinc-500 font-light leading-relaxed">
                      Draft a purchase proposal and negotiate terms before payment is required.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Buy Now Flow Dialog / Proposal Flow */}
      <BuyNowFlow
        open={showBuyNowFlow}
        onOpenChange={setShowBuyNowFlow}
        items={cartItems.map(item => {
          const si = item.stockItem as any;
          const resolvedImage = si.images?.[0] ||
            si.mainImages?.[0] ||
            si.productImages?.[0] ||
            si.image ||
            si.thumbnail ||
            si.gallery?.[0] ||
            (typeof si.color === 'string' && si.color.startsWith('http') ? si.color : '');

          return {
            id: item.id,
            name: si.name || 'Unknown Item',
            quantity: item.quantity,
            price: item.unitPrice,
            image: resolvedImage,
            color: si.color,
            size: si.size,
            sellerId: si.supplierId,
            seller_name: si.supplier
          };
        })}
        onSuccess={handleBuyNowSuccess}
        middlemanRequested={useSecureTrade}
        middlemanRequestedBy="buyer"
        middlemanFeePayer={useSecureTrade ? 'buyer' : null}
        destinationCity={destinationCity}
        proposedMiddlemanId={proposedAgentId}
      />
    </div >
  );
};

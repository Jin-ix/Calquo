import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Camera,
    X,
    Check,
    Loader2,
    Package,
    Store,
    User,
    Sparkles,
    PartyPopper
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

// --- Interfaces ---

export interface ReviewRating {
    id: string;
    userId: string;
    userName: string;
    userCompany: string;
    targetId: string;
    targetType: 'item' | 'supplier' | 'buyer';
    targetName: string;
    rating: number;
    review?: string;
    images?: string[];
    createdDate: string;
}

export interface StunningRatingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'buyer' | 'seller'; // 'buyer' rates product/supplier, 'seller' rates buyer
    orderId: string;
    targets: {
        product?: { id: string; name: string; image?: string };
        supplier?: { id: string; name: string };
        buyer?: { id: string; name: string; company: string };
    };
    existingReviews?: {
        productRating?: ReviewRating;
        supplierRating?: ReviewRating;
        buyerRating?: ReviewRating;
    };
    onSubmit: (reviewData: any) => Promise<void>;
}

// --- Sub-components ---

const StarRating = ({
    rating,
    onRatingChange,
    size = "lg",
    disabled = false,
    animated = true
}: {
    rating: number;
    onRatingChange: (r: number) => void;
    size?: "sm" | "md" | "lg" | "xl";
    disabled?: boolean;
    animated?: boolean;
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleRating = (star: number) => {
        onRatingChange(star);
        if (star === 5 && !disabled) {
            confetti({
                particleCount: 30,
                spread: 30,
                origin: { y: 0.7, x: 0.5 },
                colors: ['#FACC15', '#FDE047', '#FEF08A'],
                disableForReducedMotion: true,
                zIndex: 2000 // Ensure it's above dialog
            });
        }
    };

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-10 h-10"
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star}
                    type="button"
                    disabled={disabled}
                    whileHover={!disabled && animated ? { scale: 1.25, rotate: 10 } : {}}
                    whileTap={!disabled && animated ? { scale: 0.85 } : {}}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => !disabled && setHoverRating(0)}
                    className={cn(
                        "rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    )}
                >
                    <Star
                        className={cn(
                            sizeClasses[size],
                            "transition-all duration-300",
                            (hoverRating || rating) >= star
                                ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                                : "text-muted-foreground/20 fill-transparent"
                        )}
                    />
                </motion.button>
            ))}
        </div>
    );
};

const ImageUploader = ({
    images,
    onImagesChange,
    maxImages = 3
}: {
    images: string[];
    onImagesChange: (imgs: string[]) => void;
    maxImages?: number;
}) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && images.length < maxImages) {
                    onImagesChange([...images, event.target.result as string]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            <AnimatePresence>
                {images.map((img, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border group"
                    >
                        <img src={img} alt="Upload" className="w-full h-full object-cover" />
                        <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                ))}
                {images.length < maxImages && (
                    <motion.label
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                        <Camera className="w-6 h-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1">Add Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </motion.label>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Component ---

export const StunningRatingDialog: React.FC<StunningRatingDialogProps> = ({
    open,
    onOpenChange,
    mode,
    orderId,
    targets,
    existingReviews,
    onSubmit
}) => {
    const { user } = useAuth();
    const [step, setStep] = useState(0); // 0: First Target, 1: Second Target (if buyer), 2: Success
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for ratings
    // Buyer Mode: Product -> Supplier
    // Seller Mode: Buyer

    const [rating1, setRating1] = useState(0); // Product (Buyer) or Buyer (Seller)
    const [review1, setReview1] = useState('');
    const [images1, setImages1] = useState<string[]>([]);

    const [rating2, setRating2] = useState(0); // Supplier (Buyer only)
    const [review2, setReview2] = useState('');

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setStep(0);
            setIsSubmitting(false);

            if (mode === 'buyer') {
                const prod = existingReviews?.productRating;
                const supp = existingReviews?.supplierRating;
                setRating1(prod?.rating || 0);
                setReview1(prod?.review || '');
                setImages1(prod?.images || []);
                setRating2(supp?.rating || 0);
                setReview2(supp?.review || '');
            } else {
                const buy = existingReviews?.buyerRating;
                setRating1(buy?.rating || 0);
                setReview1(buy?.review || '');
                setImages1([]); // No images for buyer rating usually
                setRating2(0);
                setReview2('');
            }
        }
    }, [open, mode, existingReviews]);

    const handleNext = async () => {
        if (mode === 'buyer' && step === 0) {
            setStep(1);
        } else {
            // Submit
            setIsSubmitting(true);

            const payload: any = { orderId };

            if (mode === 'buyer') {
                if (rating1 > 0) {
                    payload.productRating = {
                        userId: user?.email,
                        userName: user?.name,
                        userCompany: user?.company,
                        targetId: targets.product?.id,
                        targetType: 'item',
                        targetName: targets.product?.name,
                        rating: rating1,
                        review: review1,
                        images: images1
                    };
                }
                if (rating2 > 0) {
                    payload.supplierRating = {
                        userId: user?.email,
                        userName: user?.name,
                        userCompany: user?.company,
                        targetId: targets.supplier?.id,
                        targetType: 'supplier',
                        targetName: targets.supplier?.name,
                        rating: rating2,
                        review: review2
                    };
                }
            } else {
                // Seller Mode
                if (rating1 > 0) {
                    payload.buyerRating = {
                        userId: user?.email, // Seller's email
                        userName: user?.name,
                        userCompany: user?.company,
                        targetId: targets.buyer?.id,
                        targetType: 'buyer',
                        targetName: targets.buyer?.company || targets.buyer?.name,
                        rating: rating1,
                        review: review1
                    };
                }
            }

            try {
                await onSubmit(payload);
                triggerSuccess();
            } catch (err) {
                setIsSubmitting(false);
                toast.error("Failed to submit rating");
            }
        }
    };

    const triggerSuccess = () => {
        setStep(2); // Success step
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FACC15', '#A855F7', '#3B82F6']
        });

        // Auto close after 2.5s
        setTimeout(() => {
            onOpenChange(false);
        }, 2500);
    };

    const getStepContent = () => {
        if (step === 2) {
            return (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-8 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Thank You!</h3>
                    <p className="text-muted-foreground">Your feedback helps the community grow.</p>
                </motion.div>
            );
        }

        if (mode === 'buyer') {
            if (step === 0) {
                // Product Rating
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg leading-none">Rate Product</h3>
                                <p className="text-sm text-muted-foreground">{targets.product?.name}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                            <span className="text-sm font-medium text-muted-foreground mb-3">How was the quality?</span>
                            <StarRating rating={rating1} onRatingChange={setRating1} size="xl" />
                            <div className="h-6 mt-2">
                                {rating1 > 0 && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-semibold text-primary"
                                    >
                                        {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating1 - 1]}
                                    </motion.span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Write a Review (Optional)</Label>
                            <Textarea
                                placeholder="What did you like or dislike?"
                                value={review1}
                                onChange={(e) => setReview1(e.target.value)}
                                className="resize-none h-24 bg-background/50 focus:bg-background transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Add Photos</Label>
                            <ImageUploader images={images1} onImagesChange={setImages1} />
                        </div>
                    </motion.div>
                );
            } else {
                // Supplier Rating
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                <Store className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg leading-none">Rate Supplier</h3>
                                <p className="text-sm text-muted-foreground">{targets.supplier?.name}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                            <span className="text-sm font-medium text-muted-foreground mb-3">How was the service?</span>
                            <StarRating rating={rating2} onRatingChange={setRating2} size="xl" />
                            <div className="h-6 mt-2">
                                {rating2 > 0 && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-semibold text-primary"
                                    >
                                        {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating2 - 1]}
                                    </motion.span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Supplier Experience (Optional)</Label>
                            <Textarea
                                placeholder="Communication, delivery speed, packaging..."
                                value={review2}
                                onChange={(e) => setReview2(e.target.value)}
                                className="resize-none h-24 bg-background/50 focus:bg-background transition-colors"
                            />
                        </div>
                    </motion.div>
                );
            }
        } else {
            // Seller Mode: Rate Buyer
            return (
                <motion.div
                    key="step1-seller"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg leading-none">Rate Buyer</h3>
                            <p className="text-sm text-muted-foreground">{targets.buyer?.company}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                        <span className="text-sm font-medium text-muted-foreground mb-3">Payment & Communication?</span>
                        <StarRating rating={rating1} onRatingChange={setRating1} size="xl" />
                        <div className="h-6 mt-2">
                            {rating1 > 0 && (
                                <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm font-semibold text-primary"
                                >
                                    {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating1 - 1]}
                                </motion.span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Feedback (Optional)</Label>
                        <Textarea
                            placeholder="Payment timeliness, clarity of requirements..."
                            value={review1}
                            onChange={(e) => setReview1(e.target.value)}
                            className="resize-none h-24 bg-background/50 focus:bg-background transition-colors"
                        />
                    </div>
                </motion.div>
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl p-0 overflow-hidden gap-0">

                {/* Decorative Header Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent pointer-events-none animate-pulse" />

                {/* Header content depends on step/mode, but we use consistent padding */}
                <div className="p-6 pb-2 relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        {step < 2 && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                Rating
                            </div>
                        )}
                        {/* Progress dots for Buyer Mode */}
                        {mode === 'buyer' && step < 2 && (
                            <div className="flex gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full transition-colors", step === 0 ? "bg-primary" : "bg-primary/30")} />
                                <div className={cn("w-2 h-2 rounded-full transition-colors", step === 1 ? "bg-primary" : "bg-primary/30")} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Body */}
                <div className="px-6 pb-6 relative z-10 min-h-[350px]">
                    <AnimatePresence mode="wait">
                        {getStepContent()}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                {step < 2 && (
                    <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-between items-center">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>

                        <div className="flex gap-2">
                            {mode === 'buyer' && step === 1 && (
                                <Button variant="ghost" onClick={() => setStep(0)} disabled={isSubmitting}>
                                    Back
                                </Button>
                            )}

                            <Button
                                onClick={handleNext}
                                disabled={
                                    isSubmitting ||
                                    (step === 0 && rating1 === 0) ||
                                    (step === 1 && rating2 === 0)
                                }
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    mode === 'buyer' && step === 0 ? 'Next: Rate Supplier' : (
                                        <>
                                            Submit Rating
                                            <PartyPopper className="ml-2 h-4 w-4" />
                                        </>
                                    )
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

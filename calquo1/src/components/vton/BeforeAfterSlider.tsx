import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterImage: string;
    className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
    beforeImage,
    afterImage,
    className = ''
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDrag = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

        setSliderPosition(percentage);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) handleDrag(e.clientX);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Disable text selection while dragging
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = 'auto';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'auto';
        };
    }, [isDragging]);

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging) handleDrag(e.touches[0].clientX);
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden cursor-ew-resize select-none ${className}`}
            onMouseDown={(e) => {
                setIsDragging(true);
                handleDrag(e.clientX);
            }}
            onTouchStart={(e) => {
                setIsDragging(true);
                handleDrag(e.touches[0].clientX);
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
        >
            {/* Before Image (Base) */}
            <img
                src={beforeImage}
                alt="Before Image"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none filter grayscale-[20%]"
            />

            {/* After Image (Clipped) */}
            <div
                className="absolute inset-0 overflow-hidden w-full h-full select-none pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
                <img
                    src={afterImage}
                    alt="Generated Image"
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10 mix-blend-overlay" />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none transition-transform duration-75"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    <GripVertical className="w-4 h-4" />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                Original
            </div>
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 items-center justify-center">
                Generated
            </div>
        </div>
    );
};

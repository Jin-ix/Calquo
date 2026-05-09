import React, { useRef, useState } from 'react';

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
    children,
    className = "",
    spotlightColor = "rgba(0,0,0,0.06)"
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [opacity, setOpacity] = useState(0);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        divRef.current.style.setProperty('--x', `${x}px`);
        divRef.current.style.setProperty('--y', `${y}px`);
    };

    return (
        <div
            ref={divRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setOpacity(1)}
            onPointerLeave={() => setOpacity(0)}
            className={`relative group ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 z-20 rounded-xl"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at var(--x) var(--y), ${spotlightColor}, transparent 40%)`
                }}
            />
            {children}
        </div>
    );
};

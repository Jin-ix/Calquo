import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxWrapperProps {
    children: React.ReactNode;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    height?: string;
    className?: string;
    scrimGradient?: string;
}

export const ParallaxWrapper: React.FC<ParallaxWrapperProps> = ({
    children,
    backgroundImageUrl,
    overlayOpacity = 0.4,
    height = '60vh',
    className = '',
    scrimGradient
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start']
    });

    // Background moves slower than the scroll, creating depth
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

    // Content fades out slightly and moves up as you scroll down
    const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <div
            ref={ref}
            className={`relative flex items-center justify-center overflow-hidden ${className}`}
            style={{ height, minHeight: '400px' }}
        >
            <motion.div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: scrimGradient
                        ? `${scrimGradient}, url(${backgroundImageUrl})`
                        : `url(${backgroundImageUrl})`,
                    y: backgroundY,
                }}
            />

            {/* Dark gradient overlay for readability */}
            <div
                className="absolute inset-0 z-10 bg-gradient-to-t from-background/90 via-background/40 to-black/20"
                style={{ opacity: overlayOpacity }}
            />

            {/* Optional glassmorphism accent layer */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />

            <motion.div
                className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                style={{
                    y: contentY,
                    opacity: contentOpacity,
                }}
            >
                {children}
            </motion.div>
        </div>
    );
};

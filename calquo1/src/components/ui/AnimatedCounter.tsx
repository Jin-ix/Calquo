import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, motion, useAnimation } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    formatCurrency?: boolean;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

export function AnimatedCounter({
    value,
    duration = 1.5,
    formatCurrency = false,
    prefix = '',
    suffix = '',
    decimals = 0
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-20px" });
    const controls = useAnimation();
    const prevValueRef = useRef(value);

    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        duration: duration * 1000
    });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);

            if (prevValueRef.current !== undefined && value !== prevValueRef.current) {
                controls.start({
                    scale: [1, 1.05, 1],
                    color: ["inherit", "#10b981", "inherit"],
                    transition: { duration: 0.6, ease: "easeOut" }
                });
            }
            prevValueRef.current = value;
        }
    }, [isInView, value, motionValue, controls]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                let displayValue = "";

                if (formatCurrency) {
                    // Indian Rupee formatting
                    displayValue = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: decimals,
                        minimumFractionDigits: decimals
                    }).format(latest);
                } else {
                    displayValue = new Intl.NumberFormat('en-IN', {
                        maximumFractionDigits: decimals,
                        minimumFractionDigits: decimals
                    }).format(latest);
                }

                ref.current.textContent = `${prefix}${displayValue}${suffix}`;
            }
        });
    }, [springValue, formatCurrency, prefix, suffix, decimals]);

    return (
        <motion.span
            ref={ref}
            className="tabular-nums tracking-tight inline-block origin-left"
            animate={controls}
            initial={{ scale: 1, color: "inherit" }}
        />
    );
}

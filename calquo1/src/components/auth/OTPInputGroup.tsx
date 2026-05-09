import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../ui/utils';

interface OTPInputGroupProps {
    length?: number;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}

export function OTPInputGroup({
    length = 6,
    value,
    onChange,
    disabled = false
}: OTPInputGroupProps) {
    const [activeSegment, setActiveSegment] = useState<number>(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize the refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        // Prevent non-numeric entry (except navigation/control keys)
        const isControl = [
            'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'
        ].includes(e.key);

        // Allow numeric
        const isNumber = /^[0-9]$/.test(e.key);

        // Allow paste (Cmd/Ctrl + v)
        const isPaste = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v';

        if (!isNumber && !isControl && !isPaste) {
            e.preventDefault();
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();

            const newValue = value.split('');

            // If there's a character at the current index, delete it
            if (newValue[index]) {
                newValue[index] = '';
                onChange(newValue.join(''));
            }
            // If it's already empty, move to the previous input and delete its value
            else if (index > 0) {
                newValue[index - 1] = '';
                onChange(newValue.join(''));
                inputRefs.current[index - 1]?.focus();
            }
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        }

        if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const inputValue = e.target.value;

        // Only accept numbers
        if (!/^[0-9]*$/.test(inputValue)) return;

        // Handle single character input
        const char = inputValue[inputValue.length - 1] || '';

        const newValue = value.split('');
        newValue[index] = char;

        // Join and trim to length
        onChange(newValue.join('').slice(0, length));

        // Move to next input automatically if a character was entered
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleFocus = (index: number) => {
        setActiveSegment(index);
        // Select the content on focus so replacing it is easy
        setTimeout(() => {
            inputRefs.current[index]?.select();
        }, 0);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!pastedData) return;

        onChange(pastedData);

        // Focus the next empty input, or the last input if full
        const nextEmptyIndex = pastedData.length < length ? pastedData.length : length - 1;
        inputRefs.current[nextEmptyIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {Array.from({ length }).map((_, index) => {
                const isActive = activeSegment === index;
                const char = value[index] || '';

                return (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={char}
                        disabled={disabled}
                        onChange={(e) => handleInput(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => handleFocus(index)}
                        onBlur={() => setActiveSegment(-1)}
                        aria-label={`Digit ${index + 1}`}
                        className={cn(
                            "w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-none shrink-0",
                            "bg-transparent border outline-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                            "text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
                            disabled && "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200",
                            // Focus animation rules
                            isActive && !disabled
                                ? "border-black ring-1 ring-black bg-white scale-105 z-10"
                                : "border-slate-300 hover:border-slate-400",
                            // Pop effect when a number is present
                            char && !isActive ? "scale-100 border-slate-400 bg-slate-50 border-b-[3px] border-b-black" : ""
                        )}
                        autoComplete="one-time-code"
                    />
                );
            })}
        </div>
    );
}

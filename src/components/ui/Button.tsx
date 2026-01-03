import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'neon';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
                    {
                        // Primary: Neon Green Glow
                        'bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,157,0.6)]': variant === 'primary',

                        // Secondary: Neon Blue Glow
                        'bg-secondary text-black hover:bg-secondary/90 hover:shadow-[0_0_20px_rgba(0,212,255,0.6)]': variant === 'secondary',

                        // Danger: Neon Red Glow
                        'bg-accent text-white hover:bg-accent/90 hover:shadow-[0_0_20px_rgba(255,0,85,0.6)]': variant === 'danger',

                        // Ghost: Subtle hover
                        'hover:bg-white/10 text-gray-300 hover:text-white': variant === 'ghost',

                        // Neon Outline
                        'bg-transparent border border-primary text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_20px_rgba(0,255,157,0.4)]': variant === 'neon',

                        'h-9 px-4 py-2 text-xs': size === 'sm',
                        'h-12 px-8 py-3 text-sm': size === 'md',
                        'h-14 px-10 text-base': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

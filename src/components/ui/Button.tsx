import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'neon' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] select-none',
                    {
                        'bg-primary text-black hover:brightness-110 hover:glow-primary': variant === 'primary',
                        'bg-secondary text-black hover:brightness-110 hover:glow-secondary': variant === 'secondary',
                        'bg-accent text-white hover:brightness-110 hover:glow-accent': variant === 'danger',
                        'text-gray-300 hover:bg-white/10 hover:text-white': variant === 'ghost',
                        'bg-transparent border border-primary text-primary hover:bg-primary hover:text-black hover:glow-primary': variant === 'neon',
                        'bg-white/[0.03] border border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20 hover:text-white': variant === 'outline',

                        'h-9 px-3.5 text-xs': size === 'sm',
                        'h-11 px-6 text-sm': size === 'md',
                        'h-14 px-10 text-base': size === 'lg',
                        'h-9 w-9 p-0': size === 'icon',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

import React from 'react';
import type { HandKey } from '../../poker/cards';
import { cn } from '../../utils/cn';

const SUITS = { s: { symbol: '♠', red: false }, h: { symbol: '♥', red: true }, d: { symbol: '♦', red: true }, c: { symbol: '♣', red: false } } as const;
type Suit = keyof typeof SUITS;

export const PlayingCard: React.FC<{ rank: string; suit: Suit; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ rank, suit, size = 'md', className }) => {
    const { symbol, red } = SUITS[suit];
    const label = rank === 'T' ? '10' : rank;
    const dims = { sm: 'w-9 h-12 text-base', md: 'w-12 h-16 text-xl', lg: 'w-16 h-22 text-3xl' }[size];
    return (
        <div
            className={cn(
                'relative rounded-lg bg-gradient-to-b from-white to-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.45)] border border-white/60 flex flex-col items-center justify-center font-black leading-none',
                red ? 'text-red-600' : 'text-gray-900',
                dims,
                className
            )}
            aria-hidden="true"
        >
            <span>{label}</span>
            <span className="text-[0.8em]">{symbol}</span>
        </div>
    );
};

/** Muestra una mano con dos cartas de ejemplo: mismo palo si es "suited", palos distintos si no. */
export const HandCards: React.FC<{ hand: HandKey; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ hand, size, className }) => {
    const suited = hand.endsWith('s');
    return (
        <div className={cn('flex items-center', className)} role="img" aria-label={hand}>
            <PlayingCard rank={hand[0]} suit="s" size={size} className="-rotate-6" />
            <PlayingCard rank={hand[1]} suit={suited ? 's' : 'h'} size={size} className="rotate-6 -ml-3" />
        </div>
    );
};

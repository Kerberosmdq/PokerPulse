import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { X, DollarSign } from 'lucide-react';

interface PrizePoolProps {
    onClose: () => void;
}

export const PrizePool: React.FC<PrizePoolProps> = ({ onClose }) => {
    const { prizePool, payoutStructure, setPayoutStructure } = useGameStore();

    const calculatePayouts = () => {
        switch (payoutStructure) {
            case 'winner-takes-all':
                return [{ place: 1, amount: prizePool, percent: 100 }];
            case 'heads-up':
                return [
                    { place: 1, amount: Math.floor(prizePool * 0.7), percent: 70 },
                    { place: 2, amount: Math.floor(prizePool * 0.3), percent: 30 }
                ];
            case 'top-3':
            default:
                return [
                    { place: 1, amount: Math.floor(prizePool * 0.5), percent: 50 },
                    { place: 2, amount: Math.floor(prizePool * 0.3), percent: 30 },
                    { place: 3, amount: Math.floor(prizePool * 0.2), percent: 20 }
                ];
        }
    };

    const payouts = calculatePayouts();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-surface-light p-6 rounded-lg max-w-md w-full relative space-y-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                        <DollarSign className="w-6 h-6 text-secondary" /> Bolsa de Premios
                    </h2>
                    <div className="text-4xl font-bold text-secondary">
                        ${prizePool.toLocaleString()}
                    </div>
                </div>

                {/* Payout Structure Selector */}
                <div className="flex gap-2 justify-center">
                    <Button
                        size="sm"
                        variant={payoutStructure === 'winner-takes-all' ? 'primary' : 'ghost'}
                        onClick={() => setPayoutStructure('winner-takes-all')}
                        className="text-xs"
                    >
                        Todo al Ganador
                    </Button>
                    <Button
                        size="sm"
                        variant={payoutStructure === 'heads-up' ? 'primary' : 'ghost'}
                        onClick={() => setPayoutStructure('heads-up')}
                        className="text-xs"
                    >
                        Mano a Mano
                    </Button>
                    <Button
                        size="sm"
                        variant={payoutStructure === 'top-3' ? 'primary' : 'ghost'}
                        onClick={() => setPayoutStructure('top-3')}
                        className="text-xs"
                    >
                        Top 3
                    </Button>
                </div>

                <div className="space-y-4">
                    {payouts.map((payout) => (
                        <div key={payout.place} className="bg-surface-light p-4 rounded flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">
                                    {payout.place === 1 ? '🥇' : payout.place === 2 ? '🥈' : '🥉'}
                                </span>
                                <span className="font-bold text-white">
                                    {payout.place === 1 ? '1er Puesto' : payout.place === 2 ? '2do Puesto' : '3er Puesto'}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-mono text-primary">${payout.amount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">{payout.percent}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

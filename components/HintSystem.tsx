// Hint System Component
import { useState } from 'react';
import { Lightbulb, Lock, ChevronRight } from 'lucide-react';

interface Hint {
    id: string;
    text: string;
    level: number;
}

interface HintSystemProps {
    questionId: string;
    onHintUsed?: (level: number) => void;
}

export default function HintSystem({ questionId, onHintUsed }: HintSystemProps) {
    const [hints, setHints] = useState<Hint[]>([]);
    const [revealedLevels, setRevealedLevels] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHints = async () => {
        if (hints.length > 0) return; // Already fetched

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/hints/${questionId}`);
            const data = await response.json();
            setHints(data.hints);
        } catch (error) {
            console.error('Error fetching hints:', error);
        } finally {
            setLoading(false);
        }
    };

    const revealHint = (level: number) => {
        if (!revealedLevels.includes(level)) {
            setRevealedLevels([...revealedLevels, level]);
            onHintUsed?.(level);
        }
    };

    const getHintIcon = (level: number) => {
        const colors = {
            1: 'text-green-600',
            2: 'text-yellow-600',
            3: 'text-red-600'
        };
        return colors[level as keyof typeof colors] || 'text-gray-600';
    };

    const getHintLabel = (level: number) => {
        const labels = {
            1: 'Gentle Hint',
            2: 'Moderate Hint',
            3: 'Strong Hint'
        };
        return labels[level as keyof typeof labels] || `Hint ${level}`;
    };

    if (hints.length === 0 && !loading) {
        return (
            <button
                onClick={fetchHints}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-300"
            >
                <Lightbulb className="w-5 h-5" />
                <span className="font-medium">Need a hint?</span>
            </button>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Loading hints...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-900">Hints</h3>
                <span className="text-sm text-gray-500">({revealedLevels.length}/3 revealed)</span>
            </div>

            {hints.map((hint) => {
                const isRevealed = revealedLevels.includes(hint.level);
                const canReveal = hint.level === 1 || revealedLevels.includes(hint.level - 1);

                return (
                    <div
                        key={hint.id}
                        className={`border-2 rounded-xl overflow-hidden transition-all ${isRevealed
                                ? 'border-yellow-300 bg-yellow-50'
                                : canReveal
                                    ? 'border-gray-200 bg-white hover:border-yellow-200'
                                    : 'border-gray-100 bg-gray-50 opacity-60'
                            }`}
                    >
                        <button
                            onClick={() => canReveal && revealHint(hint.level)}
                            disabled={!canReveal || isRevealed}
                            className="w-full p-4 text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isRevealed ? (
                                        <Lightbulb className={`w-5 h-5 ${getHintIcon(hint.level)}`} />
                                    ) : (
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    )}
                                    <span className={`font-semibold ${isRevealed ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {getHintLabel(hint.level)}
                                    </span>
                                </div>
                                {!isRevealed && canReveal && (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>

                            {isRevealed && (
                                <p className="mt-3 text-gray-700 leading-relaxed pl-8">
                                    {hint.text}
                                </p>
                            )}

                            {!isRevealed && !canReveal && (
                                <p className="mt-2 text-sm text-gray-400 pl-8">
                                    Unlock previous hints first
                                </p>
                            )}
                        </button>
                    </div>
                );
            })}

            {revealedLevels.length === 3 && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                        💡 You've revealed all hints! If you're still stuck, try reviewing the problem constraints and examples.
                    </p>
                </div>
            )}
        </div>
    );
}

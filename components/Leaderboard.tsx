// Leaderboard Component
import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    email: string;
    name: string;
    picture?: string;
    totalScore: number;
    questionsSolved: number;
    avgScore: number;
}

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        fetchLeaderboard();
    }, [limit]);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/rankings?limit=${limit}`);
            const data = await response.json();
            setLeaderboard(data.leaderboard);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-8 h-8 text-yellow-500" />;
            case 2:
                return <Medal className="w-8 h-8 text-gray-400" />;
            case 3:
                return <Medal className="w-8 h-8 text-amber-600" />;
            default:
                return <span className="text-2xl font-bold text-gray-400">#{rank}</span>;
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300';
            case 2:
                return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300';
            case 3:
                return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300';
            default:
                return 'bg-white border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="w-12 h-12 text-yellow-500" />
                    <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
                </div>
                <p className="text-gray-600">Top performers in the AI Interview Challenge</p>
            </div>

            {/* Leaderboard */}
            <div className="space-y-3">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No rankings yet. Be the first to solve questions!</p>
                    </div>
                ) : (
                    leaderboard.map((entry) => (
                        <div
                            key={entry.rank}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 shadow-md transition-all hover:shadow-lg ${getRankBg(entry.rank)}`}
                        >
                            {/* Rank */}
                            <div className="flex items-center justify-center w-16 h-16">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    {entry.picture ? (
                                        <img
                                            src={entry.picture}
                                            alt={entry.name}
                                            className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {entry.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{entry.name || 'Anonymous'}</h3>
                                        <p className="text-sm text-gray-600">{entry.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="text-right space-y-1">
                                <div className="flex items-center gap-2 justify-end">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    <span className="text-2xl font-bold text-gray-900">{entry.totalScore}</span>
                                </div>
                                <p className="text-sm text-gray-600">{entry.questionsSolved} solved</p>
                                <p className="text-xs text-gray-500">Avg: {entry.avgScore}%</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More */}
            {leaderboard.length >= limit && (
                <div className="text-center mt-6">
                    <button
                        onClick={() => setLimit(limit + 10)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}

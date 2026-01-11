import { useEffect, useState } from 'react';
import { Trophy, Award, TrendingUp, Star, Zap, Target } from 'lucide-react';
interface ProgressData {
    email: string;
    level: number;
    xp: number;
    nextLevelXP: number;
    progressToNextLevel: number;
    badges: string[];
    rank: number;
    totalStudents: number;
    totalScore: number;
    questionsSolved: number;
    avgScore: number;
    solvedQuestions: Array<{
        title: string;
        difficulty: string;
        domain: string;
        score: number;
        solvedAt: string;
        attempts: number;
    }>;
    recentActivity: Array<{
        questionTitle: string;
        difficulty: string;
        score: number;
        date: string;
    }>;
}
export default function StudentProgressDashboard({ userEmail }: { userEmail: string }) {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchProgress();
    }, [userEmail]);
    const fetchProgress = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/student/my-progress?email=${encodeURIComponent(userEmail)}`, {
                headers: { 'x-user-email': userEmail }
            });
            const data = await response.json();
            setProgress(data);
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    if (!progress) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Unable to load progress data</p>
            </div>
        );
    }
    const getLevelColor = (level: number) => {
        if (level >= 8) return 'from-purple-600 to-pink-600';
        if (level >= 5) return 'from-blue-600 to-indigo-600';
        if (level >= 3) return 'from-green-600 to-teal-600';
        return 'from-gray-600 to-gray-700';
    };
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toUpperCase()) {
            case 'EASY': return 'text-green-600 bg-green-50';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
            case 'HARD': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                { }
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Progress</h1>
                    <p className="text-gray-600">Track your learning journey and achievements</p>
                </div>
                { }
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    { }
                    <div className={`bg-gradient-to-br ${getLevelColor(progress.level)} rounded-2xl p-6 text-white shadow-lg`}>
                        <div className="flex items-center justify-between mb-4">
                            <Zap className="w-8 h-8" />
                            <span className="text-3xl font-bold">Level {progress.level}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>XP Progress</span>
                                <span>{progress.xp} / {progress.nextLevelXP}</span>
                            </div>
                            <div className="w-full bg-white/30 rounded-full h-2">
                                <div
                                    className="bg-white rounded-full h-2 transition-all duration-500"
                                    style={{ width: `${progress.progressToNextLevel}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-90">{progress.progressToNextLevel}% to next level</p>
                        </div>
                    </div>
                    { }
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            <span className="text-sm text-gray-500">Global Rank</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-900">#{progress.rank}</p>
                            <p className="text-sm text-gray-600">out of {progress.totalStudents} students</p>
                            <p className="text-xs text-gray-500">
                                Top {Math.round((progress.rank / progress.totalStudents) * 100)}%
                            </p>
                        </div>
                    </div>
                    { }
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <Target className="w-8 h-8 text-green-500" />
                            <span className="text-sm text-gray-500">Solved</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-900">{progress.questionsSolved}</p>
                            <p className="text-sm text-gray-600">Questions Completed</p>
                            <p className="text-xs text-gray-500">Avg Score: {progress.avgScore}%</p>
                        </div>
                    </div>
                    { }
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-blue-500" />
                            <span className="text-sm text-gray-500">Total Score</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-900">{progress.totalScore}</p>
                            <p className="text-sm text-gray-600">Points Earned</p>
                            <p className="text-xs text-gray-500">Keep grinding!</p>
                        </div>
                    </div>
                </div>
                { }
                {progress.badges?.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-6 h-6 text-purple-600" />
                            <h2 className="text-xl font-bold text-gray-900">Badges Earned</h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {progress.badges.map((badge, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full border border-purple-200"
                                >
                                    <Star className="w-5 h-5 text-purple-600" />
                                    <span className="font-medium text-purple-900">{badge}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                { }
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Solved Questions</h2>
                    <div className="space-y-3">
                        {progress.solvedQuestions?.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No questions solved yet. Start practicing!</p>
                        ) : (
                            progress.solvedQuestions?.map((q, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{q.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(q.difficulty)}`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="text-xs text-gray-500">{q.domain}</span>
                                            <span className="text-xs text-gray-500">{q.attempts} attempt(s)</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">{q.score}%</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(q.solvedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                { }
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {progress.recentActivity?.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No recent activity</p>
                        ) : (
                            progress.recentActivity?.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{activity.questionTitle}</p>
                                        <p className="text-sm text-gray-600">
                                            {activity.difficulty} • Score: {activity.score}%
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(activity.date).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
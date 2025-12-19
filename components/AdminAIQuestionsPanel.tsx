// Admin AI Questions Panel Component
import { useEffect, useState } from 'react';
import { Sparkles, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface AIQuestion {
    id: string;
    title: string;
    domain: string;
    difficulty: string;
    type: string;
    createdAt: string;
    testCasesCount: number;
    hintsCount: number;
    assignedTo: number;
    attemptCount: number;
    solvedBy: number;
}

export default function AdminAIQuestionsPanel() {
    const [questions, setQuestions] = useState<AIQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

    useEffect(() => {
        fetchAIQuestions();
    }, []);

    const fetchAIQuestions = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/suggested-questions', {
                headers: {
                    'x-user-email': localStorage.getItem('userEmail') || '',
                    'x-user-role': 'admin'
                }
            });
            const data = await response.json();
            setQuestions(data.suggestions);
        } catch (error) {
            console.error('Error fetching AI questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toUpperCase()) {
            case 'EASY': return 'bg-green-100 text-green-800 border-green-300';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'HARD': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                    <h1 className="text-3xl font-bold text-gray-900">AI-Generated Questions</h1>
                </div>
                <p className="text-gray-600">Review and assign AI-generated questions to students</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-gray-600">Total Generated</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600">Total Assigned</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {questions.reduce((sum, q) => sum + q.assignedTo, 0)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">Total Attempts</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {questions.reduce((sum, q) => sum + q.attemptCount, 0)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">Total Solved</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {questions.reduce((sum, q) => sum + q.solvedBy, 0)}
                    </p>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No AI-generated questions yet</p>
                        <p className="text-sm text-gray-400 mt-2">Questions will appear here when students generate them</p>
                    </div>
                ) : (
                    questions.map((question) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{question.title}</h3>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getDifficultyColor(question.difficulty)}`}>
                                            {question.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <span className="font-medium">{question.domain}</span>
                                        </span>
                                        <span>•</span>
                                        <span>{question.type}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(question.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuestion(question.id)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                >
                                    Assign to Students
                                </button>
                            </div>

                            {/* Question Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">{question.testCasesCount}</p>
                                    <p className="text-xs text-gray-600">Test Cases</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{question.hintsCount}</p>
                                    <p className="text-xs text-gray-600">Hints</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-indigo-600">{question.assignedTo}</p>
                                    <p className="text-xs text-gray-600">Assigned</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{question.attemptCount}</p>
                                    <p className="text-xs text-gray-600">Attempts</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{question.solvedBy}</p>
                                    <p className="text-xs text-gray-600">Solved</p>
                                </div>
                            </div>

                            {/* Success Rate */}
                            {question.attemptCount > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-600">Success Rate</span>
                                        <span className="font-medium text-gray-900">
                                            {Math.round((question.solvedBy / question.attemptCount) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 rounded-full h-2 transition-all"
                                            style={{ width: `${(question.solvedBy / question.attemptCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

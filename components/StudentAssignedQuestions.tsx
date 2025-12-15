/**
 * Student Assigned Questions Component
 * Displays questions assigned by administrators
 */
import React, { useState, useEffect } from 'react';
import { BookIcon, CheckCircleIcon, ClockIcon, PlayIcon } from './icons';

interface AssignedQuestion {
    id: string;
    title: string;
    difficulty: string;
    domain: string;
    prompt: string;
    assignmentId: string;
    assignedAt: string;
    dueDate: string | null;
    completed: boolean;
    completedAt: string | null;
}

interface StudentAssignedQuestionsProps {
    userEmail: string;
    onStartQuestion: (question: any) => void;
}

const StudentAssignedQuestions: React.FC<StudentAssignedQuestionsProps> = ({ userEmail, onStartQuestion }) => {
    const [aiPractice, setAiPractice] = useState<AssignedQuestion[]>([]);
    const [adminPractice, setAdminPractice] = useState<AssignedQuestion[]>([]);
    const [testQuestions, setTestQuestions] = useState<AssignedQuestion[]>([]);
    const [progress, setProgress] = useState({ total: 0, completed: 0, pending: 0, overdue: 0, progress: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ai' | 'practice' | 'test'>('practice');

    const API_URL = 'http://localhost:3001';

    useEffect(() => {
        fetchAssignedQuestions();
        fetchProgress();
    }, []);

    const fetchAssignedQuestions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/student/assigned-questions`, {
                headers: {
                    'x-user-email': userEmail,
                    'x-user-role': 'student'
                }
            });
            const data = await response.json();
            setAiPractice(data.assignments?.aiPractice || []);
            setAdminPractice(data.assignments?.adminPractice || []);
            setTestQuestions(data.assignments?.test || []);
        } catch (error) {
            console.error('Error fetching assigned questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const response = await fetch(`${API_URL}/api/student/my-progress`, {
                headers: {
                    'x-user-email': userEmail,
                    'x-user-role': 'student'
                }
            });
            const data = await response.json();
            setProgress(data);
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
            case 'hard': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const isOverdue = (dueDate: string | null) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getCurrentQuestions = () => {
        switch (activeTab) {
            case 'ai': return aiPractice;
            case 'practice': return adminPractice;
            case 'test': return testQuestions;
            default: return [];
        }
    };

    const currentQuestions = getCurrentQuestions();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const totalQuestions = aiPractice.length + adminPractice.length + testQuestions.length;

    if (totalQuestions === 0) {
        return (
            <div className="text-center py-12">
                <BookIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No Assigned Questions Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    Your instructor hasn't assigned any questions yet. Check back later!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">My Assigned Questions</h1>
                <p className="text-blue-100">Complete your assignments to track your progress</p>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <BookIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{progress.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{progress.completed}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{progress.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{progress.progress}%</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
                            <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                                <div
                                    className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'ai'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            🤖 AI Practice ({aiPractice.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('practice')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'practice'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            📝 Practice Questions ({adminPractice.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('test')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'test'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            🎯 Tests ({testQuestions.length})
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-3">
                    {currentQuestions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600 dark:text-slate-400">
                                {activeTab === 'ai' && 'No AI practice questions yet.'}
                                {activeTab === 'practice' && 'No practice questions assigned yet.'}
                                {activeTab === 'test' && 'No tests assigned yet.'}
                            </p>
                        </div>
                    ) : (
                        currentQuestions.map((question) => (
                            <div
                                key={question.id}
                                className={`p-4 rounded-xl border transition-all ${question.completed
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                    : isOverdue(question.dueDate)
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {question.completed ? (
                                                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                                            )}
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {question.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm ml-7">
                                            <span className={`px-2 py-1 rounded-md font-medium ${getDifficultyColor(question.difficulty)}`}>
                                                {question.difficulty}
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-400">{question.domain}</span>
                                            {question.dueDate && (
                                                <span className={`flex items-center gap-1 ${isOverdue(question.dueDate) && !question.completed
                                                    ? 'text-red-600 dark:text-red-400 font-medium'
                                                    : 'text-slate-500 dark:text-slate-500'
                                                    }`}>
                                                    <ClockIcon className="w-4 h-4" />
                                                    Due: {formatDate(question.dueDate)}
                                                    {isOverdue(question.dueDate) && !question.completed && ' (Overdue)'}
                                                </span>
                                            )}
                                        </div>

                                        {question.completed && question.completedAt && (
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-2 ml-7">
                                                ✓ Completed on {formatDate(question.completedAt)}
                                            </p>
                                        )}
                                    </div>

                                    {!question.completed && (
                                        <button
                                            onClick={() => onStartQuestion(question)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <PlayIcon className="w-4 h-4" />
                                            Start
                                        </button>
                                    )}
                                </div>
                            </div>
                        )))}
                </div>
            </div>
        </div>
    );
};

export default StudentAssignedQuestions;

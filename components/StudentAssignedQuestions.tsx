/**
 * Student Assigned Questions Component
 * Displays questions assigned by administrators
 */
import React, { useState, useEffect } from 'react';
import { BookIcon, CheckCircleIcon, ClockIcon, PlayIcon } from './icons';
import AIQuestionGenerator from './AIQuestionGenerator';

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
    const [showGenerator, setShowGenerator] = useState(false);

    const API_URL = 'http://localhost:3001';

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

    useEffect(() => {
        fetchAssignedQuestions();
        fetchProgress();
    }, [userEmail]);

    const isOverdue = (dueDate: string | null): boolean => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString: string): string => {
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

    const renderQuestionCard = (question: AssignedQuestion) => (
        <div
            key={question.id}
            className={`p-4 rounded-xl border transition-all ${question.completed
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : isOverdue(question.dueDate)
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-start gap-3">
                        {question.completed ? (
                            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                        ) : (
                            <BookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                {question.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className={`px-2 py-1 rounded-lg font-medium ${question.difficulty === 'Easy'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : question.difficulty === 'Medium'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
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
                    </div>

                    {!question.completed && (
                        <button
                            onClick={() => onStartQuestion(question)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mt-3 ml-9"
                        >
                            <PlayIcon className="w-4 h-4" />
                            Start
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-2">My Assigned Questions</h2>
                <p className="text-blue-100">Track your progress and complete assigned questions</p>
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Questions</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{progress.total}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completed</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{progress.completed}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pending</div>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{progress.pending}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Progress</div>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{progress.progress}%</div>
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

                <div className="p-6">
                    {/* AI Practice Tab */}
                    {activeTab === 'ai' && (
                        <div className="space-y-4">
                            {!showGenerator && (
                                <button
                                    onClick={() => setShowGenerator(true)}
                                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>✨</span>
                                    Generate AI Question
                                </button>
                            )}

                            {showGenerator && (
                                <div className="space-y-4">
                                    <AIQuestionGenerator
                                        userEmail={userEmail}
                                        onQuestionGenerated={() => {
                                            setShowGenerator(false);
                                            fetchAssignedQuestions();
                                            fetchProgress();
                                        }}
                                    />
                                    <button
                                        onClick={() => setShowGenerator(false)}
                                        className="w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {!showGenerator && (
                                <div className="space-y-3">
                                    {currentQuestions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-slate-600 dark:text-slate-400">
                                                No AI practice questions yet. Generate your first question above!
                                            </p>
                                        </div>
                                    ) : (
                                        currentQuestions.map(renderQuestionCard)
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Practice Questions Tab */}
                    {activeTab === 'practice' && (
                        <div className="space-y-3">
                            {currentQuestions.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-600 dark:text-slate-400">
                                        No practice questions assigned yet.
                                    </p>
                                </div>
                            ) : (
                                currentQuestions.map(renderQuestionCard)
                            )}
                        </div>
                    )}

                    {/* Tests Tab */}
                    {activeTab === 'test' && (
                        <div className="space-y-3">
                            {currentQuestions.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-600 dark:text-slate-400">
                                        No tests assigned yet.
                                    </p>
                                </div>
                            ) : (
                                currentQuestions.map(renderQuestionCard)
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAssignedQuestions;

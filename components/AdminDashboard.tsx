import React, { useState, useEffect } from 'react';
import { BookIcon, UserIcon, CheckCircleIcon, ClockIcon } from './icons';
import AdminAIQuestionGenerator from './AdminAIQuestionGenerator';
interface Question {
    id: string;
    title: string;
    difficulty: string;
    domain: string;
    _count?: {
        attempts: number;
        question_assignments: number;
    };
}
interface Student {
    email: string;
    name: string;
    assignedQuestions: number;
    completedQuestions: number;
    progress: number;
}
interface AdminDashboardProps {
    userEmail: string;
}
const AdminDashboard: React.FC<AdminDashboardProps> = ({ userEmail }) => {
    const [activeTab, setActiveTab] = useState<'questions' | 'students'>('questions');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignmentType, setAssignmentType] = useState<'practice' | 'test'>('practice');
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const API_URL = 'http://localhost:3001';
    useEffect(() => {
        fetchQuestions();
        fetchStudents();
    }, []);
    const fetchQuestions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/questions`, {
                headers: {
                    'x-user-email': userEmail,
                    'x-user-role': 'admin'
                }
            });
            const data = await response.json();
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };
    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/students`, {
                headers: {
                    'x-user-email': userEmail,
                    'x-user-role': 'admin'
                }
            });
            const data = await response.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };
    const handleAssignQuestion = async () => {
        if (!selectedQuestion || !selectedStudent) {
            alert('Please select both a question and a student');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/admin/assign-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail,
                    'x-user-role': 'admin'
                },
                body: JSON.stringify({
                    questionId: selectedQuestion,
                    studentEmail: selectedStudent,
                    assignmentType: assignmentType,
                    source: 'admin'
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Question assigned successfully!');
                setShowAssignModal(false);
                setSelectedQuestion(null);
                setSelectedStudent(null);
                fetchStudents();
            } else {
                alert('Failed to assign question: ' + data.error);
            }
        } catch (error) {
            console.error('Error assigning question:', error);
            alert('Failed to assign question');
        }
    };
    const filteredQuestions = questions.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
            case 'hard': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            {}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-indigo-100">Manage questions and student assignments</p>
            </div>
            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <BookIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Questions</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{questions.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Students</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Assignments</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {students.reduce((sum, s) => sum + s.assignedQuestions, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'questions'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <BookIcon className="w-5 h-5 inline mr-2" />
                            Question Library
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'students'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <UserIcon className="w-5 h-5 inline mr-2" />
                            Students
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {activeTab === 'questions' ? (
                        <div className="space-y-4">
                            {}
                            {!showAIGenerator && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="🔍 AI Search: Try 'sorting algorithms' or 'medium difficulty DSA questions'..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors text-lg"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                            {}
                            {!showAIGenerator && (
                                <button
                                    onClick={() => setShowAIGenerator(true)}
                                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>➕</span>
                                    Generate New Question with AI
                                </button>
                            )}
                            {}
                            {showAIGenerator && (
                                <div className="space-y-4">
                                    <AdminAIQuestionGenerator
                                        onQuestionGenerated={() => {
                                            setShowAIGenerator(false);
                                            fetchQuestions();
                                        }}
                                    />
                                    <button
                                        onClick={() => setShowAIGenerator(false)}
                                        className="w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {}
                            {!showAIGenerator && (
                                <div className="space-y-3">
                                    {filteredQuestions.map((question) => (
                                        <div
                                            key={question.id}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                                    {question.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className={`px-2 py-1 rounded-md font-medium ${getDifficultyColor(question.difficulty)}`}>
                                                        {question.difficulty}
                                                    </span>
                                                    <span className="text-slate-600 dark:text-slate-400">{question.domain}</span>
                                                    {question._count && (
                                                        <span className="text-slate-500 dark:text-slate-500">
                                                            {question._count.question_assignments} assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedQuestion(question.id);
                                                        setAssignmentType('practice');
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                                >
                                                    📝 Add Practice
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedQuestion(question.id);
                                                        setAssignmentType('test');
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                                >
                                                    🎯 Add Test
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div
                                    key={student.email}
                                    className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{student.name}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{student.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
                                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{student.progress}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                                            {student.completedQuestions}/{student.assignedQuestions} completed
                                        </span>
                                    </div>
                                    <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ width: `${student.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Assign Question as {assignmentType === 'practice' ? '📝 Practice' : '🎯 Test'}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {assignmentType === 'practice'
                                ? 'This will be assigned as a practice question for the student.'
                                : 'This will be assigned as a test question for evaluation.'}
                        </p>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Student
                                </label>
                                <select
                                    value={selectedStudent || ''}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                                >
                                    <option value="">Choose a student...</option>
                                    {students.map((student) => (
                                        <option key={student.email} value={student.email}>
                                            {student.name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedQuestion(null);
                                    setSelectedStudent(null);
                                }}
                                className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignQuestion}
                                disabled={!selectedStudent}
                                className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import { BookIcon, CheckCircleIcon, ClockIcon, PlayIcon, AwardIcon, ZapIcon, BrainIcon } from './icons';
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
    const [generatingAI, setGeneratingAI] = useState(false);
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
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
    const autoGenerateAIQuestions = async () => {
        if (generatingAI) return;
        setGeneratingAI(true);
        try {
            const questionsToGenerate = 3;
            const difficulties = ['Easy', 'Medium', 'Hard'];
            const generatedQuestions: AssignedQuestion[] = [];
            for (let i = 0; i < questionsToGenerate; i++) {
                const generateResponse = await fetch(`${API_URL}/api/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        domain: 'Data Structures & Algorithms',
                        difficulty: difficulties[i],
                        type: 'Coding'
                    })
                });
                if (generateResponse.ok) {
                    const question = await generateResponse.json();
                    console.log('Generated question:', question);
                    const questionId = question.id || crypto.randomUUID();
                    console.log('Question ID:', questionId);
                    generatedQuestions.push({
                        id: questionId,
                        title: question.title,
                        difficulty: difficulties[i],
                        domain: 'Data Structures & Algorithms',
                        prompt: question.description,
                        description: question.description,
                        constraints: question.constraints || [],
                        examples: question.examples || [],
                        testCases: question.testCases || [],
                        hints: question.hints || [],
                        starterCode: question.starterCode || '',
                        assignmentId: `ai-${questionId}`,
                        assignedAt: new Date().toISOString(),
                        dueDate: null,
                        completed: false,
                        completedAt: null
                    } as any);
                }
            }
            setAiPractice(generatedQuestions);
        } catch (error) {
            console.error('Error auto-generating questions:', error);
        } finally {
            setGeneratingAI(false);
        }
    };
    useEffect(() => {
        fetchAssignedQuestions();
        fetchProgress();
    }, [userEmail]);
    useEffect(() => {
        if (activeTab === 'ai' && aiPractice.length === 0 && !generatingAI) {
            autoGenerateAIQuestions();
        }
    }, [activeTab, aiPractice.length]);
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
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    const renderQuestionCard = (question: AssignedQuestion) => (
        <div
            key={question.id}
            className={`edu-card-3d p-6 transition-all group ${question.completed
                ? 'bg-emerald-50/50 border-emerald-200'
                : isOverdue(question.dueDate)
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-white border-slate-200 hover:border-indigo-400'
                }`}
        >
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110 ${question.completed ? 'bg-emerald-500 text-white' :
                            isOverdue(question.dueDate) ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
                            }`}>
                            {question.completed ? <CheckCircleIcon className="w-8 h-8" /> : <BookIcon className="w-8 h-8" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${question.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                                    question.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                    {question.difficulty}
                                </span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{question.domain}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 font-heading group-hover:text-indigo-600 transition-colors">
                                {question.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                                {question.dueDate && (
                                    <span className={`flex items-center gap-2 ${isOverdue(question.dueDate) && !question.completed
                                        ? 'text-rose-600 bg-rose-50 px-3 py-1 rounded-full'
                                        : 'text-slate-400'
                                        }`}>
                                        <ClockIcon className="w-4 h-4" />
                                        {isOverdue(question.dueDate) && !question.completed ? 'Overdue: ' : 'Due: '}
                                        {formatDate(question.dueDate)}
                                    </span>
                                )}
                                {question.completed && question.completedAt && (
                                    <span className="text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Completed {formatDate(question.completedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {!question.completed && (
                    <button
                        onClick={() => onStartQuestion(question)}
                        className="btn-edu btn-edu-primary shadow-indigo-200"
                    >
                        <PlayIcon className="w-5 h-5" />
                        Start
                    </button>
                )}
                {question.completed && (
                    <button
                        onClick={() => onStartQuestion(question)}
                        className="btn-edu btn-edu-secondary"
                    >
                        Review
                    </button>
                )}
            </div>
        </div>
    );
    return (
        <div className="space-y-10">
            {}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Tasks', value: progress.total, icon: <BookIcon />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Completed', value: progress.completed, icon: <CheckCircleIcon />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending', value: progress.pending, icon: <ClockIcon />, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Accuracy', value: `${progress.progress}%`, icon: <AwardIcon />, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="edu-card-3d p-6 flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                            {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-8 h-8' })}
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 font-heading">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            {}
            <div className="edu-card-3d overflow-hidden">
                <div className="border-b-2 border-slate-50 flex bg-slate-50/30">
                    {[
                        { id: 'practice', label: 'Practice Questions', icon: <BookIcon />, count: adminPractice.length },
                        { id: 'ai', label: 'AI Challenges', icon: <BrainIcon />, count: aiPractice.length },
                        { id: 'test', label: 'Assessments', icon: <AwardIcon />, count: testQuestions.length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-3 px-8 py-6 font-black text-sm uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                ? 'text-indigo-600 bg-white'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {React.cloneElement(tab.icon as React.ReactElement, { className: 'w-5 h-5' })}
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {tab.count}
                            </span>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600"></div>}
                        </button>
                    ))}
                </div>
                <div className="p-8">
                    {activeTab === 'ai' && (
                        <div className="mb-8">
                            {generatingAI ? (
                                <div className="w-full p-12 rounded-[32px] bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl animate-pulse"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-full border-4 border-white/30 border-t-white animate-spin mb-6"></div>
                                        <h3 className="text-3xl font-black mb-2 font-heading">Generating AI Challenges...</h3>
                                        <p className="text-indigo-100 font-medium">Creating 3 personalized questions for you</p>
                                    </div>
                                </div>
                            ) : !showGenerator ? (
                                <button
                                    onClick={() => setShowGenerator(true)}
                                    className="w-full group p-6 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-all hover:shadow-xl hover:shadow-indigo-500/30 relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        <ZapIcon className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                                        <span className="text-lg font-black">Generate More Challenges</span>
                                    </div>
                                </button>
                            ) : (
                                <div className="edu-card-3d p-8 bg-indigo-50/50 border-indigo-200">
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
                                        className="w-full mt-6 py-3 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        Back to Challenges
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-6">
                        {currentQuestions.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookIcon className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400 font-heading">Empty Path</h3>
                                <p className="text-slate-400 font-medium">No tasks found in this category.</p>
                            </div>
                        ) : (
                            currentQuestions.map(renderQuestionCard)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default StudentAssignedQuestions;
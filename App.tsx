/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import {
  AppView,
  Attempt,
  Difficulty,
  Domain,
  Evaluation,
  Question,
  QuestionType,
  UserStats
} from './types';
import { evaluateAttempt, generateQuestion } from './services/geminiService';
import { LoadingIndicator } from './components/LoadingIndicator';
import QuestionConfigurator from './components/PromptForm';
import EvaluationDisplay from './components/VideoResult';
import { AdminCodeModal } from './components/AdminCodeModal';
import AdminDashboard from './components/AdminDashboard';
import StudentAssignedQuestions from './components/StudentAssignedQuestions';
import Profile from './components/Profile';
import StudentProgressDashboard from './components/StudentProgressDashboard';
import Leaderboard from './components/Leaderboard';
import AdminAIQuestionsPanel from './components/AdminAIQuestionsPanel';
import {
  AwardIcon,
  BookIcon,
  CodeIcon,
  DashboardIcon,
  HistoryIcon,
  HomeIcon,
  LightbulbIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  PlayIcon,
  SunIcon,
  UserIcon,
  XIcon,
  ZapIcon,
  ActivityIcon,
  BrainIcon,
  ClockIcon
} from './components/icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'admin'>('student');

  // Admin Code Modal State
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false);

  // App State
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);

  const AUTH_BACKEND_URL = import.meta.env.VITE_AUTH_BACKEND_URL || 'http://localhost:3002';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authenticated = urlParams.get('authenticated');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('message');
    const existingRole = urlParams.get('existingRole');

    if (error) {
      console.error('OAuth error:', error);

      if (error === 'role_mismatch') {
        // Show specific role mismatch message
        alert(
          `❌ Account Role Mismatch\n\n` +
          `${decodeURIComponent(errorMessage || 'This account is registered with a different role.')}\n\n` +
          `Your account is registered as: ${existingRole}\n\n` +
          `Please use the correct login button for your account type.`
        );
      } else {
        alert(`Authentication failed: ${error}`);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (authenticated === 'true' && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
        setUserId(user.id || null);
        setUserRole(user.role || 'student');

        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('userRole', user.role || 'student');
        // Set cookie for server-side authentication
        document.cookie = `userEmail=${encodeURIComponent(user.email || '')};path=/;max-age=2592000;SameSite=Lax`;

        window.history.replaceState({}, document.title, window.location.pathname);

        if (user.needsAdminCode && user.role === 'admin') {
          setShowAdminCodeModal(true);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          setCurrentView(AppView.DASHBOARD);
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
      return;
    }

    const savedUser = localStorage.getItem('userData');
    const savedRole = localStorage.getItem('userRole');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
        setUserId(user.id || null);
        setUserRole((savedRole as 'student' | 'admin') || user.role || 'student');
        setIsAuthenticated(true);
        // Set cookie for server-side authentication
        document.cookie = `userEmail=${encodeURIComponent(user.email || '')};path=/;max-age=2592000;SameSite=Lax`;
      } catch (e) {
        console.error('Failed to parse saved user data:', e);
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
      }
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('interview_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error('Failed to load history', e); }
    }
  }, []);

  const saveHistory = (newHistory: Attempt[]) => {
    setHistory(newHistory);
    localStorage.setItem('interview_history', JSON.stringify(newHistory));
  };


  const handleGenerate = async (domain: Domain, difficulty: Difficulty, type: QuestionType) => {
    setIsLoading(true);
    try {
      const question = await generateQuestion(domain, difficulty, type);
      setCurrentQuestion(question);
      setUserAnswer(question.codeStarter || '');
      setCurrentEvaluation(null);
      setCurrentView(AppView.ATTEMPT);
    } catch (error) {
      console.error(error);
      const msg = (error as any)?.message as string | undefined;
      alert(msg && msg.includes('Missing Gemini API key') ? msg : 'Failed to generate question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!currentQuestion) return;
    setIsLoading(true);
    try {
      // Call backend for evaluation
      const mainBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${mainBackendUrl}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''  // Fixed: use userEmail instead of userId
        },
        credentials: 'include',
        body: JSON.stringify({
          question: currentQuestion,
          userAnswer: userAnswer,
          testCases: currentQuestion.testCases || []
        })
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const evaluation = await response.json();
      setCurrentEvaluation(evaluation);

      // Store attemptId from backend response if available
      if (evaluation.attemptId) {
        setCurrentAttemptId(evaluation.attemptId);
      }

      const attempt: Attempt = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        question: currentQuestion,
        userAnswer,
        evaluation,
        timeSpentSeconds: 0
      };

      saveHistory([attempt, ...history]);

      setCurrentView(AppView.RESULT);
    } catch (error) {
      console.error(error);
      const msg = (error as any)?.message as string | undefined;
      alert(msg && msg.includes('Missing Gemini API key') ? msg : 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setCurrentView(AppView.ATTEMPT);
    setCurrentEvaluation(null);
  };

  const handleNewSession = () => {
    setCurrentQuestion(null);
    setCurrentView(AppView.GENERATE);
  };

  // --- Views ---

  const renderSidebar = () => (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 sidebar-edu transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-xl lg:shadow-none
      `}>
        <div className="p-8 flex items-center justify-between border-b-2 border-slate-50">
          <div className="flex items-center gap-3 font-bold text-2xl text-gradient-edu">
            <ZapIcon className="w-8 h-8 text-indigo-600 fill-indigo-600/20" />
            <span className="font-heading">EduCoach AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>


        <nav className="px-6 space-y-3 mt-8">
          {[
            { id: AppView.DASHBOARD, label: 'Learning Path', icon: DashboardIcon, roles: ['student', 'admin'] },
            { id: AppView.GENERATE, label: 'Free Practice', icon: BrainIcon, roles: ['student'] },
            { id: AppView.PROGRESS, label: 'My Progress', icon: ZapIcon, roles: ['student'] },
            { id: AppView.LEADERBOARD, label: 'Leaderboard', icon: AwardIcon, roles: ['student', 'admin'] },
            { id: AppView.AI_QUESTIONS, label: 'AI Questions', icon: LightbulbIcon, roles: ['admin'] },
            { id: AppView.PROFILE, label: 'Scholar Profile', icon: UserIcon, roles: ['student', 'admin'] },
          ]
            .filter(item => item.roles.includes(userRole))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`nav-item-edu w-full flex items-center gap-4 ${currentView === item.id ? 'active' : ''}`}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-8 border-t-2 border-slate-50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 transform hover:rotate-6 transition-transform">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900 leading-none mb-1">{userName}</p>
                <p className="text-indigo-600 text-xs font-semibold px-2 py-0.5 bg-indigo-50 rounded-full inline-block">Level 1 Scholar</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all border border-slate-200 flex items-center justify-center"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={async () => {
                localStorage.removeItem('userData');
                localStorage.removeItem('userRole');
                // Clear cookie
                document.cookie = 'userEmail=;path=/;max-age=0';
                setIsAuthenticated(false);
                setUserName('User');
                setUserEmail('');
                setUserId(null);
                setCurrentView(AppView.LANDING);
              }}
              className="flex-[2] flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all font-bold text-sm"
            >
              <LogoutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  const renderLanding = () => (
    <div className="min-h-screen bg-edu-mesh flex flex-col">
      <header className="py-8 px-8 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3 font-bold text-3xl text-gradient-edu">
          <ZapIcon className="w-10 h-10 text-indigo-600 fill-indigo-600/20" />
          <span className="font-heading tracking-tight">EduCoach AI</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-2xl glass-edu border border-slate-200 text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className="btn-edu btn-edu-primary shadow-xl"
            >
              Back to Learning
            </button>
          ) : (
            <button
              onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google`}
              className="btn-edu btn-edu-primary shadow-xl"
            >
              Start Free Today
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-12 relative z-10 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/80 border-2 border-indigo-100 text-indigo-700 font-bold text-sm mb-10 shadow-sm animate-bounce-gentle">
          <AwardIcon className="w-5 h-5 text-indigo-500" />
          <span>The #1 AI Tutor for Technical Interviews</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold text-slate-900 mb-10 tracking-tight max-w-5xl leading-[1.1] font-heading">
          Unlock Your Future with <span className="text-gradient-edu relative">
            Intelligent Practice
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-200" preserveAspectRatio="none" viewBox="0 0 100 10">
              <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
            </svg>
          </span>
        </h1>

        <p className="text-2xl text-slate-600 max-w-3xl mb-14 leading-relaxed font-light">
          Experience personalized learning with real-time AI mentoring. Perfect for students who want to master data structures and algorithms through guided practice.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mb-24">
          <button
            onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google?role=student`}
            className="px-10 py-5 bg-indigo-600 text-white text-xl font-black rounded-3xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
          >
            Join as a Student
            <PlayIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google?role=admin`}
            className="px-10 py-5 bg-white text-slate-900 text-xl font-black rounded-3xl border-2 border-slate-200 hover:border-indigo-600 transition-all flex items-center justify-center gap-4 shadow-xl transform hover:scale-105 active:scale-95"
          >
            I'm an Educator
            <UserIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="edu-grid max-w-6xl w-full text-left relative z-10 px-4">
          {[
            { icon: <BrainIcon className="w-8 h-8" />, color: "bg-indigo-500", title: "Adaptive AI Engine", desc: "Questions that evolve with your skill level, ensuring you're always challenged but never overwhelmed." },
            { icon: <ActivityIcon className="w-8 h-8" />, color: "bg-rose-500", title: "Visual Analytics", desc: "Deep insights into your problem-solving patterns with beautiful, easy-to-understand progress charts." },
            { icon: <LightbulbIcon className="w-8 h-8" />, color: "bg-emerald-500", title: "Contextual Hints", desc: "Never get stuck again. Our AI provides gentle nudges that help you discover the solution yourself." }
          ].map((f, i) => (
            <div key={i} className="edu-card-3d p-10 group" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`${f.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-current/20 group-hover:rotate-12 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-heading">{f.title}</h3>
              <p className="text-slate-600 text-lg leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-12 border-t border-slate-100 bg-white/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 font-bold text-2xl text-slate-400">
            <ZapIcon className="w-6 h-6" />
            <span>EduCoach AI</span>
          </div>
          <div className="flex gap-10 text-slate-500 font-semibold">
            <a href="#" className="hover:text-indigo-600 transition-colors">Curriculum</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Resources</a>
          </div>
          <p className="text-slate-400 text-sm">© 2025 EduCoach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );

  const renderDashboard = () => {
    if (userRole === 'admin') {
      return <AdminDashboard userEmail={userEmail} />;
    }

    return (
      <div className="space-y-12 animate-fade-in pb-12">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-[32px] p-12 text-white shadow-2xl shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-4 font-heading">Welcome back, {userName.split(' ')[0]}! 👋</h2>
            <p className="text-xl text-indigo-100 max-w-xl leading-relaxed mb-10">
              You've completed 85% of your weekly goal. Solve 2 more problems to hit your streak!
            </p>
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                <AwardIcon className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Current Streak</p>
                  <p className="text-2xl font-black">12 Days</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                <ZapIcon className="w-8 h-8 text-cyan-300" />
                <div>
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Experience</p>
                  <p className="text-2xl font-black">2,450 XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <StudentAssignedQuestions
          userEmail={userEmail}
          onStartQuestion={(question) => {
            setCurrentQuestion(question);
            setCurrentView(AppView.ATTEMPT);
          }}
        />
      </div>
    );
  };

  const renderAttempt = () => {
    if (!currentQuestion) return null;
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-8">
        {/* Left: Question Panel */}
        <div className="w-full md:w-5/12 edu-card-3d flex flex-col overflow-hidden shadow-2xl bg-white">
          <div className="p-8 border-b-2 border-slate-50 bg-slate-50/50">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest border-2 ${currentQuestion.difficulty === Difficulty.HARD ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  currentQuestion.difficulty === Difficulty.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-slate-500 text-sm font-bold bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{currentQuestion.domain}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm font-bold">45m limit</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 font-heading leading-tight">{currentQuestion.title}</h2>
          </div>

          <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookIcon className="w-6 h-6 text-indigo-600" />
                Problem Description
              </h3>
              <p className="whitespace-pre-wrap text-slate-600 text-lg leading-relaxed mb-10">{currentQuestion.description}</p>

              {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                <div className="mb-10">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ZapIcon className="w-5 h-5 text-amber-500" />
                    Constraints
                  </h4>
                  <ul className="grid grid-cols-1 gap-2">
                    {currentQuestion.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CodeIcon className="w-5 h-5 text-indigo-500" />
                    Interactive Examples
                  </h4>
                  <div className="space-y-4">
                    {currentQuestion.examples.map((example, i) => (
                      <div key={i} className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-hidden shadow-lg border border-slate-800">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                          <div className="w-3 h-3 rounded-full bg-indigo-500/20"></div>
                          <span className="text-indigo-400 font-bold">Example {i + 1}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex gap-4"><span className="text-slate-500 min-w-16">INPUT:</span> <span className="text-cyan-400">{example.input}</span></div>
                          <div className="flex gap-4"><span className="text-slate-500 min-w-16">OUTPUT:</span> <span className="text-emerald-400">{example.output}</span></div>
                          {example.explanation && (
                            <div className="mt-4 pt-4 border-t border-white/5 text-slate-400 italic">
                              <span className="text-purple-400 not-italic font-bold mr-2">LOGIC:</span> {example.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Cases Section */}
              {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CodeIcon className="w-5 h-5 text-emerald-500" />
                    Test Cases
                  </h4>
                  <div className="space-y-3">
                    {currentQuestion.testCases.map((testCase: any, i: number) => (
                      <div key={i} className="bg-slate-900 rounded-xl p-5 font-mono text-sm border border-slate-800">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
                          <span className="text-emerald-400 font-bold text-xs">Test Case {i + 1}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-4">
                            <span className="text-slate-500 min-w-20 font-bold">INPUT:</span>
                            <span className="text-cyan-400">{testCase.input}</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-slate-500 min-w-20 font-bold">OUTPUT:</span>
                            <span className="text-emerald-400">{testCase.expected || testCase.expectedOutput}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t-2 border-slate-50 bg-white">
            <details className="group bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <summary className="flex items-center justify-between cursor-pointer font-bold text-indigo-700 list-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <LightbulbIcon className="w-5 h-5" />
                  </div>
                  Need a Hint?
                </div>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-4 space-y-3 pl-11">
                {currentQuestion.hints?.map((hint, i) => (
                  <p key={i} className="text-indigo-600/80 italic font-medium relative py-2 border-l-2 border-indigo-200 pl-4">{hint}</p>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Right: Editor Panel */}
        <div className="w-full md:w-7/12 flex flex-col gap-6">
          <div className="flex-grow edu-card-3d shadow-2xl flex flex-col overflow-hidden bg-slate-900 border-slate-800 group focus-within:border-indigo-500/50 transition-colors">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="h-6 w-px bg-white/10 mx-2"></div>
                <span className="text-xs font-black text-indigo-300 tracking-widest uppercase">solution.js</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-xs font-bold border border-white/10">JavaScript v18</div>
            </div>
            <div className="flex-grow relative">
              <div className="absolute top-0 left-0 w-12 h-full bg-slate-800/30 border-r border-white/5 flex flex-col items-center py-6 text-slate-600 font-mono text-xs select-none">
                {Array.from({ length: 40 }).map((_, i) => <div key={i} className="h-6 leading-6">{i + 1}</div>)}
              </div>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full h-full pl-16 pr-8 py-6 bg-transparent text-indigo-50 font-mono text-[15px] resize-none focus:outline-none leading-6 caret-indigo-400"
                spellCheck="false"
                placeholder="/** 
 * Write your algorithm here.
 * The AI mentor will evaluate your logic and complexity.
 */"
              />
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-[24px] border-2 border-slate-50 shadow-lg">
            <div className="flex items-center gap-4 text-slate-400 px-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">JS</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold">AI</div>
              </div>
              <span className="text-sm font-bold">Auto-save enabled</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView(AppView.DASHBOARD)}
                className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSubmitAttempt}
                disabled={isLoading}
                className="btn-edu btn-edu-primary min-w-[200px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Mentoring...
                  </div>
                ) : (
                  <>
                    Submit Solution
                    <PlayIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && currentView === AppView.GENERATE) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <BrainIcon className="w-16 h-16 text-indigo-600 animate-float" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-heading">Generating Challenge</h2>
          <p className="text-slate-500 font-medium">Our AI is hand-crafting a problem for your skill level...</p>
        </div>
      );
    }
    if (isLoading && currentView === AppView.ATTEMPT) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
            <ActivityIcon className="w-16 h-16 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-heading">Analyzing Solution</h2>
          <p className="text-slate-500 font-medium">Your AI mentor is reviewing your code logic...</p>
        </div>
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD: return renderDashboard();
      case AppView.GENERATE: return (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-slate-900 mb-3 font-heading">Custom Practice</h2>
              <p className="text-lg text-slate-500 font-medium">Configure your session to focus on specific domains</p>
            </div>
            <QuestionConfigurator onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
        </div>
      );
      case AppView.ATTEMPT: return renderAttempt();
      case AppView.RESULT: return currentEvaluation && currentQuestion ? (
        <div className="py-4">
          <EvaluationDisplay
            evaluation={currentEvaluation}
            question={currentQuestion}
            onRetry={handleRetry}
            onNew={handleNewSession}
            userEmail={userEmail}
            attemptId={currentAttemptId || undefined}
          />
        </div>
      ) : null;
      case AppView.HISTORY: return renderDashboard();
      case AppView.PROGRESS: return <StudentProgressDashboard userEmail={userEmail} />;
      case AppView.LEADERBOARD: return <Leaderboard />;
      case AppView.AI_QUESTIONS: return <AdminAIQuestionsPanel />;
      case AppView.PROFILE: return <Profile userEmail={userEmail} userName={userName} userRole={userRole} />;
      default: return renderDashboard();
    }
  };

  return (
    <>
      <AdminCodeModal
        isOpen={showAdminCodeModal}
        userEmail={userEmail}
        userName={userName}
        onClose={() => {
          setShowAdminCodeModal(false);
          setIsAuthenticated(false);
          localStorage.removeItem('userData');
          localStorage.removeItem('userRole');
        }}
        onSuccess={() => {
          setShowAdminCodeModal(false);
          setIsAuthenticated(true);
          setUserRole('admin');
          setCurrentView(AppView.DASHBOARD);
        }}
      />

      {!isAuthenticated && currentView === AppView.LANDING ? (
        renderLanding()
      ) : !isAuthenticated ? (
        <div className="min-h-screen bg-edu-mesh flex items-center justify-center p-6">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-left hidden md:block">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-500/40">
                <ZapIcon className="w-10 h-10" />
              </div>
              <h1 className="text-5xl font-black text-slate-900 mb-6 font-heading leading-tight">Your AI Mentor <br /><span className="text-indigo-600">Awaits.</span></h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">Join thousands of students mastering their craft with EduCoach AI.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-700 font-bold">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">✓</div>
                  Personalized Learning Paths
                </div>
                <div className="flex items-center gap-4 text-slate-700 font-bold">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">✓</div>
                  Real-time AI Feedback
                </div>
              </div>
            </div>

            <div className="edu-card-3d p-10 bg-white/80 backdrop-blur-md">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-2 font-heading">Start Learning</h2>
                <p className="text-slate-500 font-medium">Welcome to the future of education</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google?role=student`}
                  className="w-full group flex items-center gap-4 p-6 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                >
                  <div className="w-14 h-14 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <BookIcon className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-lg">Continue as Student</p>
                    <p className="text-sm text-slate-500 font-medium">Practice & track progress</p>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google?role=admin`}
                  className="w-full group flex items-center gap-4 p-6 rounded-2xl bg-white border-2 border-slate-100 hover:border-purple-600 hover:bg-purple-50 transition-all shadow-sm"
                >
                  <div className="w-14 h-14 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-lg">Continue as Educator</p>
                    <p className="text-sm text-slate-500 font-medium">Manage & assign tasks</p>
                  </div>
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-400 font-bold">Secure Google Authentication</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 transition-colors duration-300 flex">
          {renderSidebar()}

          <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b-2 border-slate-50 px-8 py-6 flex justify-between items-center lg:hidden shadow-sm">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <MenuIcon className="w-7 h-7" />
              </button>
              <div className="flex items-center gap-2 font-black text-xl text-indigo-600 font-heading">
                <ZapIcon className="w-6 h-6 fill-current" />
                <span>EduCoach</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md"></div>
            </header>

            <main className="flex-grow p-8 lg:p-12 overflow-auto max-w-7xl mx-auto w-full">
              {renderContent()}
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default App;

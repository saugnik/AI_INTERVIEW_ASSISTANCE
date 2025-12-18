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
import LoadingIndicator from './components/LoadingIndicator';
import QuestionConfigurator from './components/PromptForm';
import EvaluationDisplay from './components/VideoResult';
import AdminCodeModal from './components/AdminCodeModal';
import AdminDashboard from './components/AdminDashboard';
import StudentAssignedQuestions from './components/StudentAssignedQuestions';
import Profile from './components/Profile';
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
  ZapIcon
} from './components/icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [darkMode, setDarkMode] = useState(true);
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

  // Auth backend URL - configurable via env or default
  const AUTH_BACKEND_URL = import.meta.env.VITE_AUTH_BACKEND_URL || 'http://localhost:3002';

  // Check authentication status on mount and handle OAuth callback
  useEffect(() => {
    // First, check for OAuth callback in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const authenticated = urlParams.get('authenticated');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      alert(`Authentication failed: ${error}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (authenticated === 'true' && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('🔐 OAuth callback received:', { role: user.role, needsAdminCode: user.needsAdminCode, email: user.email });

        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
        setUserId(user.id || null);
        setUserRole(user.role || 'student');

        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('userRole', user.role || 'student');

        window.history.replaceState({}, document.title, window.location.pathname);

        if (user.needsAdminCode && user.role === 'admin') {
          console.log('✅ Showing admin code modal for:', user.email);
          setShowAdminCodeModal(true);
          setIsAuthenticated(false);
        } else {
          console.log('✅ Direct authentication for student or verified admin');
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
      const evaluation = await evaluateAttempt(currentQuestion, userAnswer);
      setCurrentEvaluation(evaluation);

      const attempt: Attempt = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        question: currentQuestion,
        userAnswer,
        evaluation,
        timeSpentSeconds: 0
      };

      // Save to local history
      saveHistory([attempt, ...history]);

      // Save to database if user is authenticated (optional - backend may not have this endpoint)
      if (isAuthenticated && userId && currentQuestion.id) {
        try {
          // Try to save to main backend if available
          const mainBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          await fetch(`${mainBackendUrl}/api/attempts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              questionId: currentQuestion.id,
              language: 'javascript',
              submission: userAnswer,
              score: evaluation.score,
              feedback: {
                feedback: evaluation.feedback,
                strengths: evaluation.strengths,
                improvements: evaluation.improvements
              }
            })
          });
          console.log('✅ Attempt saved to database');
        } catch (dbError) {
          console.error('Failed to save to database:', dbError);
          // Continue anyway - local history is saved
        }
      }

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


  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color} bg-opacity-20`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );

  // --- Views ---

  const renderSidebar = () => (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 sidebar-edu transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b-2 border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <ZapIcon className="w-6 h-6 fill-current" />
            <span>InterviewAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <XIcon />
          </button>
        </div>


        <nav className="px-4 space-y-2 mt-4">
          {[
            { id: AppView.DASHBOARD, label: 'Dashboard', icon: DashboardIcon, roles: ['student', 'admin'] },
            { id: AppView.GENERATE, label: 'Practice', icon: CodeIcon, roles: ['student'] },
            { id: AppView.HISTORY, label: 'History', icon: HistoryIcon, roles: ['student'] },
            { id: AppView.PROFILE, label: 'Profile', icon: UserIcon, roles: ['student', 'admin'] },
          ]
            .filter(item => item.roles.includes(userRole))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`nav-item-edu w-full flex items-center gap-3 ${currentView === item.id ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t-2 border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900">{userName}</p>
                <p className="text-slate-500 text-xs">{userEmail || 'Free Plan'}</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={async () => {
              try {
                // Clear local storage
                localStorage.removeItem('userData');
                localStorage.removeItem('userRole');
                setIsAuthenticated(false);
                setUserName('User');
                setUserEmail('');
                setUserId(null);
                setCurrentView(AppView.LANDING);
              } catch (error) {
                console.error('Logout failed:', error);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 transition-all font-medium transform hover:scale-105 active:scale-95"
          >
            <LogoutIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );

  const renderLanding = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-2xl text-blue-600">
          <ZapIcon className="w-8 h-8 fill-current" />
          <span>InterviewAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className="btn-edu-primary"
            >
              Start Learning
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-8 animate-bounce-gentle border-2 border-blue-200">
          <AwardIcon className="w-4 h-4" />
          <span>Trusted by 10,000+ Students</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight max-w-4xl leading-tight animate-fade-in-up">
          Master Technical Interviews with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI-Powered Practice</span>
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
          Practice coding questions, get instant AI feedback, and track your progress. Perfect for students preparing for tech interviews!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button
            onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google`}
            className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-blue-400 text-slate-900 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
          {[
            { icon: <CodeIcon className="w-6 h-6" />, color: "icon-container-blue", title: "Smart Practice", desc: "AI-generated questions tailored to your skill level and learning goals." },
            { icon: <PlayIcon className="w-6 h-6" />, color: "icon-container-purple", title: "Instant Feedback", desc: "Get detailed explanations and suggestions to improve your solutions." },
            { icon: <BookIcon className="w-6 h-6" />, color: "icon-container-green", title: "Track Progress", desc: "Monitor your improvement with detailed analytics and insights." }
          ].map((f, i) => (
            <div key={i} className="feature-card-edu animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`icon-container-edu ${f.color} mb-6`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  const renderDashboard = () => {
    // Show admin dashboard for admins
    if (userRole === 'admin') {
      return <AdminDashboard userEmail={userEmail} />;
    }

    // Show student assigned questions for students
    return (
      <div className="space-y-8 animate-fade-in">
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
      <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6">
        {/* Left: Question Panel */}
        <div className="w-full md:w-1/3 glass-card flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge ${currentQuestion.difficulty === Difficulty.HARD ? 'badge-error' :
                currentQuestion.difficulty === Difficulty.MEDIUM ? 'badge-warning' : 'badge-success'
                }`}>
                {currentQuestion.difficulty}
              </span>
              <span className="text-slate-400 text-sm font-medium">{currentQuestion.domain}</span>
            </div>
            <h2 className="text-2xl font-bold gradient-text">{currentQuestion.title}</h2>
          </div>

          <div className="flex-grow p-6 overflow-y-auto prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold text-white">Description</h3>
            <p className="whitespace-pre-wrap text-slate-300">{currentQuestion.description}</p>

            {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
              <>
                <h4 className="font-bold mt-6 mb-2 text-white">Constraints</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {currentQuestion.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </>
            )}

            {currentQuestion.examples && currentQuestion.examples.length > 0 && (
              <>
                <h4 className="font-bold mt-6 mb-2 text-white">Examples</h4>
                {currentQuestion.examples.map((example, i) => (
                  <div key={i} className="mb-4 p-4 glass-card rounded-lg font-mono text-sm border border-indigo-500/30">
                    <div className="mb-2"><span className="text-indigo-400 font-semibold">Input:</span> <span className="text-cyan-300">{example.input}</span></div>
                    <div className="mb-2"><span className="text-indigo-400 font-semibold">Output:</span> <span className="text-green-300">{example.output}</span></div>
                    {example.explanation && (
                      <div className="mt-2 text-slate-400 text-xs border-t border-white/10 pt-2">
                        <span className="text-purple-400 font-semibold">Explanation:</span> {example.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer font-medium gradient-text hover:opacity-80 transition-opacity">
                <LightbulbIcon className="w-4 h-4" /> Show Hints
              </summary>
              <div className="mt-4 space-y-2 pl-4 border-l-2 border-gradient-to-b from-indigo-500 to-purple-500">
                {currentQuestion.hints?.map((hint, i) => (
                  <p key={i} className="text-sm text-slate-300 italic">{hint}</p>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Right: Editor Panel */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="flex-grow code-editor shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                </div>
                <span className="ml-2 text-xs font-mono text-indigo-300 font-semibold">solution.js</span>
              </div>
              <div className="badge badge-info text-xs">JavaScript</div>
            </div>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="flex-grow w-full p-6 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed"
              spellCheck="false"
              placeholder="// Start coding here...
// Your solution will be evaluated against test cases"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handleSubmitAttempt}
              disabled={isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 animate-pulse-glow"
            >
              {isLoading ? 'Evaluating...' : 'Submit Solution'}
              <PlayIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && currentView === AppView.GENERATE) {
      return <LoadingIndicator message="Creating your interview session..." />;
    }
    if (isLoading && currentView === AppView.ATTEMPT) {
      return <LoadingIndicator message="Evaluating your solution..." />;
    }

    switch (currentView) {
      case AppView.DASHBOARD: return renderDashboard();
      case AppView.GENERATE: return (
        <div className="flex items-center justify-center min-h-[80vh]">
          <QuestionConfigurator onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
      );
      case AppView.ATTEMPT: return renderAttempt();
      case AppView.RESULT: return currentEvaluation && currentQuestion ? (
        <div className="py-8">
          <EvaluationDisplay evaluation={currentEvaluation} question={currentQuestion} onRetry={handleRetry} onNew={handleNewSession} />
        </div>
      ) : null;
      case AppView.HISTORY: return renderDashboard(); // Fallback reuse for now
      case AppView.PROFILE: return <Profile userEmail={userEmail} userName={userName} userRole={userRole} />;
      default: return renderDashboard();
    }
  };

  // Main Render
  return (
    <>
      {/* Admin Code Modal - Rendered at root level */}
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

      {/* Show login page if not authenticated */}
      {!isAuthenticated ? (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full animate-fade-in">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
                  <CodeIcon className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  AI Interview Coach
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Master your technical interviews with AI precision
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 text-center">
                  Choose your role to continue
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Login */}
                  <button
                    onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google?role=student`}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <BookIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Student</h3>
                      </div>
                      <p className="text-blue-100 text-sm mb-4">
                        Practice coding questions and improve your interview skills
                      </p>
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>

                  {/* Administrator Login */}
                  <button
                    onClick={() => window.location.href = `${AUTH_BACKEND_URL}/auth/google?role=admin`}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Administrator</h3>
                      </div>
                      <p className="text-purple-100 text-sm mb-4">
                        Manage users, questions, and system settings
                      </p>
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google + Code
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/10 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                </div>
              </div>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Secure authentication powered by Google
              </p>
            </div>
          </div>
        </div>
      ) : currentView === AppView.LANDING ? (
        renderLanding()
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 transition-colors duration-300 flex">
          {renderSidebar()}

          <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b-2 border-slate-100 px-6 py-4 flex justify-between items-center lg:hidden shadow-sm">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-blue-600 transition-colors">
                <MenuIcon />
              </button>
              <span className="font-bold text-lg text-blue-600">InterviewAI</span>
              <div className="w-8"></div> {/* Spacer */}
            </header>

            <main className="flex-grow p-6 lg:p-8 overflow-auto">
              {renderContent()}
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default App;

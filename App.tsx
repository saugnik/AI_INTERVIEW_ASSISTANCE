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

  // App State
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);

  // Persist Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load History (Mock persistence)
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

  // --- Actions ---

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
            <ZapIcon className="w-6 h-6 fill-current" />
            <span>InterviewAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
            <XIcon />
          </button>
        </div>

        <nav className="px-4 space-y-2 mt-4">
          {[
            { id: AppView.DASHBOARD, label: 'Dashboard', icon: DashboardIcon },
            { id: AppView.GENERATE, label: 'Practice', icon: CodeIcon },
            { id: AppView.HISTORY, label: 'History', icon: HistoryIcon },
            { id: AppView.PROFILE, label: 'Profile', icon: UserIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${currentView === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                JD
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900 dark:text-white">John Doe</p>
                <p className="text-slate-500 dark:text-slate-500">Free Plan</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  const renderLanding = () => (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-2xl text-indigo-600 dark:text-indigo-400">
          <ZapIcon className="w-8 h-8 fill-current" />
          <span>InterviewAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all"
          >
            Start Practicing
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AwardIcon className="w-4 h-4" />
          <span>#1 AI Platform for Tech Interviews</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight max-w-4xl leading-tight">
          Master your technical interviews with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AI precision</span>.
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Generate realistic coding and system design questions, write code in our editor, and get instant, detailed feedback from our Gemini-powered evaluator.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button
            onClick={() => setCurrentView(AppView.GENERATE)}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-indigo-600/20 hover:shadow-2xl hover:-translate-y-1 transition-all"
          >
            Generate Question
          </button>
          <button
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-lg font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            View Dashboard
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
          {[
            { icon: <CodeIcon className="w-6 h-6 text-white" />, color: "bg-blue-500", title: "Smart Generation", desc: "Tailored questions based on difficulty, domain, and topics." },
            { icon: <PlayIcon className="w-6 h-6 text-white" />, color: "bg-purple-500", title: "Live Execution", desc: "Write and simulate code execution directly in the browser." },
            { icon: <BookIcon className="w-6 h-6 text-white" />, color: "bg-green-500", title: "Instant Feedback", desc: "Detailed analysis on complexity, edge cases, and best practices." }
          ].map((f, i) => (
            <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-6`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
              <p className="text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, John</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Here is your progress overview for this week.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Attempts" value={history.length} icon={<HistoryIcon className="w-6 h-6 text-blue-500" />} color="bg-blue-500 text-blue-500" />
        <StatCard title="Avg. Score" value={`${history.length ? Math.round(history.reduce((a, b) => a + (b.evaluation?.score || 0), 0) / history.length) : 0}%`} icon={<AwardIcon className="w-6 h-6 text-yellow-500" />} color="bg-yellow-500 text-yellow-500" />
        <StatCard title="Solved" value={history.filter(h => (h.evaluation?.score || 0) > 70).length} icon={<ZapIcon className="w-6 h-6 text-green-500" />} color="bg-green-500 text-green-500" />
        <StatCard title="Streak" value="3 Days" icon={<PlayIcon className="w-6 h-6 text-purple-500" />} color="bg-purple-500 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No questions attempted yet.</p>
              <button onClick={() => setCurrentView(AppView.GENERATE)} className="text-indigo-500 hover:underline mt-2">Start a session</button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${h.question.type === QuestionType.CODING ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                      {h.question.type === QuestionType.CODING ? <CodeIcon className="w-5 h-5" /> : <BookIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{h.question.title}</h4>
                      <p className="text-sm text-slate-500">{new Date(h.date).toLocaleDateString()} • {h.question.difficulty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${(h.evaluation?.score || 0) >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                      {h.evaluation?.score || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Areas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Suggested Topics</h3>
          <div className="space-y-4">
            {['Dynamic Programming', 'System Design', 'Graph Algorithms'].map((topic, i) => (
              <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{topic}</span>
                  <span className="text-xs font-semibold text-indigo-500">Medium Priority</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setCurrentView(AppView.GENERATE)} className="w-full mt-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Practice These Topics
          </button>
        </div>
      </div>
    </div>
  );

  const renderAttempt = () => {
    if (!currentQuestion) return null;
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6">
        {/* Left: Question Panel */}
        <div className="w-full md:w-1/3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-lg">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${currentQuestion.difficulty === Difficulty.HARD ? 'bg-red-100 text-red-700' :
                  currentQuestion.difficulty === Difficulty.MEDIUM ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                {currentQuestion.difficulty}
              </span>
              <span className="text-slate-500 text-sm font-medium">{currentQuestion.domain}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentQuestion.title}</h2>
          </div>

          <div className="flex-grow p-6 overflow-y-auto prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold">Description</h3>
            <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{currentQuestion.description}</p>

            {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
              <>
                <h4 className="font-bold mt-6 mb-2">Constraints</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  {currentQuestion.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </>
            )}

            {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
              <>
                <h4 className="font-bold mt-6 mb-2">Examples</h4>
                {currentQuestion.testCases.map((tc, i) => (
                  <div key={i} className="mb-4 p-4 bg-slate-100 dark:bg-slate-950 rounded-lg font-mono text-sm">
                    <div className="mb-2"><span className="text-slate-500">Input:</span> {tc.input}</div>
                    <div><span className="text-slate-500">Output:</span> {tc.expectedOutput}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                <LightbulbIcon className="w-4 h-4" /> Show Hints
              </summary>
              <div className="mt-4 space-y-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                {currentQuestion.hints?.map((hint, i) => (
                  <p key={i} className="text-sm text-slate-600 dark:text-slate-400 italic">{hint}</p>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Right: Editor Panel */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="flex-grow bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <span className="ml-4 text-xs font-mono text-slate-400">solution.js</span>
              </div>
              <div className="text-xs text-slate-500">JavaScript</div>
            </div>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="flex-grow w-full p-4 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none"
              spellCheck="false"
              placeholder="// Start coding here..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handleSubmitAttempt}
              disabled={isLoading}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
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
      default: return renderDashboard();
    }
  };

  // Main Render
  if (currentView === AppView.LANDING) {
    return renderLanding();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">
      {renderSidebar()}

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
            <MenuIcon />
          </button>
          <span className="font-bold text-lg text-slate-900 dark:text-white">InterviewAI</span>
          <div className="w-8"></div> {/* Spacer */}
        </header>

        <main className="flex-grow p-6 lg:p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;

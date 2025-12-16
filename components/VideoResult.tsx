
import React from 'react';
import { Evaluation, Question } from '../types';
import { AwardIcon, CheckCircleIcon, CodeIcon, RefreshIcon, XCircleIcon } from './icons';

interface EvaluationDisplayProps {
  evaluation: Evaluation;
  question: Question;
  onRetry: () => void;
  onNew: () => void;
}

const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({ evaluation, question, onRetry, onNew }) => {
  const isPassing = evaluation.score >= 70;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Score Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${isPassing ? 'bg-green-500' : 'bg-orange-500'}`}></div>

        <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-50 dark:bg-slate-800 mb-6">
          {isPassing ? (
            <AwardIcon className="w-12 h-12 text-green-500" />
          ) : (
            <RefreshIcon className="w-12 h-12 text-orange-500" />
          )}
        </div>

        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{evaluation.score}/100</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-6">
          {isPassing ? "Excellent work! You've mastered this concept." : "Good attempt. Here is how you can improve."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
          <div>
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4" /> Strengths
            </h3>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="block w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
              <XCircleIcon className="w-4 h-4" /> Improvements
            </h3>
            <ul className="space-y-2">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="block w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Detailed Feedback</h3>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {evaluation.feedback}
        </p>

        {evaluation.complexityAnalysis && (
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Complexity Analysis</h4>
            <p className="text-indigo-800 dark:text-indigo-200 text-sm font-mono">{evaluation.complexityAnalysis}</p>
          </div>
        )}
      </div>

      {/* Reference Solution */}
      {evaluation.referenceSolution && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
            <CodeIcon className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Reference Solution</h3>
          </div>
          <div className="p-0">
            <textarea
              readOnly
              value={evaluation.referenceSolution}
              className="w-full h-64 p-4 bg-slate-950 text-slate-300 font-mono text-sm resize-none focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 py-6">
        <button onClick={onRetry} className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-lg transition-colors">
          Retry Question
        </button>
        <button onClick={onNew} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20">
          Next Question
        </button>
      </div>
    </div>
  );
};

export default EvaluationDisplay;

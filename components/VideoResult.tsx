import React from 'react';
import { Evaluation, Question } from '../types';
import { AwardIcon, CheckCircleIcon, CodeIcon, RefreshIcon, XCircleIcon, BrainIcon, ZapIcon, ActivityIcon } from './icons';
import { VideoExplanation } from './VideoExplanation';

interface EvaluationDisplayProps {
  evaluation: Evaluation;
  question: Question;
  onRetry: () => void;
  onNew: () => void;
  userEmail?: string;
  attemptId?: string;
}

const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({ evaluation, question, onRetry, onNew, userEmail, attemptId }) => {
  const isPassing = evaluation.score >= 70;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-fade-in pb-12">
      {/* Performance Summary Card */}
      <div className="edu-card-3d p-10 bg-white relative overflow-hidden text-center">
        <div className={`absolute top-0 left-0 w-full h-3 ${isPassing ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-[32px] mb-8 shadow-2xl transform rotate-3 ${isPassing ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            {isPassing ? (
              <AwardIcon className="w-12 h-12" />
            ) : (
              <RefreshIcon className="w-12 h-12" />
            )}
          </div>

          <h2 className="text-6xl font-black text-slate-900 mb-2 font-heading tracking-tight">{evaluation.score}<span className="text-2xl text-slate-400">/100</span></h2>
          <p className="text-2xl font-bold text-slate-500 mb-10 font-heading">
            {isPassing ? "Master Level Achievement!" : "Great Effort, Scholar!"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-6 rounded-[32px] bg-emerald-50 border-2 border-emerald-100 group">
              <h3 className="font-black text-emerald-700 mb-4 flex items-center gap-3 font-heading uppercase tracking-widest text-xs">
                <CheckCircleIcon className="w-5 h-5" /> Your Strengths
              </h3>
              <ul className="space-y-3">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm font-bold text-emerald-800 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-[32px] bg-rose-50 border-2 border-rose-100">
              <h3 className="font-black text-rose-700 mb-4 flex items-center gap-3 font-heading uppercase tracking-widest text-xs">
                <ZapIcon className="w-5 h-5" /> Growth Areas
              </h3>
              <ul className="space-y-3">
                {evaluation.improvements.map((s, i) => (
                  <li key={i} className="text-sm font-bold text-rose-800 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0"></div>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Feedback Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 edu-card-3d p-10 bg-white">
          <h3 className="text-2xl font-black text-slate-900 mb-6 font-heading flex items-center gap-4">
            <BrainIcon className="w-8 h-8 text-indigo-600" />
            Mentor's Insights
          </h3>
          <div className="prose prose-indigo max-w-none">
            <p className="text-slate-600 text-lg leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 italic">
              "{evaluation.feedback}"
            </p>
          </div>

          {evaluation.complexityAnalysis && (
            <div className="mt-8 p-6 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <ActivityIcon className="w-6 h-6 text-indigo-200" />
                <h4 className="font-black uppercase tracking-widest text-xs font-heading">Efficiency Scorecard</h4>
              </div>
              <p className="text-indigo-50 font-mono text-sm leading-relaxed">{evaluation.complexityAnalysis}</p>
            </div>
          )}
        </div>

        {/* Reference Quick-view */}
        <div className="edu-card-3d p-8 bg-slate-900 text-white flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black font-heading flex items-center gap-3">
              <CodeIcon className="w-6 h-6 text-indigo-400" />
              Ideal Path
            </h3>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-indigo-300">JS Reference</span>
          </div>

          <div className="flex-grow bg-black/30 rounded-2xl p-4 font-mono text-xs overflow-auto border border-white/5 custom-scrollbar">
            <pre className="text-indigo-200/90 whitespace-pre-wrap leading-relaxed">
              {evaluation.referenceSolution || "// No reference solution available for this challenge."}
            </pre>
          </div>

          <button className="mt-6 w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10">
            Study Reference
          </button>
        </div>
      </div>

      {/* Video Explanation Section */}
      {attemptId && userEmail && question.id && (
        <VideoExplanation
          attemptId={attemptId}
          questionId={question.id}
          score={evaluation.score}
          userEmail={userEmail}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
        <button
          onClick={onRetry}
          className="px-10 py-5 rounded-[24px] bg-white border-2 border-slate-200 text-slate-600 text-lg font-black font-heading hover:border-indigo-600 transition-all shadow-xl active:scale-95"
        >
          Review & Retry
        </button>
        <button
          onClick={onNew}
          className="px-10 py-5 rounded-[24px] bg-indigo-600 text-white text-lg font-black font-heading hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-4 active:scale-95 transform hover:scale-105"
        >
          Begin Next Lesson
          <RefreshIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default EvaluationDisplay;

import React, { useState } from 'react';
import { Difficulty, Domain, QuestionType } from '../types';
import { BrainIcon, CodeIcon, ZapIcon, AwardIcon, BookIcon, ActivityIcon } from './icons';
interface PromptFormProps {
  onGenerate: (domain: Domain, difficulty: Difficulty, type: QuestionType) => void;
  isLoading: boolean;
}
const PromptForm: React.FC<PromptFormProps> = ({ onGenerate, isLoading }) => {
  const [domain, setDomain] = useState<Domain>(Domain.DSA);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [type, setType] = useState<QuestionType>(QuestionType.ALGORITHMIC);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(domain, difficulty, type);
  };
  return (
    <form onSubmit={handleSubmit} className="edu-card-3d p-10 bg-white">
      <div className="space-y-10">
        {}
        <section>
          <h3 className="text-xl font-black text-slate-900 mb-6 font-heading flex items-center gap-3">
            <BookIcon className="w-6 h-6 text-indigo-600" />
            1. Choose Your Subject
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: Domain.DSA, label: 'Data Structures', icon: <CodeIcon />, desc: 'Arrays, Lists, Trees & More' },
              { id: Domain.FRONTEND, label: 'Frontend Dev', icon: <ActivityIcon />, desc: 'React, CSS & Performance' },
              { id: Domain.BACKEND, label: 'Backend Systems', icon: <ZapIcon />, desc: 'APIs, DBs & Scalability' },
              { id: Domain.SYSTEM_DESIGN, label: 'System Design', icon: <BrainIcon />, desc: 'Architecture & Trade-offs' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDomain(item.id)}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                  domain === item.id
                  ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-50'
                  : 'bg-white border-slate-100 hover:border-indigo-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  domain === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {item.icon}
                </div>
                <div>
                  <p className={`font-black text-lg ${domain === item.id ? 'text-indigo-900' : 'text-slate-700'}`}>{item.label}</p>
                  <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
        {}
        <section>
          <h3 className="text-xl font-black text-slate-900 mb-6 font-heading flex items-center gap-3">
            <AwardIcon className="w-6 h-6 text-amber-500" />
            2. Set Your Challenge Level
          </h3>
          <div className="flex flex-wrap gap-4">
            {[
              { id: Difficulty.EASY, label: 'Apprentice', color: 'emerald' },
              { id: Difficulty.MEDIUM, label: 'Scholar', color: 'indigo' },
              { id: Difficulty.HARD, label: 'Master', color: 'rose' },
            ].map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setDifficulty(level.id)}
                className={`flex-1 min-w-[140px] py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all ${
                  difficulty === level.id
                  ? `bg-${level.color}-50 border-${level.color}-600 text-${level.color}-700 ring-4 ring-${level.color}-50`
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </section>
        {}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-edu btn-edu-primary py-6 text-xl shadow-indigo-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              Preparing Lesson...
            </div>
          ) : (
            <>
              Generate My Challenge
              <ZapIcon className="w-6 h-6 fill-current" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
export default PromptForm;
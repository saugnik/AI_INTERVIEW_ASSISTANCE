
import React, { useState } from 'react';
import { Difficulty, Domain, QuestionType } from '../types';
import { BrainIcon, CodeIcon, CpuIcon } from './icons';

interface ConfigFormProps {
  onGenerate: (domain: Domain, difficulty: Difficulty, type: QuestionType) => void;
  isLoading: boolean;
}

const QuestionConfigurator: React.FC<ConfigFormProps> = ({ onGenerate, isLoading }) => {
  const [domain, setDomain] = useState<Domain>(Domain.DSA);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [type, setType] = useState<QuestionType>(QuestionType.CODING);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(domain, difficulty, type);
  };

  const domainOptions = Object.values(Domain);
  const difficultyOptions = Object.values(Difficulty);
  const typeOptions = Object.values(QuestionType);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <BrainIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generate Question</h2>
          <p className="text-slate-500 dark:text-slate-400">Configure your mock interview session</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            >
              {domainOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDifficulty(opt)}
                  className={`px-2 py-3 text-sm font-medium rounded-xl transition-all border ${
                    difficulty === opt
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Question Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {typeOptions.map((opt) => {
               const Icon = opt === QuestionType.CODING ? CodeIcon : opt === QuestionType.SYSTEM_DESIGN ? CpuIcon : BrainIcon;
               return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setType(opt)}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    type === opt
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 text-indigo-700 dark:text-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${type === opt ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                  <span className="font-medium">{opt}</span>
                </button>
               );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Generating...' : 'Start Interview Session'}
        </button>
      </form>
    </div>
  );
};

export default QuestionConfigurator;

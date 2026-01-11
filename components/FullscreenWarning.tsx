import React from 'react';
import { XIcon, AwardIcon, AlertTriangleIcon } from './icons';

interface FullscreenWarningProps {
    isOpen: boolean;
    violationCount: number;
    onReturnToFullscreen: () => void;
    onEndAttempt?: () => void;
}

const FullscreenWarning: React.FC<FullscreenWarningProps> = ({
    isOpen,
    violationCount,
    onReturnToFullscreen,
    onEndAttempt
}) => {
    if (!isOpen) return null;

    const isSerious = violationCount >= 3;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative max-w-2xl w-full mx-4 bg-white rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                {/* Warning Header */}
                <div className={`p-8 ${isSerious ? 'bg-gradient-to-br from-rose-600 to-red-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'} text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                    <div className="relative z-10 flex items-start gap-6">
                        <div className={`w-20 h-20 rounded-2xl ${isSerious ? 'bg-rose-900/30' : 'bg-amber-900/30'} flex items-center justify-center flex-shrink-0 border-2 border-white/20`}>
                            <AlertTriangleIcon className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-4xl font-black mb-3 font-heading">
                                {isSerious ? '⚠️ Security Alert!' : '⚠️ Fullscreen Required'}
                            </h2>
                            <p className="text-lg text-white/90 font-medium">
                                {isSerious
                                    ? 'Multiple security violations detected. This attempt may be flagged for review.'
                                    : 'You have exited fullscreen mode during your assessment.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning Content */}
                <div className="p-8 space-y-6">
                    {/* Violation Counter */}
                    <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Security Violations</p>
                                <p className="text-3xl font-black text-slate-900 font-heading">{violationCount} {violationCount === 1 ? 'Violation' : 'Violations'}</p>
                            </div>
                            <div className={`w-16 h-16 rounded-2xl ${isSerious ? 'bg-rose-100' : 'bg-amber-100'} flex items-center justify-center`}>
                                <span className={`text-3xl font-black ${isSerious ? 'text-rose-600' : 'text-amber-600'}`}>{violationCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Academic Integrity Notice */}
                    <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-100">
                        <div className="flex items-start gap-4">
                            <AwardIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-black text-indigo-900 mb-2">Academic Integrity Policy</h3>
                                <p className="text-indigo-700 font-medium leading-relaxed">
                                    This assessment requires fullscreen mode to ensure a fair testing environment.
                                    All security violations are logged and may be reviewed by your instructor.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900 text-lg">Please note:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3 text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></span>
                                All attempts to exit fullscreen are being recorded
                            </li>
                            <li className="flex items-start gap-3 text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></span>
                                Tab switching and window changes are monitored
                            </li>
                            <li className="flex items-start gap-3 text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></span>
                                Multiple violations may result in automatic submission
                            </li>
                        </ul>
                    </div>

                    {isSerious && (
                        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6">
                            <p className="text-rose-800 font-bold text-center">
                                ⚠️ Warning: Additional violations may result in automatic submission and review by your instructor.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-8 border-t-2 border-slate-50 bg-slate-50/50 flex gap-4">
                    {onEndAttempt && isSerious && (
                        <button
                            onClick={onEndAttempt}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 hover:bg-white border-2 border-slate-200 transition-all"
                        >
                            End Attempt
                        </button>
                    )}
                    <button
                        onClick={onReturnToFullscreen}
                        className={`${onEndAttempt && isSerious ? 'flex-1' : 'w-full'} px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-3`}
                    >
                        Return to Fullscreen
                        <span className="text-2xl">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FullscreenWarning;

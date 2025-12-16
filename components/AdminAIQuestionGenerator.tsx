/**
 * Admin AI Question Generator Component
 * Allows admins to generate questions using AI for the question library
 */
import React, { useState } from 'react';

interface AdminAIQuestionGeneratorProps {
    onQuestionGenerated: () => void;
}

const AdminAIQuestionGenerator: React.FC<AdminAIQuestionGeneratorProps> = ({ onQuestionGenerated }) => {
    const [domain, setDomain] = useState('Data Structures & Algorithms');
    const [difficulty, setDifficulty] = useState('Medium');
    const [type, setType] = useState('Coding');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_URL = 'http://localhost:3001';

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // First generate the question
            const generateResponse = await fetch(`${API_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ domain, difficulty, type })
            });

            const questionData = await generateResponse.json();

            if (!generateResponse.ok) {
                throw new Error('Failed to generate question');
            }

            // Then save it to the database via admin endpoint
            const saveResponse = await fetch(`${API_URL}/api/admin/create-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    domain,
                    difficulty,
                    type,
                    title: questionData.title,
                    description: questionData.description,
                    constraints: questionData.constraints || [],
                    examples: questionData.examples || [],
                    starterCode: questionData.starterCode || '',
                    testCases: questionData.testCases || [],
                    hints: questionData.hints || []
                })
            });

            const saveData = await saveResponse.json();

            if (saveData.success) {
                setSuccess('✅ Question generated and added to library!');
                setTimeout(() => {
                    onQuestionGenerated();
                }, 2000);
            } else {
                setError(saveData.error || 'Failed to save question');
            }
        } catch (err) {
            setError('Failed to generate question. Please try again.');
            console.error('Error generating question:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Generate AI Question
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    Create a new question using AI for your question library
                </p>
            </div>

            <div className="space-y-4">
                {/* Domain */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Domain
                    </label>
                    <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                    >
                        <option>Data Structures & Algorithms</option>
                        <option>System Design</option>
                        <option>Web Development</option>
                        <option>Database</option>
                        <option>Networking</option>
                        <option>Operating Systems</option>
                    </select>
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Difficulty
                    </label>
                    <div className="flex gap-2">
                        {['Easy', 'Medium', 'Hard'].map((diff) => (
                            <button
                                key={diff}
                                onClick={() => setDifficulty(diff)}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${difficulty === diff
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Question Type
                    </label>
                    <div className="flex gap-2">
                        {['Coding', 'Theory', 'System Design'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${type === t
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <span>✨</span>
                            Generate Question
                        </>
                    )}
                </button>

                {/* Success Message */}
                {success && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <p className="text-green-700 dark:text-green-400 font-medium text-center">
                            {success}
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-red-700 dark:text-red-400 font-medium text-center">
                            {error}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAIQuestionGenerator;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { XIcon } from './icons';

interface AdminCodeModalProps {
    isOpen: boolean;
    userEmail: string;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AdminCodeModal: React.FC<AdminCodeModalProps> = ({ isOpen, userEmail, userName, onClose, onSuccess }) => {
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const AUTH_BACKEND_URL = import.meta.env.VITE_AUTH_BACKEND_URL || 'http://localhost:3002';

    const handleVerify = async () => {
        if (!code.trim()) {
            setError('Please enter an admin code');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const response = await fetch(`${AUTH_BACKEND_URL}/auth/verify-admin-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code.trim(),
                    email: userEmail
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update user role in localStorage
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                userData.role = 'admin';
                localStorage.setItem('userData', JSON.stringify(userData));
                localStorage.setItem('userRole', 'admin');

                onSuccess();
            } else {
                setError(data.message || 'Invalid admin code');
            }
        } catch (err) {
            console.error('Error verifying admin code:', err);
            setError('Failed to verify code. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isVerifying) {
            handleVerify();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 transform animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Administrator Verification
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                            {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{userName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{userEmail}</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        To complete administrator login, please enter your admin access code.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="adminCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Admin Code
                            </label>
                            <input
                                id="adminCode"
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter admin code"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors font-mono text-lg tracking-wider"
                                disabled={isVerifying}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        disabled={isVerifying}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying || !code.trim()}
                        className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isVerifying ? 'Verifying...' : 'Verify Code'}
                    </button>
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                    Contact your system administrator if you don't have an admin code.
                </p>
            </div>
        </div>
    );
};

export default AdminCodeModal;

/**
 * Profile Component
 * Displays user profile and stats
 */
import React, { useState, useEffect } from 'react';
import { UserIcon, AwardIcon, ZapIcon, ActivityIcon, BrainIcon, ClockIcon, BookIcon, CheckCircleIcon } from './icons';

interface ProfileProps {
    userEmail: string;
    userName: string;
    userRole: string;
}

const Profile: React.FC<ProfileProps> = ({ userEmail, userName, userRole }) => {
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: 0,
        streakDays: 12,
        xp: 2450,
        level: 1,
        badges: [
            { id: 1, name: 'First Steps', icon: <ZapIcon />, color: 'bg-indigo-500' },
            { id: 2, name: 'Logic Master', icon: <BrainIcon />, color: 'bg-purple-500' },
            { id: 3, name: 'Consistent Learner', icon: <ClockIcon />, color: 'bg-rose-500' }
        ]
    });

    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/api/student/my-progress`, {
                    headers: {
                        'x-user-email': userEmail,
                        'x-user-role': userRole
                    }
                });
                const data = await response.json();
                setStats(prev => ({
                    ...prev,
                    totalAttempts: data.total || 0,
                    averageScore: data.progress || 0
                }));
            } catch (error) {
                console.error('Error fetching profile stats:', error);
            }
        };

        fetchStats();
    }, [userEmail]);

    return (
        <div className="space-y-10 max-w-5xl mx-auto">
            {/* Header Profile Section */}
            <div className="edu-card-3d p-10 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
                            {userName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-yellow-400 border-4 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
                            <AwardIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                            <h2 className="text-4xl font-black text-slate-900 font-heading tracking-tight">{userName}</h2>
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest border-2 border-indigo-200">
                                {userRole} scholar
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold mb-6 flex items-center justify-center md:justify-start gap-2">
                            <ActivityIcon className="w-5 h-5 text-indigo-400" />
                            Active since December 2025
                        </p>
                        
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 font-bold text-sm">
                                <ZapIcon className="w-4 h-4 text-amber-500" />
                                {stats.xp} XP
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 font-bold text-sm">
                                <ActivityIcon className="w-4 h-4 text-rose-500" />
                                {stats.streakDays} Day Streak
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-24 bg-slate-100"></div>

                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Scholar Level</p>
                        <p className="text-6xl font-black text-indigo-600 font-heading leading-none">{stats.level}</p>
                        <div className="mt-4 w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 w-3/4 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="edu-card-3d p-8 bg-white group">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <BookIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Challenges Solved</h3>
                    <p className="text-4xl font-black text-slate-900 font-heading">{stats.totalAttempts}</p>
                    <p className="text-emerald-600 text-sm font-bold mt-2">+3 this week</p>
                </div>

                <div className="edu-card-3d p-8 bg-white group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Success Rate</h3>
                    <p className="text-4xl font-black text-slate-900 font-heading">{stats.averageScore}%</p>
                    <p className="text-slate-400 text-sm font-bold mt-2">Global Avg: 68%</p>
                </div>

                <div className="edu-card-3d p-8 bg-white group">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                        <ZapIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Focus Points</h3>
                    <p className="text-4xl font-black text-slate-900 font-heading">Algorithms</p>
                    <p className="text-indigo-600 text-sm font-bold mt-2">Data Structures (+12%)</p>
                </div>
            </div>

            {/* Achievements Section */}
            <div className="edu-card-3d p-10 bg-white">
                <h3 className="text-2xl font-black text-slate-900 mb-8 font-heading flex items-center gap-4">
                    <AwardIcon className="w-8 h-8 text-yellow-500" />
                    Scholar Achievements
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.badges.map(badge => (
                        <div key={badge.id} className="flex flex-col items-center text-center p-6 rounded-[32px] bg-slate-50 border-2 border-slate-100 hover:border-indigo-200 transition-all group">
                            <div className={`w-20 h-20 rounded-3xl ${badge.color} text-white flex items-center justify-center mb-4 shadow-xl shadow-current/20 transform group-hover:rotate-12 transition-transform`}>
                                {React.cloneElement(badge.icon as React.ReactElement, { className: 'w-10 h-10' })}
                            </div>
                            <p className="font-black text-slate-900 text-sm font-heading">{badge.name}</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Unlocked</p>
                        </div>
                    ))}
                    <div className="flex flex-col items-center justify-center text-center p-6 rounded-[32px] border-2 border-dashed border-slate-200 opacity-50 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
                        <div className="w-20 h-20 rounded-3xl bg-slate-200 flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                            <AwardIcon className="w-10 h-10 text-slate-400 group-hover:text-amber-500" />
                        </div>
                        <p className="font-bold text-slate-400 text-xs">Goal Hunter</p>
                        <p className="text-slate-400 text-[10px] mt-1">Locked</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

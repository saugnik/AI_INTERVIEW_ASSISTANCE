/**
 * Profile Component
 * Shows detailed activity history for both admins and students
 */
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, AwardIcon, BookIcon } from './icons';

interface ProfileProps {
    userEmail: string;
    userName: string;
    userRole: 'student' | 'admin';
}

interface StudentStats {
    totalAssigned: number;
    totalCompleted: number;
    averageScore: number;
    completionRate: number;
    recentAttempts: Array<{
        questionTitle: string;
        score: number;
        completedAt: string;
    }>;
}

interface AdminStats {
    totalAssignments: number;
    studentsManaged: number;
    recentAssignments: Array<{
        questionTitle: string;
        studentEmail: string;
        assignedAt: string;
        assignmentType: string;
    }>;
}

const Profile: React.FC<ProfileProps> = ({ userEmail, userName, userRole }) => {
    const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:3001';

    useEffect(() => {
        fetchProfileData();
    }, [userEmail, userRole]);

    const fetchProfileData = async () => {
        try {
            if (userRole === 'student') {
                const response = await fetch(`${API_URL}/api/student/profile`, {
                    headers: {
                        'x-user-email': userEmail,
                        'x-user-role': 'student'
                    }
                });
                const data = await response.json();
                setStudentStats(data);
            } else {
                const response = await fetch(`${API_URL}/api/admin/profile`, {
                    headers: {
                        'x-user-email': userEmail,
                        'x-user-role': 'admin'
                    }
                });
                const data = await response.json();
                setAdminStats(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                        {userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">{userName}</h1>
                        <p className="text-indigo-100">{userEmail}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                            {userRole === 'admin' ? '👑 Administrator' : '📚 Student'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Student Profile */}
            {userRole === 'student' && studentStats && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <BookIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Assigned</p>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{studentStats.totalAssigned}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{studentStats.totalCompleted}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <AwardIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Score</p>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{studentStats.averageScore}%</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Completion</p>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{studentStats.completionRate}%</p>
                        </div>
                    </div>

                    {/* Recent Attempts */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Attempts</h2>
                        </div>
                        <div className="p-6">
                            {studentStats.recentAttempts.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No attempts yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {studentStats.recentAttempts.map((attempt, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{attempt.questionTitle}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(attempt.completedAt)}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg font-bold ${attempt.score >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                    attempt.score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {attempt.score}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Admin Profile */}
            {userRole === 'admin' && adminStats && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <BookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Assignments</p>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{adminStats.totalAssignments}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Students Managed</p>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{adminStats.studentsManaged}</p>
                        </div>
                    </div>

                    {/* Recent Assignments */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assignment History</h2>
                        </div>
                        <div className="p-6">
                            {adminStats.recentAssignments.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No assignments yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {adminStats.recentAssignments.map((assignment, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{assignment.questionTitle}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Assigned to: <span className="font-medium">{assignment.studentEmail}</span>
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(assignment.assignedAt)}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${assignment.assignmentType === 'test'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                {assignment.assignmentType === 'test' ? '🎯 Test' : '📝 Practice'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;

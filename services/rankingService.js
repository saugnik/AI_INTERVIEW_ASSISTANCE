// Ranking Service - Calculate and update student rankings
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update student ranking after completing a question
 */
export async function updateStudentRanking(studentEmail, score) {
    try {
        // Get or create ranking record
        let ranking = await prisma.student_rankings.findUnique({
            where: { student_email: studentEmail }
        });

        if (!ranking) {
            ranking = await prisma.student_rankings.create({
                data: {
                    student_email: studentEmail,
                    total_score: 0,
                    questions_solved: 0,
                    avg_score: 0
                }
            });
        }

        // Update scores
        const newTotalScore = ranking.total_score + score;
        const newQuestionsSolved = score >= 70 ? ranking.questions_solved + 1 : ranking.questions_solved;
        const newAvgScore = newQuestionsSolved > 0 ? newTotalScore / newQuestionsSolved : 0;

        await prisma.student_rankings.update({
            where: { student_email: studentEmail },
            data: {
                total_score: newTotalScore,
                questions_solved: newQuestionsSolved,
                avg_score: newAvgScore
            }
        });

        // Recalculate ranks for all students
        await recalculateRanks();

        return { success: true, newTotalScore, newQuestionsSolved, newAvgScore };
    } catch (error) {
        console.error('Error updating student ranking:', error);
        throw error;
    }
}

/**
 * Recalculate ranks for all students based on total score
 */
async function recalculateRanks() {
    try {
        // Get all students ordered by total score
        const students = await prisma.student_rankings.findMany({
            orderBy: { total_score: 'desc' }
        });

        // Update ranks
        for (let i = 0; i < students.length; i++) {
            await prisma.student_rankings.update({
                where: { student_email: students[i].student_email },
                data: { rank: i + 1 }
            });
        }
    } catch (error) {
        console.error('Error recalculating ranks:', error);
    }
}

/**
 * Get global leaderboard
 */
export async function getLeaderboard(limit = 10) {
    try {
        const rankings = await prisma.student_rankings.findMany({
            take: limit,
            orderBy: { total_score: 'desc' },
            include: {
                student: {
                    select: {
                        email: true,
                        name: true,
                        picture: true
                    }
                }
            }
        });

        return rankings.map(r => ({
            rank: r.rank,
            email: r.student.email,
            name: r.student.name,
            picture: r.student.picture,
            totalScore: r.total_score,
            questionsSolved: r.questions_solved,
            avgScore: Math.round(r.avg_score)
        }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        throw error;
    }
}

/**
 * Get student's rank and stats
 */
export async function getStudentRank(studentEmail) {
    try {
        const ranking = await prisma.student_rankings.findUnique({
            where: { student_email: studentEmail },
            include: {
                student: {
                    select: {
                        name: true,
                        picture: true
                    }
                }
            }
        });

        if (!ranking) {
            return null;
        }

        const totalStudents = await prisma.student_rankings.count();

        return {
            rank: ranking.rank,
            totalStudents,
            name: ranking.student.name,
            totalScore: ranking.total_score,
            questionsSolved: ranking.questions_solved,
            avgScore: Math.round(ranking.avg_score)
        };
    } catch (error) {
        console.error('Error getting student rank:', error);
        throw error;
    }
}

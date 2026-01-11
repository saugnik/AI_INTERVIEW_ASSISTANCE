import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function updateStudentRanking(studentEmail, score) {
    try {
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
        await recalculateRanks();
        return { success: true, newTotalScore, newQuestionsSolved, newAvgScore };
    } catch (error) {
        console.error('Error updating student ranking:', error);
        throw error;
    }
}
async function recalculateRanks() {
    try {
        const students = await prisma.student_rankings.findMany({
            orderBy: { total_score: 'desc' }
        });
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
export async function getLeaderboard(limit = 10) {
    try {
        const rankings = await prisma.student_rankings.findMany({
            take: limit,
            orderBy: { total_score: 'desc' }
        });

        const leaderboardWithUsers = await Promise.all(
            rankings.map(async (r) => {
                let studentData = { email: r.student_email, name: r.student_email, picture: null };
                try {
                    const student = await prisma.auth_users.findUnique({
                        where: { email: r.student_email },
                        select: { email: true, name: true, picture: true }
                    });
                    if (student) {
                        studentData = student;
                    }
                } catch (err) {
                    console.warn(`Could not fetch student data for ${r.student_email}`);
                }

                return {
                    rank: r.rank || 0,
                    email: studentData.email,
                    name: studentData.name || studentData.email,
                    picture: studentData.picture,
                    totalScore: r.total_score,
                    questionsSolved: r.questions_solved,
                    avgScore: Math.round(r.avg_score)
                };
            })
        );

        return leaderboardWithUsers;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}
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
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 3500,
    8: 5500,
    9: 8000,
    10: 11000
};
const XP_AWARDS = {
    100: 50,
    90: 40,
    80: 30,
    70: 20,
    default: 5
};
export async function awardXP(studentEmail, score) {
    try {
        let levelData = await prisma.student_levels.findUnique({
            where: { student_email: studentEmail }
        });
        if (!levelData) {
            levelData = await prisma.student_levels.create({
                data: {
                    student_email: studentEmail,
                    current_level: 1,
                    xp_points: 0,
                    next_level_xp: 100,
                    badges: []
                }
            });
        }
        let xpToAward = XP_AWARDS.default;
        if (score === 100) xpToAward = XP_AWARDS[100];
        else if (score >= 90) xpToAward = XP_AWARDS[90];
        else if (score >= 80) xpToAward = XP_AWARDS[80];
        else if (score >= 70) xpToAward = XP_AWARDS[70];
        const newXP = levelData.xp_points + xpToAward;
        const { newLevel, nextLevelXP } = calculateLevel(newXP);
        const leveledUp = newLevel > levelData.current_level;
        const newBadges = await checkForNewBadges(studentEmail, score, levelData.badges);
        await prisma.student_levels.update({
            where: { student_email: studentEmail },
            data: {
                xp_points: newXP,
                current_level: newLevel,
                next_level_xp: nextLevelXP,
                badges: newBadges
            }
        });
        return {
            xpAwarded: xpToAward,
            totalXP: newXP,
            currentLevel: newLevel,
            nextLevelXP,
            leveledUp,
            newBadges: newBadges.filter(b => !levelData.badges.includes(b))
        };
    } catch (error) {
        console.error('Error awarding XP:', error);
        throw error;
    }
}
function calculateLevel(xp) {
    let level = 1;
    let nextLevelXP = LEVEL_THRESHOLDS[2];
    for (let i = 10; i >= 1; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i;
            nextLevelXP = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[10];
            break;
        }
    }
    return { newLevel: level, nextLevelXP };
}
async function checkForNewBadges(studentEmail, score, currentBadges) {
    const badges = [...currentBadges];
    if (!badges.includes('First Blood')) {
        const solvedCount = await prisma.solved_questions.count({
            where: { student_email: studentEmail }
        });
        if (solvedCount === 1) {
            badges.push('First Blood');
        }
    }
    if (!badges.includes('Perfect Score') && score === 100) {
        badges.push('Perfect Score');
    }
    if (!badges.includes('Speed Demon')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const solvedToday = await prisma.solved_questions.count({
            where: {
                student_email: studentEmail,
                solved_at: { gte: today }
            }
        });
        if (solvedToday >= 5) {
            badges.push('Speed Demon');
        }
    }
    if (!badges.includes('Persistent')) {
        const attempts = await prisma.attempts.groupBy({
            by: ['question_id'],
            where: { student_email: studentEmail },
            _count: { question_id: true }
        });
        if (attempts.some(a => a._count.question_id >= 3)) {
            badges.push('Persistent');
        }
    }
    const levelData = await prisma.student_levels.findUnique({
        where: { student_email: studentEmail }
    });
    if (!badges.includes('Master') && levelData && levelData.current_level >= 5) {
        badges.push('Master');
    }
    return badges;
}
export async function getStudentLevel(studentEmail) {
    try {
        const levelData = await prisma.student_levels.findUnique({
            where: { student_email: studentEmail }
        });
        if (!levelData) {
            return null;
        }
        const progressToNextLevel = levelData.next_level_xp > 0
            ? Math.round(((levelData.xp_points - LEVEL_THRESHOLDS[levelData.current_level]) /
                (levelData.next_level_xp - LEVEL_THRESHOLDS[levelData.current_level])) * 100)
            : 100;
        return {
            currentLevel: levelData.current_level,
            xpPoints: levelData.xp_points,
            nextLevelXP: levelData.next_level_xp,
            progressToNextLevel,
            badges: levelData.badges
        };
    } catch (error) {
        console.error('Error getting student level:', error);
        throw error;
    }
}
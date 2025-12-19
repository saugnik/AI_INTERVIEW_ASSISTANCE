// Leveling Service - Manage student XP and level progression
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Level thresholds
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

// XP awards based on score
const XP_AWARDS = {
    100: 50,
    90: 40,
    80: 30,
    70: 20,
    default: 5 // participation XP
};

/**
 * Award XP to student based on score
 */
export async function awardXP(studentEmail, score) {
    try {
        // Get or create level record
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

        // Calculate XP to award
        let xpToAward = XP_AWARDS.default;
        if (score === 100) xpToAward = XP_AWARDS[100];
        else if (score >= 90) xpToAward = XP_AWARDS[90];
        else if (score >= 80) xpToAward = XP_AWARDS[80];
        else if (score >= 70) xpToAward = XP_AWARDS[70];

        const newXP = levelData.xp_points + xpToAward;

        // Check for level up
        const { newLevel, nextLevelXP } = calculateLevel(newXP);
        const leveledUp = newLevel > levelData.current_level;

        // Check for new badges
        const newBadges = await checkForNewBadges(studentEmail, score, levelData.badges);

        // Update level data
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

/**
 * Calculate level based on XP
 */
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

/**
 * Check for new badges earned
 */
async function checkForNewBadges(studentEmail, score, currentBadges) {
    const badges = [...currentBadges];

    // First Blood - Solve first question
    if (!badges.includes('First Blood')) {
        const solvedCount = await prisma.solved_questions.count({
            where: { student_email: studentEmail }
        });
        if (solvedCount === 1) {
            badges.push('First Blood');
        }
    }

    // Perfect Score - Get 100% on any question
    if (!badges.includes('Perfect Score') && score === 100) {
        badges.push('Perfect Score');
    }

    // Speed Demon - Solve 5 questions in one day
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

    // Persistent - Attempt same question 3+ times
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

    // Master - Reach level 5
    const levelData = await prisma.student_levels.findUnique({
        where: { student_email: studentEmail }
    });
    if (!badges.includes('Master') && levelData && levelData.current_level >= 5) {
        badges.push('Master');
    }

    return badges;
}

/**
 * Get student level info
 */
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

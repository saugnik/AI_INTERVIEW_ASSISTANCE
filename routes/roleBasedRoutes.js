/**
 * Role-based API Routes
 * Separate endpoints for admin and student functionality
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized - No user email' });
    }

    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    req.userEmail = userEmail;
    next();
};

// Middleware to check if user is authenticated (student or admin)
const requireAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];

    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized - No user email' });
    }

    req.userEmail = userEmail;
    req.userRole = req.headers['x-user-role'] || 'student';
    next();
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * GET /api/admin/questions
 * Get all questions in the system
 */
router.get('/admin/questions', requireAdmin, async (req, res) => {
    try {
        const questions = await prisma.questions.findMany({
            include: {
                test_cases: true,
                _count: {
                    select: {
                        attempts: true,
                        question_assignments: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json({ questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

/**
 * GET /api/admin/students
 * Get all students with their progress
 */
router.get('/admin/students', requireAdmin, async (req, res) => {
    try {
        const students = await prisma.auth_users.findMany({
            where: {
                role: 'student'
            },
            select: {
                email: true,
                name: true,
                created_at: true,
                last_login_at: true
            }
        });

        // Get assignment counts for each student
        const studentsWithProgress = await Promise.all(
            students.map(async (student) => {
                const assignments = await prisma.question_assignments.findMany({
                    where: { student_email: student.email }
                });

                const completed = assignments.filter(a => a.completed).length;
                const total = assignments.length;

                return {
                    ...student,
                    assignedQuestions: total,
                    completedQuestions: completed,
                    progress: total > 0 ? Math.round((completed / total) * 100) : 0
                };
            })
        );

        res.json({ students: studentsWithProgress });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

/**
 * POST /api/admin/assign-question
 * Assign a question to a student
 */
router.post('/admin/assign-question', requireAdmin, async (req, res) => {
    try {
        const { questionId, studentEmail, dueDate, assignmentType, source } = req.body;

        if (!questionId || !studentEmail) {
            return res.status(400).json({ error: 'Question ID and student email are required' });
        }

        // Validate assignment type
        if (assignmentType && !['practice', 'test'].includes(assignmentType)) {
            return res.status(400).json({ error: 'Invalid assignment type. Must be "practice" or "test"' });
        }

        // Validate source
        if (source && !['ai', 'admin'].includes(source)) {
            return res.status(400).json({ error: 'Invalid source. Must be "ai" or "admin"' });
        }

        // Check if question exists
        const question = await prisma.questions.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Check if student exists
        const student = await prisma.auth_users.findUnique({
            where: { email: studentEmail }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Create assignment (upsert to handle duplicates)
        const assignment = await prisma.question_assignments.upsert({
            where: {
                question_id_student_email: {
                    question_id: questionId,
                    student_email: studentEmail
                }
            },
            update: {
                due_date: dueDate ? new Date(dueDate) : null,
                assigned_by: req.userEmail,
                assignment_type: assignmentType || 'practice',
                source: source || 'admin'
            },
            create: {
                question_id: questionId,
                student_email: studentEmail,
                assigned_by: req.userEmail,
                due_date: dueDate ? new Date(dueDate) : null,
                assignment_type: assignmentType || 'practice',
                source: source || 'admin'
            }
        });

        res.json({
            success: true,
            assignment,
            message: `Question assigned as ${assignmentType || 'practice'} successfully`
        });
    } catch (error) {
        console.error('Error assigning question:', error);
        res.status(500).json({ error: 'Failed to assign question' });
    }
});

/**
 * GET /api/admin/assignments
 * Get all question assignments
 */
router.get('/admin/assignments', requireAdmin, async (req, res) => {
    try {
        const assignments = await prisma.question_assignments.findMany({
            include: {
                questions: {
                    select: {
                        title: true,
                        difficulty: true,
                        domain: true
                    }
                }
            },
            orderBy: {
                assigned_at: 'desc'
            }
        });

        res.json({ assignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

/**
 * DELETE /api/admin/assignment/:id
 * Remove a question assignment
 */
router.delete('/admin/assignment/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.question_assignments.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Assignment removed successfully' });
    } catch (error) {
        console.error('Error removing assignment:', error);
        res.status(500).json({ error: 'Failed to remove assignment' });
    }
});

// ============================================
// STUDENT ENDPOINTS
// ============================================

/**
 * GET /api/student/assigned-questions
 * Get questions assigned to the logged-in student
 */
router.get('/student/assigned-questions', requireAuth, async (req, res) => {
    try {
        const assignments = await prisma.question_assignments.findMany({
            where: {
                student_email: req.userEmail
            },
            include: {
                questions: {
                    include: {
                        test_cases: true
                    }
                }
            },
            orderBy: {
                assigned_at: 'desc'
            }
        });

        // Group assignments by type and source
        const grouped = {
            aiPractice: [],
            adminPractice: [],
            test: []
        };

        assignments.forEach(assignment => {
            const questionData = {
                ...assignment.questions,
                assignmentId: assignment.id,
                assignedAt: assignment.assigned_at,
                dueDate: assignment.due_date,
                completed: assignment.completed,
                completedAt: assignment.completed_at,
                assignmentType: assignment.assignment_type,
                source: assignment.source
            };

            if (assignment.assignment_type === 'test') {
                grouped.test.push(questionData);
            } else if (assignment.source === 'ai') {
                grouped.aiPractice.push(questionData);
            } else {
                grouped.adminPractice.push(questionData);
            }
        });

        res.json({ assignments: grouped });
    } catch (error) {
        console.error('Error fetching assigned questions:', error);
        res.status(500).json({ error: 'Failed to fetch assigned questions' });
    }
});

/**
 * GET /api/student/my-progress
 * Get progress stats for the logged-in student
 */
router.get('/student/my-progress', requireAuth, async (req, res) => {
    try {
        const assignments = await prisma.question_assignments.findMany({
            where: {
                student_email: req.userEmail
            }
        });

        const total = assignments.length;
        const completed = assignments.filter(a => a.completed).length;
        const pending = total - completed;

        // Get overdue assignments
        const now = new Date();
        const overdue = assignments.filter(a =>
            !a.completed && a.due_date && new Date(a.due_date) < now
        ).length;

        res.json({
            total,
            completed,
            pending,
            overdue,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

/**
 * POST /api/student/mark-complete/:assignmentId
 * Mark an assignment as complete
 */
router.post('/student/mark-complete/:assignmentId', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await prisma.question_assignments.update({
            where: {
                id: assignmentId,
                student_email: req.userEmail // Ensure student can only update their own assignments
            },
            data: {
                completed: true,
                completed_at: new Date()
            }
        });

        res.json({ success: true, assignment });
    } catch (error) {
        console.error('Error marking assignment complete:', error);
        res.status(500).json({ error: 'Failed to mark assignment complete' });
    }
});

/**
 * POST /api/student/generate-ai-question
 * Generate an AI question and auto-assign to student
 */
router.post('/student/generate-ai-question', requireAuth, async (req, res) => {
    try {
        const { domain, difficulty, type } = req.body;

        if (!domain || !difficulty || !type) {
            return res.status(400).json({ error: 'Domain, difficulty, and type are required' });
        }

        // Call the generate API endpoint
        const generateResponse = await fetch('http://localhost:3001/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, difficulty, type })
        });

        if (!generateResponse.ok) {
            const errorText = await generateResponse.text();
            throw new Error(`Question generation failed: ${errorText}`);
        }

        const generatedData = await generateResponse.json();

        // Create question in database
        const question = await prisma.questions.create({
            data: {
                id: crypto.randomUUID(),
                domain,
                difficulty,
                type,
                title: generatedData.title,
                prompt: generatedData.description,
                constraints: generatedData.constraints || [],
                examples: generatedData.testCases || [],
                starter_code: generatedData.codeStarter || '',
                reference_solution: generatedData.correctSolution || null
            }
        });

        // Auto-assign to student with source: 'ai'
        const assignment = await prisma.question_assignments.create({
            data: {
                question_id: question.id,
                student_email: req.userEmail,
                assigned_by: 'AI System',
                assignment_type: 'practice',
                source: 'ai'
            }
        });

        res.json({
            success: true,
            question,
            assignment,
            message: 'AI question generated and assigned successfully!'
        });
    } catch (error) {
        console.error('Error generating AI question:', error);
        res.status(500).json({ error: 'Failed to generate AI question: ' + error.message });
    }
});

export default router;

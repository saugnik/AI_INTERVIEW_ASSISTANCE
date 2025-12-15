// server-express.js - New Express-based server with authentication
const express = require('express');
const session = require('express-session');
// Import middleware
const passport = require('./config/passport.cjs');
const { requireAuth, requireAdmin, requireUser } = require('./middleware/auth.cjs');
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// CORS configuration
const ALLOWED_ORIGINS = [
    'https://ai-interview-assistance-xi.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with PostgreSQL store
app.use(session({
    store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Google OAuth - User Login
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// Google OAuth - Admin Login (same as user, role determined by email)
app.get('/auth/google/admin',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// Google OAuth Callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Redirect based on user role
        const redirectUrl = req.user.role === 'admin'
            ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
            : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

        res.redirect(redirectUrl);
    }
);

// Get current user
app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                picture: req.user.picture,
                role: req.user.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session destruction failed' });
            }
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
});

// ============================================
// QUESTION ROUTES
// ============================================

// Get all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await prisma.questions.findMany({
            select: {
                id: true,
                title: true,
                prompt: true,
                domain: true,
                difficulty: true,
                type: true,
                examples: true,
            },
            orderBy: { created_at: 'desc' },
            take: 100,
        });

        res.json(questions);
    } catch (err) {
        console.error('GET /api/questions error:', err);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Get single question with tests
app.get('/api/questions/:id', async (req, res) => {
    try {
        const question = await prisma.questions.findUnique({
            where: { id: req.params.id },
            include: {
                test_cases: {
                    orderBy: { order_index: 'asc' }
                }
            }
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json(question);
    } catch (err) {
        console.error('GET /api/questions/:id error:', err);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

// Get random question
app.get('/api/questions/random', async (req, res) => {
    try {
        const count = await prisma.questions.count();
        if (count === 0) {
            return res.status(404).json({ error: 'No questions available' });
        }

        const randomIndex = Math.floor(Math.random() * count);
        const question = await prisma.questions.findMany({
            skip: randomIndex,
            take: 1,
            include: {
                test_cases: {
                    orderBy: { order_index: 'asc' }
                }
            }
        });

        res.json(question[0]);
    } catch (err) {
        console.error('GET /api/questions/random error:', err);
        res.status(500).json({ error: 'Failed to fetch random question' });
    }
});

// ============================================
// ATTEMPT ROUTES (Protected - User only)
// ============================================

// Save attempt
app.post('/api/attempts', requireAuth, async (req, res) => {
    try {
        const { questionId, language, submission, score, feedback } = req.body;

        const attempt = await prisma.attempts.create({
            data: {
                id: crypto.randomUUID(),
                user_id: req.user.id,
                question_id: questionId,
                language: language || 'javascript',
                submission,
                score: score ? parseFloat(score) / 100 : null,
                feedback: feedback || null
            },
            include: {
                questions: {
                    select: {
                        title: true,
                        difficulty: true,
                        domain: true
                    }
                }
            }
        });

        res.status(201).json(attempt);
    } catch (err) {
        console.error('POST /api/attempts error:', err);
        res.status(500).json({ error: 'Failed to save attempt' });
    }
});

// Get user's attempts
app.get('/api/attempts/user/:userId', requireAuth, async (req, res) => {
    // Users can only see their own attempts, admins can see any
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const attempts = await prisma.attempts.findMany({
            where: { user_id: req.params.userId },
            include: {
                questions: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        domain: true,
                        type: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 100
        });

        res.json(attempts);
    } catch (err) {
        console.error('GET /api/attempts/user/:userId error:', err);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// Get user statistics
app.get('/api/stats/user/:userId', requireAuth, async (req, res) => {
    // Users can only see their own stats, admins can see any
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const attempts = await prisma.attempts.findMany({
            where: { user_id: req.params.userId },
            select: {
                score: true,
                created_at: true,
                questions: {
                    select: {
                        difficulty: true,
                        domain: true,
                        title: true
                    }
                }
            }
        });

        const totalAttempts = attempts.length;
        const avgScore = totalAttempts > 0
            ? attempts.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / totalAttempts
            : 0;
        const solvedCount = attempts.filter(a => parseFloat(a.score) > 0.7).length;

        const stats = {
            totalAttempts,
            avgScore: Math.round(avgScore * 100),
            solvedCount,
            recentActivity: attempts.slice(0, 5).map(a => ({
                questionTitle: a.questions.title,
                score: Math.round(parseFloat(a.score) * 100),
                date: a.created_at,
                difficulty: a.questions.difficulty
            }))
        };

        res.json(stats);
    } catch (err) {
        console.error('GET /api/stats/user/:userId error:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ============================================
// ADMIN ROUTES (Protected - Admin only)
// ============================================

// Get all users (Admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await prisma.auth_users.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                created_at: true,
                last_login_at: true
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(users);
    } catch (err) {
        console.error('GET /api/admin/users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all attempts (Admin only)
app.get('/api/admin/attempts', requireAdmin, async (req, res) => {
    try {
        const attempts = await prisma.attempts.findMany({
            include: {
                users: {
                    select: {
                        email: true,
                        name: true
                    }
                },
                questions: {
                    select: {
                        title: true,
                        difficulty: true,
                        domain: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 200
        });

        res.json(attempts);
    } catch (err) {
        console.error('GET /api/admin/attempts error:', err);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// ============================================
// EVALUATION ROUTE
// ============================================

app.post('/api/evaluate', async (req, res) => {
    try {
        const { question = {}, userAnswer = '' } = req.body;

        // Mock evaluation
        const codeLength = userAnswer.length;
        const hasReturn = userAnswer.includes('return');
        const hasFunction = userAnswer.includes('function');
        const hasComments = userAnswer.includes('//') || userAnswer.includes('/*');

        let score = 70;
        if (hasReturn && hasFunction) score += 15;
        if (hasComments) score += 5;
        if (codeLength > 100) score += 10;

        const evaluation = {
            score: Math.min(score, 100),
            feedback: "Your solution demonstrates good understanding of the problem.",
            strengths: [
                "Clear and readable code structure",
                "Proper function implementation"
            ],
            improvements: [
                "Consider adding edge case handling",
                "Add input validation"
            ]
        };

        res.json(evaluation);
    } catch (err) {
        console.error('POST /api/evaluate error:', err);
        res.status(500).json({ error: 'Evaluation failed' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
    console.log(`[auth] Google OAuth configured`);
    console.log(`[session] PostgreSQL session store active`);
});

module.exports = app;

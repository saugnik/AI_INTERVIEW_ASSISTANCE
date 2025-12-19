// Simplified Auth Server - Direct OAuth without Passport
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyAdminCode, assignAdminRole } from './utils/admin-codes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'Auth backend running - Role-based OAuth',
        port: PORT
    });
});

// Initiate Google OAuth with role parameter
app.get('/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const role = req.query.role || 'student'; // 'student' or 'admin'
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`;
    const scope = 'profile email';

    // Store role in state parameter
    const state = Buffer.from(JSON.stringify({ role })).toString('base64');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;

    console.log(`🔐 Redirecting to Google OAuth (role: ${role})...`);
    res.redirect(googleAuthUrl);
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_ORIGIN}?error=no_code`);
    }

    // Decode role from state
    let role = 'student';
    try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        role = stateData.role || 'student';
    } catch (e) {
        console.error('Error parsing state:', e);
    }

    try {
        console.log('📝 Received OAuth code, exchanging for tokens...');

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error('❌ No access token received');
            return res.redirect(`${process.env.FRONTEND_ORIGIN}?error=no_token`);
        }

        console.log('✅ Got access token, fetching user profile...');

        // Get user profile
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const profile = await profileResponse.json();

        console.log('✅ Got user profile:', profile.email);

        // Save user to database
        try {
            const saveResponse = await fetch('http://localhost:3001/api/auth/save-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    name: profile.name,
                    google_id: profile.id,
                    role: role
                })
            });

            const saveResult = await saveResponse.json();

            if (saveResponse.ok) {
                console.log('✅ User saved to database');
            } else if (saveResult.error === 'ROLE_MISMATCH') {
                // Role mismatch - redirect with error
                console.log(`❌ Role mismatch for ${profile.email}`);
                const errorMsg = encodeURIComponent(saveResult.message);
                return res.redirect(
                    `${process.env.FRONTEND_ORIGIN}?error=role_mismatch&message=${errorMsg}&existingRole=${saveResult.existingRole}`
                );
            } else {
                console.log('⚠️ Failed to save user:', saveResult.error);
                // Continue anyway for backward compatibility
            }
        } catch (dbError) {
            console.error('⚠️ Database save error:', dbError.message);
            // Continue anyway - user can still login
        }

        // Create user object with role
        const user = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            role: role,
            needsAdminCode: role === 'admin' // Flag to show admin code modal
        };

        const userData = encodeURIComponent(JSON.stringify(user));

        // Redirect to frontend with user data
        res.redirect(`${process.env.FRONTEND_ORIGIN}?authenticated=true&user=${userData}`);
    } catch (error) {
        console.error('❌ OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_ORIGIN}?error=oauth_failed`);
    }
});

// Verify admin code endpoint
app.post('/auth/verify-admin-code', async (req, res) => {
    const { code, email } = req.body;

    if (!code || !email) {
        return res.status(400).json({
            success: false,
            message: 'Code and email are required'
        });
    }

    console.log(`🔐 Verifying admin code for ${email}...`);

    const result = await verifyAdminCode(code, email);

    if (result.valid) {
        // Assign admin role
        const roleAssigned = await assignAdminRole(email);

        if (roleAssigned) {
            console.log(`✅ Admin role assigned to ${email}`);
            return res.json({
                success: true,
                message: 'Admin access granted',
                role: 'admin'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to assign admin role'
            });
        }
    } else {
        console.log(`❌ Invalid admin code for ${email}`);
        return res.status(401).json({
            success: false,
            message: result.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Auth backend running on http://localhost:${PORT}`);
    console.log(`🔐 Google OAuth configured (Role-based)`);
    console.log(`📧 Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`);
    console.log(`🌐 Frontend origin: ${process.env.FRONTEND_ORIGIN}`);
    console.log(`👥 Roles: student (OAuth only) | admin (OAuth + code)`);
});

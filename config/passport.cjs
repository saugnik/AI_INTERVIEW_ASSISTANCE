// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback'
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            // Check if user exists
            let user = await prisma.auth_users.findUnique({
                where: { google_id: profile.id }
            });
            if (!user) {
                // Create new user
                // Check if email already exists (for role assignment)
                const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
                const isAdmin = adminEmails.includes(profile.emails[0].value);
                user = await prisma.auth_users.create({
                    data: {
                        google_id: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        picture: profile.photos[0]?.value,
                        auth_provider: 'google',
                        role: isAdmin ? 'admin' : 'user',
                        last_login_at: new Date()
                    }
                });
            } else {
                // Update last login
                user = await prisma.auth_users.update({
                    where: { id: user.id },
                    data: { last_login_at: new Date() }
                });
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));
// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.auth_users.findUnique({
            where: { id }
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
module.exports = passport;

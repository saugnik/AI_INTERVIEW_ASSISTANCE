// Passport.js Google OAuth Configuration
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getUserByGoogleId, createOrUpdateUser } from './database.js';

export function configurePassport() {
    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await getUserByGoogleId(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 3002}/auth/google/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user info from Google profile
                    const googleId = profile.id;
                    const email = profile.emails?.[0]?.value || '';
                    const name = profile.displayName || '';
                    const picture = profile.photos?.[0]?.value || '';

                    // Create or update user in database
                    const user = await createOrUpdateUser(googleId, email, name, picture);

                    done(null, user);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );

    return passport;
}

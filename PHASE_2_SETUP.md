# Phase 2 Setup Instructions

## ✅ What's Been Done

1. **Dependencies Installed**:
   - express, express-session, passport, passport-google-oauth20
   - connect-pg-simple (PostgreSQL session store)
   - cookie-parser

2. **Database Updated**:
   - Added `role` field to `auth_users` table (user/admin)
   - Created `session` table for session storage
   - Migration completed successfully

3. **Authentication System Created**:
   - `config/passport.js` - Google OAuth configuration
   - `middleware/auth.js` - Role-based access control
   - `server-express.js` - New Express server with auth routes

## 🔧 Next Steps - Configure OAuth

### Step 1: Get Your OAuth Credentials

You mentioned you have OAuth credentials in the AUTH_SYSTEM folder. We need to add them to the main `.env` file.

**Required values:**
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret

### Step 2: Set Admin Emails

Add email addresses that should have admin access:

```env
ADMIN_EMAILS=your-admin-email@gmail.com,another-admin@gmail.com
```

Anyone who logs in with these emails will get the `admin` role. All others get `user` role.

### Step 3: Update .env File

Your `.env` should have these new lines (already added):
```env
# Authentication
SESSION_SECRET=(auto-generated)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
ADMIN_EMAILS=

# Google OAuth (ADD THESE)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

### Step 4: Test the Server

```powershell
npm run start:api
```

You should see:
```
[api] listening on http://localhost:3001
[auth] Google OAuth configured
[session] PostgreSQL session store active
```

## 🎯 Authentication Routes Available

### User Routes:
- `GET /auth/google` - Start Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Get current user info
- `POST /auth/logout` - Logout

### Protected Routes (User):
- `POST /api/attempts` - Save attempt (requires auth)
- `GET /api/attempts/user/:userId` - Get user attempts
- `GET /api/stats/user/:userId` - Get user stats

### Admin Routes:
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/attempts` - Get all attempts (admin only)

## 🔐 How It Works

1. **User Login**:
   - User clicks "Sign in with Google"
   - Redirects to `/auth/google`
   - Google authentication
   - Callback to `/auth/google/callback`
   - User created/updated in `auth_users` table
   - Role assigned based on email (admin or user)
   - Redirects to `/dashboard` (user) or `/admin/dashboard` (admin)

2. **Session Management**:
   - Sessions stored in PostgreSQL `session` table
   - 24-hour expiration
   - Secure cookies (httpOnly)

3. **Role-Based Access**:
   - Middleware checks user role
   - `requireAuth` - Any authenticated user
   - `requireUser` - User role only
   - `requireAdmin` - Admin role only

## 📝 What You Need to Provide

Please share:
1. Your Google OAuth Client ID
2. Your Google OAuth Client Secret
3. Email addresses that should be admins

Then I'll update the .env file and we can test the authentication!

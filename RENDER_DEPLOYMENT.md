# Backend Deployment to Render - Step by Step Guide

## Prerequisites
✅ You've already deployed frontend to Vercel
✅ Environment variables are configured on Vercel

## Step 1: Create `render.yaml` Configuration

I've created this file for you. It tells Render how to deploy your backend.

## Step 2: Deploy to Render

### A. Sign Up / Login to Render
1. Go to https://render.com
2. Sign up with GitHub (use the same account as your repo)

### B. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `AI_INTERVIEW_ASSISTANCE`
3. Render will auto-detect the `render.yaml` file

### C. Configure the Service

**Basic Settings:**
- **Name:** `ai-interview-backend`
- **Region:** Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch:** `main`
- **Root Directory:** Leave blank (or `.`)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

**Instance Type:**
- Select **Free** (0$/month)

### D. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables (copy from your local `.env`):

```
GROQ_GENERATION_KEY=your_groq_generation_key
GROQ_EVALUATION_KEY=your_groq_evaluation_key
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_postgresql_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-render-url.onrender.com/auth/google/callback
FRONTEND_ORIGIN=https://ai-interview-app-bay.vercel.app
PORT=3001
```

> **Important:** Update `GOOGLE_REDIRECT_URI` after deployment with your actual Render URL

### E. Deploy!

Click **"Create Web Service"**

Render will:
1. Clone your repo
2. Install dependencies
3. Start your server
4. Give you a URL like: `https://ai-interview-backend.onrender.com`

---

## Step 3: Update Frontend to Use Backend URL

After deployment, you'll get a URL like:
`https://ai-interview-backend.onrender.com`

### Update Vercel Environment Variables

1. Go to https://vercel.com/saugniks-projects/ai-interview-app/settings/environment-variables
2. Update `VITE_BACKEND_URL`:
   ```
   VITE_BACKEND_URL=https://ai-interview-backend.onrender.com
   ```
3. Redeploy frontend:
   ```powershell
   vercel --prod
   ```

---

## Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client
3. Add authorized redirect URI:
   ```
   https://your-render-url.onrender.com/auth/google/callback
   ```

---

## Step 5: Update CORS in server.js

Update the `ALLOWED_ORIGINS` in your `server.js`:

```javascript
const ALLOWED_ORIGINS = new Set([
  'https://ai-interview-app-bay.vercel.app', // Your Vercel frontend
  'http://localhost:3000',
  'http://localhost:5173',
]);
```

Commit and push this change - Render will auto-deploy.

---

## Important Notes

### ⚠️ Free Tier Limitations

**Render Free Tier:**
- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds

**Database:**
- Your local PostgreSQL won't work on Render
- You need a cloud database (see below)

---

## Database Options

Your backend needs a cloud PostgreSQL database:

### Option A: Neon (Recommended)
- **Free tier:** 0.5GB storage
- **Setup:** https://neon.tech
- **Get connection string** and add to Render env vars

### Option B: Supabase
- **Free tier:** 500MB storage
- **Setup:** https://supabase.com
- **Get connection string** from project settings

### Option C: Render PostgreSQL
- **Free tier:** 90 days, then $7/month
- Create in Render dashboard

---

## Quick Checklist

- [ ] Sign up on Render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Add environment variables
- [ ] Deploy backend
- [ ] Get backend URL
- [ ] Update Vercel env vars with backend URL
- [ ] Update Google OAuth redirect URI
- [ ] Update CORS in server.js
- [ ] Set up cloud database
- [ ] Test the app!

---

## Need Help?

If you get stuck at any step, let me know and I'll guide you through it!

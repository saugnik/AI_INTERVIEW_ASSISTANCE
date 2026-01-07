# 🔧 Port Configuration Fix - Video Explanation Feature

## Issue Identified
The "Get AI Video Explanation" button was not appearing because of a **port mismatch**:
- **Frontend** was calling: `http://localhost:3001`
- **Backend** was running on: `http://localhost:3002`

This caused 404 errors in the browser console when trying to fetch video explanations.

## Files Updated

### 1. `components/VideoExplanation.tsx`
- ✅ Line 75: Changed `localhost:3001` → `localhost:3002`
- ✅ Line 99: Changed `localhost:3001` → `localhost:3002`  
- ✅ Line 230: Changed `localhost:3001` → `localhost:3002`

### 2. `App.tsx`
- ✅ Line 193: Changed default backend URL to `localhost:3002`

### 3. `services/geminiService.ts`
- ✅ Line 33: Changed `localhost:3001` → `localhost:3002`
- ✅ Line 129: Changed `localhost:3001` → `localhost:3002`

## Next Steps

### **IMPORTANT: Restart Your Development Server**

The frontend needs to be restarted to pick up the changes:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### **Then Test Again:**

1. Open `http://localhost:5173` in your browser
2. Login as a student
3. Attempt any coding question
4. Submit a **wrong answer** (e.g., `return [];`)
5. Look for the **"Get AI Video Explanation"** button
6. Click it and verify audio is generated

## Expected Behavior

After fixing the port configuration:
- ✅ Button should appear for scores < 60%
- ✅ Clicking button triggers audio generation
- ✅ Audio player appears after 3-7 seconds
- ✅ Student can listen to explanation

## Verification

Check browser console (F12) - you should see:
- ✅ No 404 errors for `/api/student/video-explanation`
- ✅ Successful API calls to port 3002
- ✅ Audio URL returned: `/audio/explanation_xxx.mp3`

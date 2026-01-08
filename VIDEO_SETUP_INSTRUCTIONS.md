# Instructions for Adding Your AI Teacher Video

## Step 1: Prepare Your Video

1. You have a **3-minute video** of an AI agent with face and hand movements
2. The video should be in **MP4 format** (most compatible)
3. Name it: `ai-teacher-avatar.mp4`

## Step 2: Add Video to Project

1. Create a `videos` folder in the `public` directory:
   ```
   AI_INTERVIEW_APP/public/videos/
   ```

2. Place your video file there:
   ```
   AI_INTERVIEW_APP/public/videos/ai-teacher-avatar.mp4
   ```

## Step 3: How It Works

When a student clicks "Get AI Video Explanation":

1. ✅ System generates explanation script (800-1200 words)
2. ✅ Google TTS creates audio from the script
3. ✅ Your static video plays in the background
4. ✅ TTS audio plays over the video
5. ✅ Student sees the AI agent "teaching" with the explanation

## Step 4: Test It

1. Restart the server: `.\start-all.ps1`
2. Login as a student
3. Go to Learning Path
4. Submit a wrong answer
5. Click "Get AI Video Explanation"
6. Your video should play with the TTS audio!

## Notes

- The video will loop if the audio is longer than 3 minutes
- The audio will be synchronized with the video playback
- Students can pause, play, and seek through the explanation
- The transcript is shown below the video

## Future Enhancement

If you want different videos for different moods/topics, you can:
- Add multiple videos (e.g., `happy.mp4`, `serious.mp4`, `encouraging.mp4`)
- Modify the code to select videos based on the student's score or topic

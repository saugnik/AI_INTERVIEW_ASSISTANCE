/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { MediaPlayer } from './MediaPlayer';

interface VideoExplanationProps {
  attemptId: string;
  questionId: string;
  score: number;
  userEmail: string;
  question?: any;  // Full question object
  userAnswer?: string;  // User's submitted answer
  testResults?: any[];  // Test case results
}

interface VideoExplanationData {
  id: string;
  attempt_id: string;
  explanation_text: string;
  video_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface ProgressStep {
  name: string;
  status: 'pending' | 'active' | 'completed';
  progress: number;
}

export function VideoExplanation({ attemptId, questionId, score, userEmail, question, userAnswer, testResults }: VideoExplanationProps) {
  const [videoData, setVideoData] = useState<VideoExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Progress tracking
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { name: '📝 Analyzing your answer', status: 'pending', progress: 0 },
    { name: '🤖 Generating explanation script', status: 'pending', progress: 0 },
    { name: '🎬 Creating AI avatar video', status: 'pending', progress: 0 },
    { name: '🎙️ Adding voice and lip-sync', status: 'pending', progress: 0 },
    { name: '✨ Finalizing your explanation', status: 'pending', progress: 0 }
  ]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);


  // Check if video explanation already exists on mount
  useEffect(() => {
    checkExistingVideo();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [attemptId]);

  // Poll for video status if processing
  useEffect(() => {
    if (videoData?.status === 'processing') {
      const interval = setInterval(() => {
        pollVideoStatus();
      }, 5000); // Poll every 5 seconds
      setPollingInterval(interval);

      return () => clearInterval(interval);
    }
  }, [videoData?.status]);

  const checkExistingVideo = async () => {
    // DISABLED - No database mode
    // try {
    //   const devBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
    //   const url = devBase ? `${devBase}/api/student/video-explanation/${attemptId}` : `/api/student/video-explanation/${attemptId}`;

    //   const response = await fetch(url, {
    //     headers: {
    //       'x-user-email': userEmail
    //     }
    //   });

    //   if (response.ok) {
    //     const data = await response.json();
    //     setVideoData(data);
    //   }
    // } catch (err) {
    //   // Video doesn't exist yet, that's okay
    //   console.log('No existing video explanation');
    // }
  };

  const requestVideoExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const devBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      const url = devBase ? `${devBase}/api/student/request-video-explanation` : `/api/student/request-video-explanation`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({
          attemptId,
          questionId,
          question,  // Send full question object
          userAnswer,  // Send user's answer
          testResults  // Send test results
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Create videoData object from direct response (no database needed)
        const videoDataObj = {
          id: attemptId,
          attempt_id: attemptId,
          explanation_text: '', // Will be populated if needed
          video_url: data.videoUrl,
          status: 'completed' as const,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          video_provider: data.provider || 'static-video-tts',
          video_provider_id: JSON.stringify({
            videoId: data.videoId,
            audioUrl: data.audioUrl
          })
        };

        setVideoData(videoDataObj);
        setShowModal(true);
      } else {
        setError(data.error || 'Failed to request video explanation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error requesting video:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate progress based on typical video generation timeline
  const simulateProgress = () => {
    const steps = [...progressSteps];

    // Step 1: Analyzing (0-5 seconds)
    setTimeout(() => {
      steps[0] = { ...steps[0], status: 'active', progress: 50 };
      setProgressSteps([...steps]);
    }, 1000);

    setTimeout(() => {
      steps[0] = { ...steps[0], status: 'completed', progress: 100 };
      steps[1] = { ...steps[1], status: 'active', progress: 0 };
      setProgressSteps([...steps]);
    }, 3000);

    // Step 2: Script generation (5-10 seconds)
    setTimeout(() => {
      steps[1] = { ...steps[1], progress: 50 };
      setProgressSteps([...steps]);
    }, 6000);

    setTimeout(() => {
      steps[1] = { ...steps[1], status: 'completed', progress: 100 };
      steps[2] = { ...steps[2], status: 'active', progress: 0 };
      setProgressSteps([...steps]);
    }, 10000);

    // Step 3: Video creation (10-40 seconds)
    setTimeout(() => {
      steps[2] = { ...steps[2], progress: 25 };
      setProgressSteps([...steps]);
    }, 15000);

    setTimeout(() => {
      steps[2] = { ...steps[2], progress: 50 };
      setProgressSteps([...steps]);
    }, 25000);

    setTimeout(() => {
      steps[2] = { ...steps[2], progress: 75 };
      setProgressSteps([...steps]);
    }, 35000);

    setTimeout(() => {
      steps[2] = { ...steps[2], status: 'completed', progress: 100 };
      steps[3] = { ...steps[3], status: 'active', progress: 0 };
      setProgressSteps([...steps]);
    }, 45000);

    // Step 4: Audio processing (40-60 seconds)
    setTimeout(() => {
      steps[3] = { ...steps[3], progress: 50 };
      setProgressSteps([...steps]);
    }, 52000);

    setTimeout(() => {
      steps[3] = { ...steps[3], status: 'completed', progress: 100 };
      steps[4] = { ...steps[4], status: 'active', progress: 0 };
      setProgressSteps([...steps]);
    }, 60000);

    setTimeout(() => {
      steps[4] = { ...steps[4], progress: 50 };
      setProgressSteps([...steps]);
    }, 67000);
  };

  useEffect(() => {
    if (startTime && videoData?.status === 'processing') {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startTime, videoData?.status]);

  useEffect(() => {
    if (videoData?.status === 'completed') {
      const steps = progressSteps.map(step => ({
        ...step,
        status: 'completed' as const,
        progress: 100
      }));
      setProgressSteps(steps);
    }
  }, [videoData?.status]);


  const pollVideoStatus = async () => {
    if (!videoData) return;

    try {
      const devBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      const url = devBase ? `${devBase}/api/student/video-explanation/${attemptId}` : `/api/student/video-explanation/${attemptId}`;

      const response = await fetch(url, {
        headers: {
          'x-user-email': userEmail
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVideoData(data);

        if (data.status === 'completed' || data.status === 'failed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      }
    } catch (err) {
      console.error('Error polling video status:', err);
    }
  };

  const getStatusMessage = () => {
    if (!videoData) return '';

    switch (videoData.status) {
      case 'pending':
        return 'Preparing your explanation...';
      case 'processing':
        return 'AI teacher is creating your video... (30-90 seconds)';
      case 'completed':
        return 'Video ready!';
      case 'failed':
        return 'Video generation failed';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    if (!videoData) return null;

    switch (videoData.status) {
      case 'pending':
      case 'processing':
        return (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        );
      case 'completed':
        return <span className="status-icon success">✓</span>;
      case 'failed':
        return <span className="status-icon error">✗</span>;
      default:
        return null;
    }
  };

  // Only show for scores below 60
  if (score >= 60) {
    return null;
  }

  return (
    <div className="video-explanation-container">
      <div className="video-explanation-card">
        <h3>Need help understanding this?</h3>
        <p>Get a personalized AI video explanation of the correct solution!</p>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {!videoData && (
          <button
            onClick={requestVideoExplanation}
            disabled={loading}
            className="btn-primary video-btn"
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="video-icon">🎥</span>
                Get AI Video Explanation
              </>
            )}
          </button>
        )}

        {videoData && (
          <div className="video-status">
            {videoData.status === 'processing' && (
              <div className="progress-tracker">
                <div className="progress-header">
                  <h4>Creating Your AI Video Explanation</h4>
                  <div className="time-info">
                    <span className="elapsed-time">⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                    <span className="estimated-time">Est. 1-2 minutes</span>
                  </div>
                </div>

                <div className="progress-steps">
                  {progressSteps.map((step, index) => (
                    <div key={index} className={`progress-step ${step.status}`}>
                      <div className="step-header">
                        <span className="step-name">{step.name}</span>
                        <span className="step-status">
                          {step.status === 'completed' && '✓'}
                          {step.status === 'active' && <span className="spinner-small"></span>}
                          {step.status === 'pending' && '○'}
                        </span>
                      </div>
                      {step.status !== 'pending' && (
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${step.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="progress-footer">
                  <p className="progress-message">
                    Please wait while our AI teacher creates your personalized explanation...
                  </p>
                </div>
              </div>
            )}

            {videoData.status === 'completed' && videoData.video_url && (
              <>
                {getStatusIcon()}
                <p className="status-message">{getStatusMessage()}</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary video-btn"
                >
                  <span className="play-icon">▶️</span>
                  Watch Video Explanation
                </button>
              </>
            )}

            {videoData.status === 'failed' && (
              <>
                {getStatusIcon()}
                <p className="status-message">{getStatusMessage()}</p>
                <button
                  onClick={requestVideoExplanation}
                  className="btn-secondary video-btn"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Media Player (Video or Audio) */}
      {showModal && videoData?.status === 'completed' && videoData.video_url && (() => {
        // Parse audio URL from video_provider_id if it's static-video-tts
        let audioUrl = null;
        try {
          if ((videoData as any).video_provider === 'static-video-tts' && (videoData as any).video_provider_id) {
            const parsed = JSON.parse((videoData as any).video_provider_id);
            audioUrl = parsed.audioUrl;
          }
        } catch (e) {
          console.error('Failed to parse video_provider_id:', e);
        }

        return (
          <MediaPlayer
            mediaUrl={videoData.video_url}
            audioUrl={audioUrl} // Separate audio for static-video-tts
            transcript={videoData.explanation_text || ''}
            duration={300} // Default 5 minutes, will be updated from backend
            onClose={() => setShowModal(false)}
            provider={(videoData as any).video_provider || 'google-tts'}
            fallback={(videoData as any).fallback || false}
          />
        );
      })()}

      <style jsx>{`
        .video-explanation-container {
          margin-top: 2rem;
        }

        .video-explanation-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .video-explanation-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .video-explanation-card p {
          margin: 0 0 1.5rem 0;
          opacity: 0.9;
        }

        .video-btn {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: white;
          color: #667eea;
          font-weight: 600;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid white;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .error-message {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          color: white;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .video-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .status-message {
          font-size: 1.1rem;
          margin: 0;
        }

        .loading-spinner {
          margin: 1rem 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-icon {
          font-size: 3rem;
        }

        .status-icon.success {
          color: #4ade80;
        }

        .status-icon.error {
          color: #f87171;
        }

        /* Modal Styles */
        .video-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .video-modal {
          background: white;
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.5rem;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #1f2937;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .video-container {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          height: 0;
          overflow: hidden;
          border-radius: 8px;
          background: #000;
        }

        .explanation-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .explanation-transcript {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .explanation-transcript h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .explanation-transcript p {
          margin: 0;
          color: #4b5563;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* Progress Tracker Styles */
        .progress-tracker {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .progress-header h4 {
          margin: 0;
          font-size: 1.2rem;
          color: white;
        }

        .time-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .elapsed-time {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
        }

        .estimated-time {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .progress-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .progress-step {
          transition: all 0.3s ease;
        }

        .progress-step.pending {
          opacity: 0.5;
        }

        .progress-step.active {
          opacity: 1;
        }

        .progress-step.completed {
          opacity: 0.8;
        }

        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .step-name {
          font-size: 0.95rem;
          color: white;
          font-weight: 500;
        }

        .step-status {
          font-size: 1.2rem;
          color: white;
        }

        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .progress-bar-container {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          height: 8px;
          overflow: hidden;
        }

        .progress-bar-fill {
          background: linear-gradient(90deg, #4ade80, #22c55e);
          height: 100%;
          border-radius: 8px;
          transition: width 0.5s ease;
          box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
        }

        .progress-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .progress-message {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .video-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .progress-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .time-info {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

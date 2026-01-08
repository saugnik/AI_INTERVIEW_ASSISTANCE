/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from 'react';

interface MediaPlayerProps {
    mediaUrl: string; // Video URL or audio URL
    audioUrl?: string; // Separate audio URL (for static video + TTS)
    transcript: string;
    duration?: number;
    onClose: () => void;
    provider?: 'did' | 'google-tts' | 'static-video-tts'; // Media provider
    fallback?: boolean; // Whether this is a fallback to audio
}

export function MediaPlayer({
    mediaUrl,
    audioUrl,
    transcript,
    duration = 300,
    onClose,
    provider = 'google-tts',
    fallback = false
}: MediaPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    const isVideo = provider === 'did' || provider === 'static-video-tts';
    const hasAudio = provider === 'static-video-tts' && audioUrl;

    // Auto-play when component mounts
    useEffect(() => {
        if (hasAudio && videoRef.current && audioRef.current) {
            // Play both video and audio together
            Promise.all([
                videoRef.current.play(),
                audioRef.current.play()
            ]).then(() => {
                setIsPlaying(true);
            }).catch(err => console.error('Autoplay failed:', err));
        } else if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true));
        } else if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true));
        }
    }, [hasAudio]);

    // Update current time (use audio time if available, otherwise video)
    useEffect(() => {
        const media = hasAudio ? audioRef.current : (videoRef.current || audioRef.current);
        if (!media) return;

        const updateTime = () => setCurrentTime(media.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        media.addEventListener('timeupdate', updateTime);
        media.addEventListener('play', handlePlay);
        media.addEventListener('pause', handlePause);
        media.addEventListener('ended', handleEnded);

        return () => {
            media.removeEventListener('timeupdate', updateTime);
            media.removeEventListener('play', handlePlay);
            media.removeEventListener('pause', handlePause);
            media.removeEventListener('ended', handleEnded);
        };
    }, [hasAudio]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current && isPlaying) {
            const progress = currentTime / duration;
            const scrollHeight = transcriptRef.current.scrollHeight - transcriptRef.current.clientHeight;
            transcriptRef.current.scrollTop = scrollHeight * progress;
        }
    }, [currentTime, duration, isPlaying]);

    const togglePlayPause = () => {
        if (hasAudio && videoRef.current && audioRef.current) {
            // Control both video and audio
            if (isPlaying) {
                videoRef.current.pause();
                audioRef.current.pause();
            } else {
                videoRef.current.play();
                audioRef.current.play();
            }
        } else if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        } else if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="media-player-overlay" onClick={onClose}>
            <div className="media-player-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>
                        {isVideo ? '🎬 AI Avatar Explanation' : '🎓 AI Audio Explanation'}
                        {fallback && <span className="fallback-badge">Audio Mode</span>}
                    </h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Main Content */}
                <div className="modal-body">
                    {/* Video or Audio Player */}
                    <div className="media-container">
                        {isVideo ? (
                            <div className="video-with-audio">
                                <video
                                    ref={videoRef}
                                    src={mediaUrl}
                                    controls={!hasAudio} // Only show controls if no separate audio
                                    className="video-player"
                                    poster="/ai_teacher_avatar.png"
                                    muted={hasAudio} // Mute video if using separate audio
                                    loop={hasAudio} // Loop video if audio is longer
                                />
                                {hasAudio && audioUrl && (
                                    <>
                                        <audio ref={audioRef} src={audioUrl} />
                                        <div className="audio-controls">
                                            <button className="play-pause-btn" onClick={togglePlayPause}>
                                                {isPlaying ? '⏸️' : '▶️'}
                                            </button>
                                            <span className="time-display">{formatTime(currentTime)}</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration}
                                                value={currentTime}
                                                onChange={(e) => {
                                                    const newTime = parseFloat(e.target.value);
                                                    setCurrentTime(newTime);
                                                    if (videoRef.current) videoRef.current.currentTime = newTime;
                                                    if (audioRef.current) audioRef.current.currentTime = newTime;
                                                }}
                                                className="seek-bar"
                                            />
                                            <span className="time-display">{formatTime(duration)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="audio-player-container">
                                <div className="teacher-avatar-static">
                                    <img
                                        src="/ai_teacher_avatar.png"
                                        alt="AI Teacher"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<div class="avatar-fallback">👩‍🏫</div>';
                                        }}
                                    />
                                </div>
                                <audio ref={audioRef} src={mediaUrl} />
                                <div className="audio-controls">
                                    <button className="play-pause-btn" onClick={togglePlayPause}>
                                        {isPlaying ? '⏸️' : '▶️'}
                                    </button>
                                    <span className="time-display">{formatTime(currentTime)}</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration}
                                        value={currentTime}
                                        onChange={(e) => {
                                            const newTime = parseFloat(e.target.value);
                                            setCurrentTime(newTime);
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = newTime;
                                            }
                                        }}
                                        className="seek-bar"
                                    />
                                    <span className="time-display">{formatTime(duration)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transcript */}
                    <div className="transcript-container" ref={transcriptRef}>
                        <h3>📝 Transcript</h3>
                        <div className="transcript-text">
                            {transcript}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .media-player-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.9);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 1rem;
                    }

                    .media-player-modal {
                        background: white;
                        border-radius: 20px;
                        max-width: 900px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem 2rem;
                        border-bottom: 2px solid #f0f0f0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 20px 20px 0 0;
                    }

                    .modal-header h2 {
                        margin: 0;
                        font-size: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .fallback-badge {
                        font-size: 0.75rem;
                        background: rgba(255, 255, 255, 0.3);
                        padding: 0.25rem 0.75rem;
                        border-radius: 12px;
                        font-weight: normal;
                    }

                    .close-btn {
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 10px;
                        transition: all 0.3s;
                    }

                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: scale(1.1);
                    }

                    .modal-body {
                        padding: 2rem;
                    }

                    /* Video Player */
                    .media-container {
                        margin-bottom: 2rem;
                    }

                    .video-player {
                        width: 100%;
                        border-radius: 15px;
                        background: #000;
                    }

                    /* Audio Player */
                    .audio-player-container {
                        text-align: center;
                    }

                    .teacher-avatar-static {
                        width: 200px;
                        height: 200px;
                        margin: 0 auto 1.5rem;
                        border-radius: 50%;
                        overflow: hidden;
                        border: 5px solid #667eea;
                        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                    }

                    .teacher-avatar-static img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .avatar-fallback {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 5rem;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }

                    .audio-controls {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        background: #f9fafb;
                        padding: 1.5rem;
                        border-radius: 15px;
                    }

                    .play-pause-btn {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        border: none;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        transition: all 0.3s;
                        flex-shrink: 0;
                    }

                    .play-pause-btn:hover {
                        transform: scale(1.1);
                        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                    }

                    .time-display {
                        font-size: 0.9rem;
                        font-weight: 600;
                        color: #667eea;
                        min-width: 45px;
                    }

                    .seek-bar {
                        flex: 1;
                        height: 8px;
                        border-radius: 4px;
                        background: #e5e7eb;
                        outline: none;
                        cursor: pointer;
                    }

                    .seek-bar::-webkit-slider-thumb {
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #667eea;
                        cursor: pointer;
                    }

                    /* Transcript */
                    .transcript-container {
                        background: #f9fafb;
                        border-radius: 15px;
                        padding: 1.5rem;
                        max-height: 300px;
                        overflow-y: auto;
                    }

                    .transcript-container h3 {
                        margin: 0 0 1rem 0;
                        color: #1f2937;
                        font-size: 1.1rem;
                    }

                    .transcript-text {
                        color: #4b5563;
                        line-height: 1.8;
                        white-space: pre-wrap;
                        font-size: 1rem;
                    }

                    /* Scrollbar */
                    .transcript-container::-webkit-scrollbar {
                        width: 8px;
                    }

                    .transcript-container::-webkit-scrollbar-track {
                        background: #e5e7eb;
                        border-radius: 4px;
                    }

                    .transcript-container::-webkit-scrollbar-thumb {
                        background: #667eea;
                        border-radius: 4px;
                    }

                    @media (max-width: 768px) {
                        .media-player-modal {
                            max-width: 100%;
                            max-height: 100vh;
                            border-radius: 0;
                        }

                        .teacher-avatar-static {
                            width: 150px;
                            height: 150px;
                        }

                        .audio-controls {
                            flex-direction: column;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
interface AudioTeacherPlayerProps {
    audioUrl: string;
    transcript: string;
    duration: number;
    onClose: () => void;
}
export function AudioTeacherPlayer({ audioUrl, transcript, duration, onClose }: AudioTeacherPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, []);
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const handlePlay = () => {
            setIsPlaying(true);
            setIsSpeaking(true);
        };
        const handlePause = () => {
            setIsPlaying(false);
            setIsSpeaking(false);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setIsSpeaking(false);
        };
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);
    useEffect(() => {
        if (transcriptRef.current && isPlaying) {
            const progress = currentTime / duration;
            const scrollHeight = transcriptRef.current.scrollHeight - transcriptRef.current.clientHeight;
            transcriptRef.current.scrollTop = scrollHeight * progress;
        }
    }, [currentTime, duration, isPlaying]);
    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return (
        <div className="audio-teacher-overlay" onClick={onClose}>
            <div className="audio-teacher-modal" onClick={(e) => e.stopPropagation()}>
                {}
                <div className="modal-header">
                    <h2>🎓 AI Teacher Explanation</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>
                {}
                <div className="modal-body">
                    {}
                    <div className="teacher-avatar-container">
                        <div className={`teacher-avatar ${isSpeaking ? 'speaking' : ''}`}>
                            <img
                                src="/ai_teacher_avatar.png"
                                alt="AI Teacher"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<div class="avatar-fallback">👩‍🏫</div>';
                                }}
                            />
                            {isSpeaking && (
                                <div className="speaking-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}
                        </div>
                        <p className="teacher-name">AI Teacher Angela</p>
                    </div>
                    {}
                    <div className="audio-player">
                        <audio ref={audioRef} src={audioUrl} />
                        <button className="play-pause-btn" onClick={togglePlayPause}>
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        <div className="audio-controls">
                            <span className="time-display">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration}
                                value={currentTime}
                                onChange={handleSeek}
                                className="seek-bar"
                            />
                            <span className="time-display">{formatTime(duration)}</span>
                        </div>
                    </div>
                    {}
                    <div className="transcript-container" ref={transcriptRef}>
                        <h3>📝 Transcript</h3>
                        <div className="transcript-text">
                            {transcript}
                        </div>
                    </div>
                </div>
                <style jsx>{`
                    .audio-teacher-overlay {
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
                    .audio-teacher-modal {
                        background: white;
                        border-radius: 20px;
                        max-width: 800px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
                    .teacher-avatar-container {
                        text-align: center;
                        margin-bottom: 2rem;
                    }
                    .teacher-avatar {
                        width: 200px;
                        height: 200px;
                        margin: 0 auto 1rem;
                        border-radius: 50%;
                        overflow: hidden;
                        border: 5px solid #667eea;
                        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                        position: relative;
                        transition: all 0.3s;
                    }
                    .teacher-avatar.speaking {
                        border-color: #4ade80;
                        box-shadow: 0 10px 30px rgba(74, 222, 128, 0.5);
                        animation: pulse 1.5s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    .teacher-avatar img {
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
                    .speaking-indicator {
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 5px;
                    }
                    .speaking-indicator span {
                        width: 8px;
                        height: 8px;
                        background: #4ade80;
                        border-radius: 50%;
                        animation: bounce 1s infinite;
                    }
                    .speaking-indicator span:nth-child(2) {
                        animation-delay: 0.2s;
                    }
                    .speaking-indicator span:nth-child(3) {
                        animation-delay: 0.4s;
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    .teacher-name {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #667eea;
                        margin: 0;
                    }
                    .audio-player {
                        background: #f9fafb;
                        padding: 1.5rem;
                        border-radius: 15px;
                        margin-bottom: 2rem;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
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
                    .audio-controls {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
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
                        .audio-teacher-modal {
                            max-width: 100%;
                            max-height: 100vh;
                            border-radius: 0;
                        }
                        .teacher-avatar {
                            width: 150px;
                            height: 150px;
                        }
                        .audio-player {
                            flex-direction: column;
                        }
                        .audio-controls {
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
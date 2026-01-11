import { useEffect, useRef, useState } from 'react';

export interface SecurityViolation {
    type: 'fullscreen_exit' | 'tab_switch' | 'copy_attempt' | 'paste_attempt' | 'context_menu';
    timestamp: string;
    questionId?: string;
}

interface UseFullscreenSecurityOptions {
    enabled: boolean;
    onViolation?: (violation: SecurityViolation) => void;
    questionId?: string;
}

export const useFullscreenSecurity = ({
    enabled,
    onViolation,
    questionId
}: UseFullscreenSecurityOptions) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState<SecurityViolation[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const fullscreenAttempted = useRef(false);

    // Log violation
    const logViolation = (type: SecurityViolation['type']) => {
        const violation: SecurityViolation = {
            type,
            timestamp: new Date().toISOString(),
            questionId
        };

        setViolations(prev => [...prev, violation]);
        onViolation?.(violation);

        // Show warning for fullscreen exits
        if (type === 'fullscreen_exit') {
            setShowWarning(true);
        }
    };

    // Enter fullscreen
    const enterFullscreen = async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if ((elem as any).webkitRequestFullscreen) {
                await (elem as any).webkitRequestFullscreen();
            } else if ((elem as any).msRequestFullscreen) {
                await (elem as any).msRequestFullscreen();
            }
            fullscreenAttempted.current = true;
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
        }
    };

    // Exit fullscreen
    const exitFullscreen = async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
        }
    };

    // Check if currently in fullscreen
    const checkFullscreen = () => {
        return !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).msFullscreenElement
        );
    };

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            const inFullscreen = checkFullscreen();
            setIsFullscreen(inFullscreen);

            // If we exited fullscreen and it was previously attempted, log violation
            if (!inFullscreen && fullscreenAttempted.current && enabled) {
                logViolation('fullscreen_exit');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, [enabled, questionId]);

    // Auto-enter fullscreen when enabled
    useEffect(() => {
        if (enabled && !isFullscreen) {
            enterFullscreen();
        } else if (!enabled && isFullscreen) {
            exitFullscreen();
            fullscreenAttempted.current = false;
        }
    }, [enabled]);

    // Monitor tab visibility
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                logViolation('tab_switch');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled, questionId]);

    // Monitor keyboard events
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Detect copy attempts
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                logViolation('copy_attempt');
            }

            // Detect paste attempts
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                logViolation('paste_attempt');
            }

            // Block F12 (developer tools)
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Block Ctrl+Shift+I (developer tools)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Block Ctrl+Shift+C (inspect element)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                return false;
            }

            // Block Ctrl+U (view source)
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, questionId]);

    // Prevent right-click context menu
    useEffect(() => {
        if (!enabled) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            logViolation('context_menu');
            return false;
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, [enabled, questionId]);

    return {
        isFullscreen,
        violations,
        showWarning,
        setShowWarning,
        enterFullscreen,
        exitFullscreen
    };
};

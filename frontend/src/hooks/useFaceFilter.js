import { useState, useRef, useCallback, useEffect } from 'react';

const FILTERS = [
    { id: 'none', label: 'Không', icon: '🚫', style: null },
    { id: 'beauty', label: 'Làm đẹp', icon: '✨', style: 'brightness(1.08) contrast(1.05) saturate(1.1)' },
    { id: 'cool', label: 'Lạnh', icon: '❄️', style: 'saturate(0.8) hue-rotate(20deg) brightness(1.05)' },
    { id: 'warm', label: 'Ấm', icon: '🔥', style: 'saturate(1.3) sepia(0.15) brightness(1.05)' },
    { id: 'vintage', label: 'Cổ điển', icon: '📷', style: 'sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.9)' },
    { id: 'neon', label: 'Neon', icon: '💜', style: 'saturate(1.6) contrast(1.2) brightness(1.1) hue-rotate(-10deg)' },
    { id: 'galaxy', label: 'Galaxy', icon: '🌌', style: 'hue-rotate(40deg) saturate(1.5) contrast(1.15)' },
    { id: 'anime', label: 'Anime', icon: '🎨', style: 'contrast(1.3) saturate(1.4) brightness(1.1)' },
    { id: 'bw', label: 'B&W', icon: '🖤', style: 'grayscale(1) contrast(1.2) brightness(1.05)' },
    { id: 'dreamy', label: 'Dreamy', icon: '🌸', style: 'brightness(1.12) contrast(0.9) saturate(1.2) blur(0.3px)' },
];

// Sticker overlays drawn on canvas
const STICKERS = [
    { id: 'none', label: 'Không', icon: '🚫' },
    { id: 'hearts', label: 'Tim', icon: '💕' },
    { id: 'stars', label: 'Sao', icon: '⭐' },
    { id: 'snow', label: 'Tuyết', icon: '❄️' },
    { id: 'fire', label: 'Lửa', icon: '🔥' },
    { id: 'bubbles', label: 'Bóng', icon: '🫧' },
    { id: 'confetti', label: 'Hoa giấy', icon: '🎉' },
];

export { FILTERS, STICKERS };

export function useFaceFilter() {
    const [activeFilter, setActiveFilter] = useState('none');
    const [activeSticker, setActiveSticker] = useState('none');
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);

    const canvasRef = useRef(null);
    const hiddenVideoRef = useRef(null);
    const animFrameRef = useRef(null);
    const processedStreamRef = useRef(null);
    const particlesRef = useRef([]);
    const activeFilterRef = useRef('none');
    const activeStickerRef = useRef('none');

    // Keep refs in sync
    useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
    useEffect(() => { activeStickerRef.current = activeSticker; }, [activeSticker]);

    // Generate floating particles for stickers
    const generateParticles = useCallback((type, width, height) => {
        const count = 15;
        const emojis = {
            hearts: ['💕', '❤️', '💗', '💖', '💝'],
            stars: ['⭐', '✨', '🌟', '💫'],
            snow: ['❄️', '❆', '❅', '✦'],
            fire: ['🔥', '🧡', '💛', '❤️‍🔥'],
            bubbles: ['🫧', '○', '◯', '◌'],
            confetti: ['🎉', '🎊', '✨', '💫', '🌈'],
        };
        const list = emojis[type] || [];
        return Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 14 + Math.random() * 18,
            speed: 0.3 + Math.random() * 1.2,
            drift: (Math.random() - 0.5) * 0.8,
            emoji: list[Math.floor(Math.random() * list.length)],
            opacity: 0.6 + Math.random() * 0.4,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 3,
        }));
    }, []);


    const startProcessing = useCallback((rawStream) => {
        if (!rawStream) return null;

        // Create hidden video element to feed the canvas
        const video = document.createElement('video');
        video.srcObject = rawStream;
        video.muted = true;
        video.playsInline = true;
        video.play().catch(() => {});
        hiddenVideoRef.current = video;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d');
        let initialized = false;

        const draw = () => {
            if (!hiddenVideoRef.current || hiddenVideoRef.current.paused) {
                animFrameRef.current = requestAnimationFrame(draw);
                return;
            }

            const vw = hiddenVideoRef.current.videoWidth || 640;
            const vh = hiddenVideoRef.current.videoHeight || 480;

            if (!initialized) {
                canvas.width = vw;
                canvas.height = vh;
                initialized = true;
            }

            // Apply CSS filter
            const filterStyle = FILTERS.find(f => f.id === activeFilterRef.current)?.style;
            ctx.filter = filterStyle || 'none';
            ctx.drawImage(hiddenVideoRef.current, 0, 0, vw, vh);
            ctx.filter = 'none';

            // Draw sticker particles
            const sticker = activeStickerRef.current;
            if (sticker !== 'none') {
                if (particlesRef.current.length === 0 || particlesRef.current._type !== sticker) {
                    particlesRef.current = generateParticles(sticker, vw, vh);
                    particlesRef.current._type = sticker;
                }
                particlesRef.current.forEach(p => {
                    ctx.save();
                    ctx.globalAlpha = p.opacity;
                    ctx.font = `${p.size}px serif`;
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillText(p.emoji, 0, 0);
                    ctx.restore();

                    // Animate
                    p.y -= p.speed;
                    p.x += p.drift;
                    p.rotation += p.rotSpeed;
                    if (p.y < -30) {
                        p.y = vh + 20;
                        p.x = Math.random() * vw;
                    }
                    if (p.x < -30) p.x = vw + 20;
                    if (p.x > vw + 30) p.x = -20;
                });
            }

            // Subtle vignette for all filters (except none)
            if (activeFilterRef.current !== 'none') {
                const gradient = ctx.createRadialGradient(
                    vw / 2, vh / 2, vw * 0.35,
                    vw / 2, vh / 2, vw * 0.75
                );
                gradient.addColorStop(0, 'rgba(0,0,0,0)');
                gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, vw, vh);
            }

            animFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        // Capture canvas as stream
        const processed = canvas.captureStream(30);
        // Keep original audio tracks
        rawStream.getAudioTracks().forEach(t => processed.addTrack(t));
        processedStreamRef.current = processed;
        return processed;
    }, [generateParticles]);

    /**
     * Stop the canvas processing loop
     */
    const stopProcessing = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (hiddenVideoRef.current) {
            hiddenVideoRef.current.pause();
            hiddenVideoRef.current.srcObject = null;
            hiddenVideoRef.current = null;
        }
        processedStreamRef.current = null;
        particlesRef.current = [];
        canvasRef.current = null;
    }, []);

    const toggleFilterPanel = useCallback(() => {
        setFilterPanelOpen(prev => !prev);
    }, []);

    return {
        activeFilter,
        setActiveFilter,
        activeSticker,
        setActiveSticker,
        filterPanelOpen,
        setFilterPanelOpen,
        toggleFilterPanel,
        startProcessing,
        stopProcessing,
        processedStreamRef,
        filters: FILTERS,
        stickers: STICKERS,
    };
}

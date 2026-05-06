import React, { useState, useCallback, useRef } from 'react';

import ProgressBars from './ProgressBars';
import DotIndicators from './DotIndicators';
import { ChevronLeftIcon, ChevronRightIcon, PauseCircleIcon } from '../../../icons/SlideshowIcons';
import { useSwipeGesture, useAutoPlay } from '../../../hooks/useSlideshow';

const AUTO_PLAY_DURATION = 3000;

/**
 * ImageSlideshow — Carousel ảnh kiểu TikTok/Instagram Stories.
 *
 * @param {Array<{ id: string, url: string }>} props.images
 * @param {boolean} props.autoPlay
 * @param {number}  props.duration — ms mỗi slide
 * @param {string}  props.className
 */
export default function ImageSlideshow({
  images = [],
  className = '',
  style = {},
  autoPlay = true,
  duration = AUTO_PLAY_DURATION,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const containerRef = useRef(null);
  const holdTimer = useRef(null);

  const total = images.length;

  /* ── Navigation ── */
  const goTo = useCallback((idx) => {
    let next = idx;
    if (next >= total) next = 0;
    if (next < 0) next = total - 1;
    setCurrentIndex(next);
  }, [total]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  /* ── Auto-play ── */
  const { progress, reset: resetTimer } = useAutoPlay({
    duration,
    paused: isPaused || !autoPlay || total <= 1,
    onComplete: goNext,
  });

  const goWithReset = useCallback((idx) => {
    goTo(idx);
    resetTimer();
  }, [goTo, resetTimer]);

  const handleNext = useCallback(() => goWithReset(currentIndex + 1), [currentIndex, goWithReset]);
  const handlePrev = useCallback(() => goWithReset(currentIndex - 1), [currentIndex, goWithReset]);

  /* ── Swipe ── */
  const { onTouchStart: swipeStart, onTouchEnd: swipeEnd } = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  });

  const handleTouchStart = useCallback((e) => {
    swipeStart(e);
    dragStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  }, [swipeStart]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - dragStartX.current;
    setDragOffset(Math.max(-120, Math.min(120, diff)));
  }, [isDragging]);

  const handleTouchEnd = useCallback((e) => {
    swipeEnd(e);
    setIsDragging(false);
    setDragOffset(0);
  }, [swipeEnd]);

  /* ── Long press → pause ── */
  const handlePointerDown = useCallback(() => {
    holdTimer.current = setTimeout(() => {
      setIsPaused(true);
      setShowPauseIcon(true);
    }, 200);
  }, []);

  const handlePointerUp = useCallback(() => {
    clearTimeout(holdTimer.current);
    if (isPaused) {
      setIsPaused(false);
      setShowPauseIcon(false);
    }
  }, [isPaused]);

  /* ── Empty ── */
  if (total === 0) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-black rounded-2xl select-none ${className}`} style={style}>
        <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30 font-body text-sm">
          <p>Chưa có ảnh nào</p>
        </div>
      </div>
    );
  }

  /* ── Track position ── */
  const translateX = -(currentIndex * 100);
  const dragPct = containerRef.current
    ? (dragOffset / containerRef.current.offsetWidth) * 100
    : 0;

  return (
    <div
      ref={containerRef}
      className={`group relative w-full h-full overflow-hidden bg-black rounded-2xl select-none ${className}`}
      style={{ touchAction: 'pan-y', WebkitTapHighlightColor: 'transparent', ...style }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Gradient top (cho progress bars dễ đọc) */}
      <div className="absolute top-0 inset-x-0 h-[60px] bg-gradient-to-b from-black/45 to-transparent z-[15] pointer-events-none" />

      {/* Progress bars */}
      <ProgressBars total={total} currentIndex={currentIndex} progress={progress} />

      {/* Counter "2/5" */}
      {total > 1 && (
        <div className="absolute top-[22px] right-3 z-[25] bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold font-body px-2 py-0.5 rounded-[10px] tracking-wide">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* Slide track */}
      <div
        className={`flex h-full will-change-transform ${isDragging ? '' : 'transition-transform duration-[450ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]'}`}
        style={{ transform: `translateX(${translateX + dragPct}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, i) => (
          <div key={img.id || i} className="flex-shrink-0 w-full h-full relative overflow-hidden">
            <img
              src={img.url}
              alt={img.name || `Ảnh ${i + 1}`}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
              loading={Math.abs(i - currentIndex) <= 1 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Tap zones */}
      <button
        className="absolute top-[50px] bottom-[40px] left-0 w-[35%] z-10 bg-transparent border-none cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onClick={handlePrev}
        aria-label="Ảnh trước"
      />
      <button
        className="absolute top-[50px] bottom-[40px] right-0 w-[65%] z-10 bg-transparent border-none cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onClick={handleNext}
        aria-label="Ảnh tiếp"
      />

      {/* Nav arrows (desktop: hiện khi hover) */}
      {total > 1 && (
        <>
          <button
            className="hidden md:flex absolute top-1/2 left-2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md items-center justify-center border-none cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 active:scale-95"
            onClick={handlePrev}
            aria-label="Ảnh trước"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            className="hidden md:flex absolute top-1/2 right-2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md items-center justify-center border-none cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 active:scale-95"
            onClick={handleNext}
            aria-label="Ảnh tiếp"
          >
            <ChevronRightIcon size={18} />
          </button>
        </>
      )}

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-[50px] bg-gradient-to-t from-black/35 to-transparent z-[15] pointer-events-none" />

      {/* Dot indicators */}
      <DotIndicators total={total} currentIndex={currentIndex} onDotClick={goWithReset} />

      {/* Pause indicator */}
      {showPauseIcon && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[25] text-white/85 pointer-events-none animate-[pauseIn_0.3s_ease-out_forwards]">
          <PauseCircleIcon size={44} />
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook xử lý swipe gesture (trái/phải) cho touch devices.
 * Tái sử dụng được cho bất kỳ component nào cần swipe.
 *
 * @param {Object} options
 * @param {Function} options.onSwipeLeft  — callback khi swipe trái
 * @param {Function} options.onSwipeRight — callback khi swipe phải
 * @param {number}   options.threshold    — khoảng cách tối thiểu (px), mặc định 50
 * @param {number}   options.maxTime      — thời gian tối đa (ms), mặc định 300
 * @returns {{ onTouchStart, onTouchEnd }} — gắn vào element cần detect swipe
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxTime = 300,
} = {}) {
  const startRef = useRef({ x: 0, y: 0, time: 0 });

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;
    const deltaTime = Date.now() - startRef.current.time;

    // Chỉ detect horizontal swipe (|deltaX| > |deltaY|)
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < maxTime) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold, maxTime]);

  return { onTouchStart, onTouchEnd };
}

/**
 * Hook auto-play timer cho slideshow.
 * Trả về progress (0–1) và các hàm pause/resume/reset.
 *
 * @param {Object} options
 * @param {number}   options.duration  — thời gian mỗi slide (ms), mặc định 3000
 * @param {boolean}  options.paused    — tạm dừng timer
 * @param {Function} options.onComplete — callback khi hết thời gian 1 slide
 * @returns {{ progress, pause, resume, reset }}
 */
export function useAutoPlay({
  duration = 3000,
  paused = false,
  onComplete,
} = {}) {
  const TICK = 50; // update mỗi 50ms cho animation mượt
  const [elapsed, setElapsed] = useState(0);
  const pausedRef = useRef(paused);
  const onCompleteRef = useRef(onComplete);

  // Sync refs để tránh stale closure
  pausedRef.current = paused;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      if (pausedRef.current) return;

      setElapsed((prev) => {
        const next = prev + TICK;
        if (next >= duration) {
          onCompleteRef.current?.();
          return 0;
        }
        return next;
      });
    }, TICK);

    return () => clearInterval(interval);
  }, [paused, duration]);

  const reset = useCallback(() => setElapsed(0), []);
  const progress = Math.min(elapsed / duration, 1);

  return { progress, elapsed, reset };
}

/**
 * Hook quản lý danh sách ảnh cho slideshow.
 * Xử lý File → Object URL, cleanup memory, validate.
 *
 * @param {Object} options
 * @param {number} options.maxFiles — tối đa ảnh, mặc định 20
 * @param {number} options.maxSizeMB — size tối đa mỗi ảnh (MB), mặc định 20
 * @returns {{ images, imageFiles, addFiles, removeImage, reorderImages, clearAll, error }}
 */
export function useImageList({ maxFiles = 20, maxSizeMB = 20 } = {}) {
  const [imageFiles, setImageFiles] = useState([]); // File[]
  const [images, setImages] = useState([]);           // { id, url, file }[]
  const [error, setError] = useState('');
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Cleanup blob URLs khi unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  const addFiles = useCallback((files) => {
    setError('');
    const fileArray = Array.from(files);

    // Validate
    const invalidType = fileArray.find((f) => !f.type.startsWith('image/'));
    if (invalidType) {
      setError(`"${invalidType.name}" không phải file ảnh`);
      return;
    }

    const oversized = fileArray.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" vượt quá ${maxSizeMB}MB`);
      return;
    }

    // Đọc current state qua ref để tránh nesting setState
    const currentImages = imagesRef.current;
    const currentCount = currentImages.length;
    const total = currentCount + fileArray.length;

    if (total > maxFiles) {
      setError(`Tối đa ${maxFiles} ảnh. Bạn đã chọn ${currentCount}, thêm ${fileArray.length} sẽ vượt giới hạn.`);
      return;
    }

    // Tạo preview URLs
    const newImages = fileArray.map((f, i) => ({
      id: `${Date.now()}-${currentCount + i}`,
      url: URL.createObjectURL(f),
      file: f,
      name: f.name,
    }));

    // Update cả 2 state ở top level (không nesting)
    setImages((prev) => [...prev, ...newImages]);
    setImageFiles((prev) => [...prev, ...fileArray]);
  }, [maxFiles, maxSizeMB]);

  const removeImage = useCallback((id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const updated = prev.filter((img) => img.id !== id);
      setImageFiles(updated.map((img) => img.file));
      return updated;
    });
    setError('');
  }, []);

  const reorderImages = useCallback((fromIndex, toIndex) => {
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      setImageFiles(updated.map((img) => img.file));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setImageFiles([]);
    setError('');
  }, [images]);

  return { images, imageFiles, addFiles, removeImage, reorderImages, clearAll, error };
}

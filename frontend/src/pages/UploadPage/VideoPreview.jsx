import React, { useMemo, useEffect, useRef } from 'react';

/*
 VideoPreview — preview file video đã chọn và mix nhạc nền
*/
export default function VideoPreview({ 
  file,
  selectedMusic,
  originalVolume,
  musicVolume,
  useOriginalSound
}) {
  const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Sync music to video playback
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const handlePlay = () => { audio.play().catch(() => {}); };
    const handlePause = () => { audio.pause(); };
    const handleSeeked = () => { 
      if (audio.duration) {
        audio.currentTime = video.currentTime % audio.duration; 
      }
    };
    const handleTimeUpdate = () => {
      // resync if they drift too much
      if (audio.duration && Math.abs(audio.currentTime - (video.currentTime % audio.duration)) > 0.5) {
         audio.currentTime = video.currentTime % audio.duration;
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('waiting', handlePause);
    video.addEventListener('playing', handlePlay);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Initial sync
    if (!video.paused) {
      handlePlay();
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('waiting', handlePause);
      video.removeEventListener('playing', handlePlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [selectedMusic]); // re-run if music changes

  // Update volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = useOriginalSound ? originalVolume : 0;
    }
  }, [originalVolume, useOriginalSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  return (
    <div className="w-[300px] h-[460px] rounded-xl overflow-hidden bg-black relative">
      <video 
        ref={videoRef}
        src={videoUrl} 
        controls 
        loop
        autoPlay
        className="w-full h-full object-cover" 
      />
      {selectedMusic && selectedMusic.audioUrl && (
         <audio ref={audioRef} src={selectedMusic.audioUrl} loop />
      )}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 py-2.5 pointer-events-none"
        style={{ background: 'linear-gradient(to top,rgba(0,0,0,.8),transparent)' }}
      >
        <p className="text-white text-xs font-body m-0 truncate shadow-sm">{file.name}</p>
      </div>
    </div>
  );
}
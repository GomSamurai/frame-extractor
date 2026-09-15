import React, { useRef, useState, useEffect } from 'react';
import {
  Upload, Play, Pause, RotateCcw, Volume2, VolumeX,
  ChevronLeft, ChevronRight, SkipBack, SkipForward,
  Film, Scissors, Maximize2, Sparkles, RefreshCw, FolderPlus
} from 'lucide-react';

export default function VideoPlayer({
  videoFile,
  onVideoLoaded,
  onUnloadVideo,
  videoRef,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  inPoint,
  setInPoint,
  outPoint,
  setOutPoint,
  videoDetails,
  setVideoDetails,
  onManualCapture
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTrimmingMode, setIsTrimmingMode] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const fileInputRef = useRef(null);
  const scrubberRef = useRef(null);

  // File loading handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideo(file);
    }
  };

  const loadVideo = (file) => {
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecciona un archivo de vídeo válido.');
      return;
    }
    const url = URL.createObjectURL(file);
    onVideoLoaded(file, url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadVideo(file);
    }
  };

  // Metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setInPoint(0);
      setOutPoint(dur);
      setVideoDetails({
        name: videoFile?.name || 'video_stream',
        size: videoFile?.size ? (videoFile.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Desconocido',
        type: videoFile?.type || 'video/mp4',
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        aspectRatio: (videoRef.current.videoWidth / videoRef.current.videoHeight).toFixed(2)
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
      if (outPoint > 0 && videoRef.current.currentTime >= outPoint && isPlaying) {
        videoRef.current.currentTime = inPoint;
      }
    }
  };

  const seekTo = (time) => {
    const clamped = Math.max(0, Math.min(duration, time));
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  // Real-time Scrubbing Mouse Drag Handlers
  const handleScrubberMouseDown = (e) => {
    setIsScrubbing(true);
    updateScrubberPos(e);
  };

  const updateScrubberPos = (e) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekTo(pos * duration);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isScrubbing) {
        updateScrubberPos(e);
      }
    };
    const handleMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };
    if (isScrubbing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isScrubbing, duration]);

  const stepFrame = (frames) => {
    const frameTime = 1 / 30;
    seekTo(currentTime + frames * frameTime);
  };

  const stepSeconds = (sec) => {
    seekTo(currentTime + sec);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00:00.000';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    const pad = (num, size = 2) => String(num).padStart(size, '0');
    return `${hrs > 0 ? pad(hrs) + ':' : ''}${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  };

  return (
    <div className="glass-panel player-container">
      {/* Top Header / Video Info & Change Video Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Film size={20} color="#06b6d4" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {videoFile ? videoFile.name : 'Carga un archivo de vídeo'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {videoDetails && (
            <>
              <span className="badge badge-cyan">{videoDetails.width}x{videoDetails.height}px</span>
              <span className="badge badge-indigo">{videoDetails.size}</span>
              <span className="badge badge-emerald">{formatTime(duration)}</span>
            </>
          )}

          {videoFile && (
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => fileInputRef.current?.click()}
              title="Seleccionar y abrir otro vídeo"
            >
              <RefreshCw size={14} color="#06b6d4" /> Cambiar Vídeo
            </button>
          )}
        </div>
      </div>

      {/* Screen Area / Dropzone */}
      <div className="video-screen-wrapper">
        {videoFile ? (
          <video
            ref={videoRef}
            src={videoFile.url}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div
            className={`dropzone-overlay ${isDragOver ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon-circle">
              <Upload size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                Arrastra y suelta tu vídeo aquí
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Soporta archivos MP4, WebM, MOV, AVI, OGG y más
              </p>
            </div>
            <button className="btn btn-primary" type="button">
              Explorar Archivos Locales
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          style={{ display: 'none' }}
        />
      </div>

      {/* Video Scrubber & Trimming Bar */}
      {videoFile && (
        <div className="player-controls-bar">
          {/* Interactive Real-Time Scrubber Wrapper */}
          <div
            className="timeline-scrubber-wrapper"
            ref={scrubberRef}
            onMouseDown={handleScrubberMouseDown}
            onTouchStart={handleScrubberMouseDown}
          >
            <div className="timeline-scrubber">
              {/* Trimmed In/Out Range Highlight */}
              {duration > 0 && (
                <div
                  className="timeline-inout-range"
                  style={{
                    left: `${(inPoint / duration) * 100}%`,
                    width: `${((outPoint - inPoint) / duration) * 100}%`
                  }}
                />
              )}
              {/* Current Playhead Progress */}
              <div
                className="timeline-progress"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Playhead Thumb Indicator */}
              <div
                className="timeline-thumb"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Controls Bar */}
          <div className="controls-row">
            {/* Playback & Frame Precision */}
            <div className="control-group">
              <button className="btn btn-secondary btn-icon-only" onClick={togglePlay} title="Reproducir/Pausar (Espacio)">
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 0.2rem' }} />

              <button className="btn btn-secondary btn-icon-only" onClick={() => stepSeconds(-1)} title="Atrás 1 segundo">
                <SkipBack size={16} />
              </button>
              <button className="btn btn-secondary btn-icon-only" onClick={() => stepFrame(-1)} title="Fotograma anterior (-1 Frame)">
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary btn-icon-only" onClick={() => stepFrame(1)} title="Fotograma siguiente (+1 Frame)">
                <ChevronRight size={16} />
              </button>
              <button className="btn btn-secondary btn-icon-only" onClick={() => stepSeconds(1)} title="Adelante 1 segundo">
                <SkipForward size={16} />
              </button>
            </div>

            {/* Time Indicator */}
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* In/Out Trim Controls & Snapshot Action */}
            <div className="control-group">
              <button
                className={`btn ${isTrimmingMode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                onClick={() => setIsTrimmingMode(!isTrimmingMode)}
                title="Recortar rango de interés para extracción automática"
              >
                <Scissors size={14} /> Recortar Rango
              </button>

              <button className="btn btn-accent" onClick={onManualCapture} title="Captura manual instantánea (S)">
                <Sparkles size={16} /> Capturar Frame
              </button>
            </div>
          </div>

          {/* Trimming Range Sliders Panel */}
          {isTrimmingMode && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '0.5rem',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Punto IN: <strong style={{ color: '#67e8f9' }}>{formatTime(inPoint)}</strong></span>
                <span>Punto OUT: <strong style={{ color: '#67e8f9' }}>{formatTime(outPoint)}</strong></span>
                <span>Duración Segmento: <strong>{formatTime(outPoint - inPoint)}</strong></span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Punto de Inicio (IN)</label>
                  <input
                    type="range"
                    min={0}
                    max={outPoint - 0.1}
                    step={0.1}
                    value={inPoint}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setInPoint(val);
                      seekTo(val);
                    }}
                    className="range-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Punto de Fin (OUT)</label>
                  <input
                    type="range"
                    min={inPoint + 0.1}
                    max={duration}
                    step={0.1}
                    value={outPoint}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setOutPoint(val);
                      seekTo(val);
                    }}
                    className="range-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

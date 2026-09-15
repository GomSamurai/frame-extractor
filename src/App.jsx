import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ExtractionControlHub from './components/ExtractionControlHub';
import FrameGallery from './components/FrameGallery';
import ExportSettingsModal from './components/ExportSettingsModal';
import ContactSheetModal from './components/ContactSheetModal';
import MoodboardCanvasModal from './components/MoodboardCanvasModal';
import AboutAppModal from './components/AboutAppModal';
import AppLogoIcon from './components/AppLogoIcon';
import { evaluateFrameWithAI, seekVideoToTime, selectDiverseTopFrames } from './utils/localVisionAI';
import { Camera, Settings, HelpCircle, Sparkles, Layers, ShieldCheck, Zap, Bot, LayoutGrid, Pin } from 'lucide-react';

export default function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoDetails, setVideoDetails] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);

  const [frames, setFrames] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('Analizando fotogramas...');

  // Moodboard Pizarra State
  const [moodboardItems, setMoodboardItems] = useState([]);
  const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);

  // Export Settings State
  const [exportSettings, setExportSettings] = useState({
    format: 'png',
    quality: 0.92,
    scale: '1',
    burnTimestamp: false,
    namingPattern: '{video}_frame_{index}_{timestamp}'
  });

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const videoRef = useRef(null);

  // Theme Preset State (Default: Sunset Amber)
  const [theme, setTheme] = useState(() => localStorage.getItem('frame_extractor_theme') || 'sunset-amber');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('frame_extractor_theme', theme);
  }, [theme]);

  // Load video handler
  const handleVideoLoaded = (file, url) => {
    setVideoFile({ file, url, name: file.name, size: file.size, type: file.type });
  };

  const handleUnloadVideo = () => {
    if (videoFile?.url) {
      URL.revokeObjectURL(videoFile.url);
    }
    setVideoFile(null);
    setVideoDetails(null);
    setCurrentTime(0);
    setDuration(0);
    setInPoint(0);
    setOutPoint(0);
  };

  // Add frames to Moodboard Pizarra
  const handleAddToMoodboard = (targetFrames) => {
    const framesArray = Array.isArray(targetFrames) ? targetFrames : [targetFrames];
    const newBoardItems = framesArray.map((frame, index) => {
      const aspectRatio = frame.width && frame.height ? frame.width / frame.height : (16 / 9);
      const defaultW = 320;
      const defaultH = Math.round(defaultW / aspectRatio);
      return {
        id: `mb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${index}`,
        type: 'image',
        dataUrl: frame.dataUrl,
        x: 60 + (moodboardItems.length + index) * 35,
        y: 60 + (moodboardItems.length + index) * 25,
        width: defaultW,
        height: defaultH,
        aspectRatio,
        rotation: 0,
        zIndex: moodboardItems.length + index + 1,
        sourceVideo: videoFile?.name || 'video',
        timestampFormatted: frame.timestampFormatted
      };
    });
    setMoodboardItems(prev => [...prev, ...newBoardItems]);
    setIsMoodboardOpen(true);
  };

  const handleRemoveMoodboardItem = (id) => {
    setMoodboardItems(prev => prev.filter(item => item.id !== id));
  };

  // Format Timestamp Helper
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00:00.000';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    const pad = (num, size = 2) => String(num).padStart(size, '0');
    return `${hrs > 0 ? pad(hrs) + ':' : ''}${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  };

  // Capture Single Frame Bitmap from Video Ref
  const extractFrameDataAtTime = async (targetTime) => {
    const video = videoRef.current;
    if (!video) return null;

    if (targetTime !== undefined) {
      await seekVideoToTime(video, targetTime);
    }

    const canvas = document.createElement('canvas');
    let width = video.videoWidth;
    let height = video.videoHeight;

    // Apply scale settings
    if (exportSettings.scale === '0.75') {
      width = Math.round(width * 0.75);
      height = Math.round(height * 0.75);
    } else if (exportSettings.scale === '0.5') {
      width = Math.round(width * 0.5);
      height = Math.round(height * 0.5);
    } else if (exportSettings.scale === '1080p' && width > 1920) {
      const ratio = 1920 / width;
      width = 1920;
      height = Math.round(height * ratio);
    } else if (exportSettings.scale === '720p' && width > 1280) {
      const ratio = 1280 / width;
      width = 1280;
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    // Timestamp Overlay Burn-in if enabled
    if (exportSettings.burnTimestamp) {
      const tsText = formatTime(video.currentTime);
      ctx.font = 'bold 18px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(tsText).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(width - textWidth - 24, height - 44, textWidth + 18, 34);

      ctx.fillStyle = '#67e8f9';
      ctx.fillText(tsText, width - textWidth - 15, height - 20);
    }

    let mimeType = 'image/png';
    if (exportSettings.format === 'jpeg') mimeType = 'image/jpeg';
    if (exportSettings.format === 'webp') mimeType = 'image/webp';

    const dataUrl = canvas.toDataURL(mimeType, exportSettings.quality);

    const timeFormatted = formatTime(video.currentTime).replace(/:/g, '-');
    const cleanVideoName = (videoFile?.name || 'video').replace(/\.[^/.]+$/, "");
    const filename = `${cleanVideoName}_frame_${timeFormatted}.${exportSettings.format}`;

    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dataUrl,
      timestamp: video.currentTime,
      timestampFormatted: formatTime(video.currentTime),
      width,
      height,
      filename
    };
  };

  // Manual Snapshot trigger
  const handleManualCapture = async () => {
    if (!videoRef.current || duration <= 0) return;
    const newFrame = await extractFrameDataAtTime(videoRef.current.currentTime);
    if (newFrame) {
      setFrames(prev => [newFrame, ...prev]);
    }
  };

  // Batch Extraction Processor (Standard + Local Vision AI with Dynamic Diversity)
  const handleRunBatchExtraction = async (config) => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatusText('Iniciando extracción...');
    const newExtracted = [];

    const { mode, inPoint: start, outPoint: end, duration: dur, params } = config;

    let targetTimes = [];

    try {
      if (mode === 'smart-ai') {
        const step = params.sampleInterval || 0.5;
        const samples = [];
        const totalSteps = Math.floor(dur / step);
        let stepCount = 0;

        setProcessingStatusText(`Escaneando vídeo (${totalSteps} muestras)...`);

        // Scan video with AI evaluation
        for (let t = start; t <= end; t += step) {
          stepCount++;
          const evalResult = await evaluateFrameWithAI(video, t, { userPrompt: params.customPrompt });
          if (evalResult) {
            samples.push(evalResult);
          }
          setProcessingProgress(Math.round((stepCount / Math.max(1, totalSteps)) * 50));
        }

        setProcessingStatusText('Analizando diversidad temporal y filtrando mejores coincidencias...');

        let filtered = [...samples];

        // Enforce Facial Precision Filters
        if (params.filterBlinking !== false) {
          const openEyesOnly = filtered.filter(s => !s.facial.isBlinking);
          if (openEyesOnly.length > 0) filtered = openEyesOnly;
        }

        if (params.filterVocalizing !== false) {
          const naturalMouthOnly = filtered.filter(s => !s.facial.isAwkwardMouth);
          if (naturalMouthOnly.length > 0) filtered = naturalMouthOnly;
        }

        // Apply sub-tab specific AI filters with DYNAMIC DIVERSITY SELECTION
        const sub = params.aiSubTab || 'custom-prompt';
        const maxCaptures = params.maxCaptures || 12;
        const minTimeGap = Math.max(0.8, dur / (maxCaptures * 1.8));

        let selectedSamples = [];

        if (sub === 'custom-prompt') {
          const matched = filtered.filter(s => s.customMatch.isMatched);
          selectedSamples = selectDiverseTopFrames(
            matched.length > 0 ? matched : filtered,
            s => s.customMatch.matchScore,
            maxCaptures,
            minTimeGap
          );
        } else if (sub === 'sharpness') {
          selectedSamples = selectDiverseTopFrames(
            filtered,
            s => s.sharpness,
            maxCaptures,
            minTimeGap
          );
        } else if (sub === 'couples') {
          const targetCls = params.targetSubjectFilter || '1-persona';
          const matched = filtered.filter(s => s.subjects.classification === targetCls);
          selectedSamples = selectDiverseTopFrames(
            matched.length > 0 ? matched : filtered,
            s => s.emotion.smileScore * 0.5 + s.overallScore * 0.5,
            maxCaptures,
            minTimeGap
          );
        } else if (sub === 'objects') {
          const matched = filtered.filter(s => s.objects.isAnimal || s.objects.isVehicle || s.objects.isNature);
          selectedSamples = selectDiverseTopFrames(
            matched.length > 0 ? matched : filtered,
            s => s.objects.furRatio + s.objects.natureRatio + s.overallScore * 0.2,
            maxCaptures,
            minTimeGap
          );
        } else {
          // Combined AI Curator
          selectedSamples = selectDiverseTopFrames(
            filtered,
            s => s.overallScore,
            maxCaptures,
            minTimeGap
          );
        }

        targetTimes = selectedSamples.map(f => f.time);
      } else if (mode === 'uniform') {
        const count = params.count || 10;
        const step = count > 1 ? dur / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
          targetTimes.push(start + i * step);
        }
      } else if (mode === 'interval') {
        const interval = params.interval || 2;
        for (let t = start; t <= end; t += interval) {
          targetTimes.push(t);
        }
      } else if (mode === 'random') {
        const count = params.count || 8;
        const minGap = params.minGap || 0.5;
        const rawTimes = [];
        while (rawTimes.length < count) {
          const rTime = start + Math.random() * dur;
          if (!rawTimes.some(t => Math.abs(t - rTime) < minGap)) {
            rawTimes.push(rTime);
          }
          if (rawTimes.length > count * 10) break;
        }
        targetTimes = rawTimes.sort((a, b) => a - b);
      } else if (mode === 'burst') {
        const count = params.count || 10;
        const step = params.step || 0.1;
        const center = params.centerTime || video.currentTime;
        const startTime = Math.max(start, center - (count / 2) * step);
        for (let i = 0; i < count; i++) {
          const t = startTime + i * step;
          if (t <= end) targetTimes.push(t);
        }
      } else if (mode === 'scene') {
        const step = params.step || 0.5;
        const threshold = (params.threshold || 20) / 100;
        let prevImageData = null;
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 160;
        sampleCanvas.height = 90;
        const sampleCtx = sampleCanvas.getContext('2d');

        for (let t = start; t <= end; t += step) {
          await seekVideoToTime(video, t);
          sampleCtx.drawImage(video, 0, 0, 160, 90);
          const currentData = sampleCtx.getImageData(0, 0, 160, 90).data;

          if (prevImageData) {
            let diffSum = 0;
            for (let i = 0; i < currentData.length; i += 4) {
              const rDiff = Math.abs(currentData[i] - prevImageData[i]);
              const gDiff = Math.abs(currentData[i + 1] - prevImageData[i + 1]);
              const bDiff = Math.abs(currentData[i + 2] - prevImageData[i + 2]);
              diffSum += (rDiff + gDiff + bDiff) / 3;
            }
            const avgDiffRatio = diffSum / (currentData.length / 4) / 255;
            if (avgDiffRatio >= threshold) {
              targetTimes.push(t);
            }
          } else {
            targetTimes.push(t);
          }
          prevImageData = currentData;
        }
      }

      setProcessingStatusText(`Renderizando ${targetTimes.length} fotogramas a máxima resolución...`);
      const originalTime = video.currentTime;
      const startProgressBase = mode === 'smart-ai' ? 50 : 0;

      for (let index = 0; index < targetTimes.length; index++) {
        const t = targetTimes[index];
        const frameData = await extractFrameDataAtTime(t);
        if (frameData) {
          newExtracted.push(frameData);
        }
        const p = startProgressBase + Math.round(((index + 1) / Math.max(1, targetTimes.length)) * (100 - startProgressBase));
        setProcessingProgress(p);
      }

      await seekVideoToTime(video, originalTime);
      setFrames(prev => [...newExtracted, ...prev]);
    } catch (err) {
      console.error('Error durante la extracción:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFrame = (id) => {
    setFrames(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAllFrames = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todas las capturas de la galería?')) {
      setFrames([]);
    }
  };

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleManualCapture();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play();
          else videoRef.current.pause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, exportSettings, videoFile]);

  return (
    <div className="app-container">
      {/* Top Header Navbar */}
      <header className="glass-panel app-header">
        <div className="brand-badge" onClick={() => setIsAboutOpen(true)} style={{ cursor: 'pointer' }} title="Acerca de Frame Extractor (Diseñada por Fran Gómez)">
          <div className="brand-icon-wrapper">
            <AppLogoIcon size={28} />
          </div>
          <div>
            <h1 className="brand-title">Frame Extractor</h1>
          </div>
        </div>

        <div className="header-actions">
          {/* Theme Selector Pill */}
          <div className="theme-selector" title="Seleccionar Preset de Color">
            <div
              className={`theme-dot ${theme === 'cyber-violet' ? 'active' : ''}`}
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
              onClick={() => setTheme('cyber-violet')}
              title="Tema Cyber Violet"
            />
            <div
              className={`theme-dot ${theme === 'emerald-mint' ? 'active' : ''}`}
              style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
              onClick={() => setTheme('emerald-mint')}
              title="Tema Emerald Mint"
            />
            <div
              className={`theme-dot ${theme === 'sunset-amber' ? 'active' : ''}`}
              style={{ background: 'linear-gradient(135deg, #e11d48, #f59e0b)' }}
              onClick={() => setTheme('sunset-amber')}
              title="Tema Sunset Amber"
            />
            <div
              className={`theme-dot ${theme === 'electric-blue' ? 'active' : ''}`}
              style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)' }}
              onClick={() => setTheme('electric-blue')}
              title="Tema Electric Blue"
            />
            <div
              className={`theme-dot ${theme === 'neon-magenta' ? 'active' : ''}`}
              style={{ background: 'linear-gradient(135deg, #c026d3, #ec4899)' }}
              onClick={() => setTheme('neon-magenta')}
              title="Tema Neon Magenta"
            />
          </div>

          <button
            className="btn btn-accent"
            onClick={() => setIsMoodboardOpen(true)}
            title="Abrir Pizarra Infinite Moodboard PureRef"
          >
            <Sparkles size={16} /> Pizarra Moodboard ({moodboardItems.length})
          </button>

          {frames.length > 0 && (
            <span className="badge badge-emerald">
              <Layers size={14} /> {frames.length} Fotogramas
            </span>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => setIsSettingsOpen(true)}
            title="Ajustes de Exportación"
          >
            <Settings size={18} /> Ajustes
          </button>

          <button
            className="btn btn-secondary btn-icon-only"
            onClick={() => setIsHelpOpen(true)}
            title="Atajos e Información"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="main-workspace">
        {/* Left Column: Video Player */}
        <VideoPlayer
          videoFile={videoFile}
          onVideoLoaded={handleVideoLoaded}
          onUnloadVideo={handleUnloadVideo}
          videoRef={videoRef}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          duration={duration}
          setDuration={setDuration}
          inPoint={inPoint}
          setInPoint={setInPoint}
          outPoint={outPoint}
          setOutPoint={setOutPoint}
          videoDetails={videoDetails}
          setVideoDetails={setVideoDetails}
          onManualCapture={handleManualCapture}
        />

        {/* Right Column: Extractor Control Hub */}
        <ExtractionControlHub
          videoRef={videoRef}
          duration={duration}
          inPoint={inPoint}
          outPoint={outPoint}
          isProcessing={isProcessing}
          onRunBatchExtraction={handleRunBatchExtraction}
          onOpenContactSheet={() => setIsContactSheetOpen(true)}
        />
      </main>

      {/* Processing Progress Bar Notification */}
      {isProcessing && (
        <div className="glass-panel-elevated" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Sparkles size={20} color="#06b6d4" className="spin" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
              <span>{processingStatusText}</span>
              <strong>{processingProgress}%</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${processingProgress}%`, height: '100%', background: 'var(--gradient-brand)', transition: 'width 0.2s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* Full Width Gallery Section */}
      <FrameGallery
        frames={frames}
        setFrames={setFrames}
        onDeleteFrame={handleDeleteFrame}
        onClearAllFrames={handleClearAllFrames}
        exportSettings={exportSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddToMoodboard={handleAddToMoodboard}
      />

      {/* Modals */}
      <AboutAppModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <MoodboardCanvasModal
        isOpen={isMoodboardOpen}
        onClose={() => setIsMoodboardOpen(false)}
        items={moodboardItems}
        setItems={setMoodboardItems}
        onRemoveItem={handleRemoveMoodboardItem}
      />

      {/* Modals */}
      <ExportSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        exportSettings={exportSettings}
        setExportSettings={setExportSettings}
      />

      <ContactSheetModal
        isOpen={isContactSheetOpen}
        onClose={() => setIsContactSheetOpen(false)}
        videoRef={videoRef}
        videoDetails={videoDetails}
        duration={duration}
        inPoint={inPoint}
        outPoint={outPoint}
      />

      {/* Help & Hotkeys Modal */}
      {isHelpOpen && (
        <div className="modal-backdrop" onClick={() => setIsHelpOpen(false)}>
          <div className="glass-panel-elevated modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="#06b6d4" /> Guía de Atajos de Teclado
              </h3>
              <button className="btn btn-secondary btn-icon-only" onClick={() => setIsHelpOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span>Captura Manual de Fotograma:</span>
                <code style={{ color: '#67e8f9', fontWeight: 700 }}>Tecla S</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span>Navegar Galería Ampliada:</span>
                <code style={{ color: '#67e8f9', fontWeight: 700 }}>Flechas Izquierda / Derecha</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <span>Reproducir / Pausar Vídeo:</span>
                <code style={{ color: '#67e8f9', fontWeight: 700 }}>Barra Espaciadora</code>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#10b981" />
              Procesamiento 100% privado y en cliente. Tu vídeo nunca sale de tu equipo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

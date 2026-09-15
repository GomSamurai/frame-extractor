import React, { useState, useRef, useEffect } from 'react';
import { Grid, X, Download, Copy, RefreshCw, Sparkles, Check } from 'lucide-react';

export default function ContactSheetModal({
  isOpen,
  onClose,
  videoRef,
  videoDetails,
  duration,
  inPoint,
  outPoint
}) {
  if (!isOpen) return null;

  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contactSheetUrl, setContactSheetUrl] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const previewCanvasRef = useRef(null);

  const totalFrames = cols * rows;

  const generateContactSheet = async () => {
    if (!videoRef.current || duration <= 0) return;
    setIsGenerating(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // High res thumbnail dimensions per cell
    const thumbWidth = 480;
    const thumbHeight = Math.round(thumbWidth / (videoDetails?.aspectRatio || (16 / 9)));
    const padding = 16;
    const headerHeight = 120;

    const canvasWidth = cols * thumbWidth + (cols + 1) * padding;
    const canvasHeight = headerHeight + rows * thumbHeight + (rows + 1) * padding;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header background gradient
    const headerGrad = ctx.createLinearGradient(0, 0, canvasWidth, headerHeight);
    headerGrad.addColorStop(0, '#1e1b4b');
    headerGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, canvasWidth, headerHeight);

    // Header Title & Info
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('FrameForge Studio - Storyboard Contact Sheet', padding, 40);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px Inter, sans-serif';
    const videoName = videoDetails?.name || 'Video';
    ctx.fillText(`Vídeo: ${videoName} | Duración: ${Math.round(duration)}s | Cuadrícula: ${cols}x${rows} (${totalFrames} frames)`, padding, 75);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px JetBrains Mono, monospace';
    ctx.fillText(`Generado: ${new Date().toLocaleString()}`, padding, 100);

    // Calculate timestamps
    const times = [];
    const effectiveDur = outPoint - inPoint;
    for (let i = 0; i < totalFrames; i++) {
      const step = totalFrames > 1 ? effectiveDur / (totalFrames - 1) : 0;
      times.push(inPoint + i * step);
    }

    // Helper to format time
    const formatTs = (sec) => {
      const mins = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 100);
      return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    };

    // Draw each frame cell
    const originalTime = video.currentTime;

    for (let index = 0; index < times.length; index++) {
      const time = times[index];
      video.currentTime = time;

      await new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = padding + col * (thumbWidth + padding);
      const y = headerHeight + padding + row * (thumbHeight + padding);

      // Draw video frame
      ctx.drawImage(video, x, y, thumbWidth, thumbHeight);

      // Draw cell border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, thumbWidth, thumbHeight);

      // Draw timestamp badge at bottom right of thumbnail
      const tsText = formatTs(time);
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(tsText).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + thumbWidth - textWidth - 20, y + thumbHeight - 32, textWidth + 16, 26);

      ctx.fillStyle = '#67e8f9';
      ctx.fillText(tsText, x + thumbWidth - textWidth - 12, y + thumbHeight - 14);
    }

    // Restore original video playback time
    video.currentTime = originalTime;

    const resultUrl = canvas.toDataURL('image/png');
    setContactSheetUrl(resultUrl);
    setIsGenerating(false);
  };

  useEffect(() => {
    generateContactSheet();
  }, [cols, rows]);

  const copyToClipboard = async () => {
    if (!contactSheetUrl) return;
    try {
      const resp = await fetch(contactSheetUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      alert('No se pudo copiar directamente al portapapeles.');
    }
  };

  const downloadContactSheet = () => {
    if (!contactSheetUrl) return;
    const link = document.createElement('a');
    link.href = contactSheetUrl;
    link.download = `Storyboard_${videoDetails?.name || 'video'}_${cols}x${rows}.png`;
    link.click();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel-elevated modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Grid size={22} color="#06b6d4" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Generador de Storyboard / Hoja de Contacto</h3>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Configuration Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Columnas:</span>
            <select
              className="select-input"
              style={{ width: '80px', padding: '0.3rem 0.5rem' }}
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filas:</span>
            <select
              className="select-input"
              style={{ width: '80px', padding: '0.3rem 0.5rem' }}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <span className="badge badge-indigo">Total: {totalFrames} fotogramas</span>

          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', marginLeft: 'auto' }} onClick={generateContactSheet} disabled={isGenerating}>
            <RefreshCw size={14} className={isGenerating ? 'spin' : ''} /> Regenerar
          </button>
        </div>

        {/* Canvas Result View */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxHeight: '60vh',
          background: '#000',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '1rem',
          border: '1px solid var(--border-subtle)'
        }}>
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <Sparkles size={32} color="#06b6d4" style={{ marginBottom: '0.5rem' }} />
              <p>Generando cuadrícula de {cols}x{rows} fotogramas...</p>
            </div>
          ) : (
            contactSheetUrl && (
              <img
                src={contactSheetUrl}
                alt="Storyboard"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
              />
            )
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={copyToClipboard} disabled={!contactSheetUrl}>
            {isCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {isCopied ? '¡Copiado!' : 'Copiar Imagen'}
          </button>
          <button className="btn btn-primary" onClick={downloadContactSheet} disabled={!contactSheetUrl}>
            <Download size={16} /> Descargar Storyboard (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}

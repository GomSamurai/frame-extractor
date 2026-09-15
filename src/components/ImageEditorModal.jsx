import React, { useState, useRef, useEffect } from 'react';
import { Sliders, X, Check, Crop, RefreshCw, Sun, Contrast, Palette, Zap } from 'lucide-react';

export default function ImageEditorModal({
  isOpen,
  onClose,
  frame,
  onSaveEditedFrame
}) {
  if (!isOpen || !frame) return null;

  const [brightness, setBrightness] = useState(100); // 0 to 200%
  const [contrast, setContrast] = useState(100);   // 0 to 200%
  const [saturation, setSaturation] = useState(100); // 0 to 200%
  const [sharpnessBlur, setSharpnessBlur] = useState(0); // -10 (blur) to +10 (sharp)
  const [cropAspectRatio, setCropAspectRatio] = useState('free'); // 'free', '1:1', '16:9', '4:5'

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = frame.dataUrl;
    img.onload = () => {
      imageRef.current = img;
      applyFilters();
    };
  }, [frame, brightness, contrast, saturation, sharpnessBlur, cropAspectRatio]);

  const applyFilters = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    // Handle Aspect Ratio Cropping
    let cropX = 0, cropY = 0, cropW = targetW, cropH = targetH;
    if (cropAspectRatio === '1:1') {
      const minDim = Math.min(targetW, targetH);
      cropW = minDim;
      cropH = minDim;
      cropX = (targetW - minDim) / 2;
      cropY = (targetH - minDim) / 2;
    } else if (cropAspectRatio === '16:9') {
      const desiredH = Math.round(targetW * (9 / 16));
      if (desiredH <= targetH) {
        cropH = desiredH;
        cropY = (targetH - desiredH) / 2;
      } else {
        const desiredW = Math.round(targetH * (16 / 9));
        cropW = desiredW;
        cropX = (targetW - desiredW) / 2;
      }
    } else if (cropAspectRatio === '4:5') {
      const desiredH = Math.round(targetW * (5 / 4));
      if (desiredH <= targetH) {
        cropH = desiredH;
        cropY = (targetH - desiredH) / 2;
      } else {
        const desiredW = Math.round(targetH * (4 / 5));
        cropW = desiredW;
        cropX = (targetW - desiredW) / 2;
      }
    }

    canvas.width = cropW;
    canvas.height = cropH;

    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpnessBlur(0);
    setCropAspectRatio('free');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const editedDataUrl = canvas.toDataURL('image/png', 0.95);

    const editedFrame = {
      ...frame,
      id: `${Date.now()}_edited`,
      dataUrl: editedDataUrl,
      width: canvas.width,
      height: canvas.height,
      filename: `edited_${frame.filename}`
    };

    onSaveEditedFrame(editedFrame);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel-elevated modal-content" style={{ maxWidth: '950px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={22} color="#06b6d4" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editor Fotográfico de Fotograma</h3>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0, marginTop: '0.5rem' }}>
          {/* Canvas Viewport */}
          <div style={{
            background: '#000',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            overflow: 'hidden',
            maxHeight: '60vh'
          }}>
            <canvas
              ref={canvasRef}
              style={{ maxWidth: '100%', maxHeight: '58vh', objectFit: 'contain', borderRadius: '4px' }}
            />
          </div>

          {/* Controls Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {/* Aspect Ratio Crop */}
            <div className="option-group">
              <label className="option-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Crop size={16} /> Recorte de Proporción
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                {[
                  { id: 'free', label: 'Original' },
                  { id: '1:1', label: '1:1 Cuadrado' },
                  { id: '16:9', label: '16:9 Cine' },
                  { id: '4:5', label: '4:5 Retrato' }
                ].map(item => (
                  <button
                    key={item.id}
                    className={`btn ${cropAspectRatio === item.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setCropAspectRatio(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness */}
            <div className="option-group">
              <div className="option-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sun size={15} /> Brillo:
                </span>
                <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>{brightness}%</strong>
              </div>
              <input
                type="range"
                min={40}
                max={180}
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="range-input"
              />
            </div>

            {/* Contrast */}
            <div className="option-group">
              <div className="option-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Contrast size={15} /> Contraste:
                </span>
                <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>{contrast}%</strong>
              </div>
              <input
                type="range"
                min={40}
                max={180}
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="range-input"
              />
            </div>

            {/* Saturation */}
            <div className="option-group">
              <div className="option-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Palette size={15} /> Saturación / Color:
                </span>
                <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>{saturation}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="range-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
                <RefreshCw size={14} /> Restablecer
              </button>
              <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={handleSave}>
                <Check size={16} /> Guardar Copia Editada
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Settings, X, Check, Sliders, Image, FileText, Stamp } from 'lucide-react';

export default function ExportSettingsModal({
  isOpen,
  onClose,
  exportSettings,
  setExportSettings
}) {
  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel-elevated modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={22} color="#6366f1" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ajustes de Exportación</h3>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          {/* Format Picker */}
          <div className="option-group">
            <label className="option-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Image size={16} /> Formato de Imagen
              </span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {['png', 'jpeg', 'webp'].map((fmt) => (
                <button
                  key={fmt}
                  className={`btn ${exportSettings.format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}
                  onClick={() => handleChange('format', fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* JPEG Quality Slider */}
          {exportSettings.format === 'jpeg' && (
            <div className="option-group">
              <div className="option-label">
                <span>Calidad JPEG:</span>
                <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(exportSettings.quality * 100)}%
                </strong>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={exportSettings.quality}
                onChange={(e) => handleChange('quality', parseFloat(e.target.value))}
                className="range-input"
              />
            </div>
          )}

          {/* Scale Resolution */}
          <div className="option-group">
            <label className="option-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={16} /> Escala y Resolución
              </span>
            </label>
            <select
              className="select-input"
              value={exportSettings.scale}
              onChange={(e) => handleChange('scale', e.target.value)}
            >
              <option value="1">Original (100% de la resolución del vídeo)</option>
              <option value="0.75">75% de resolución</option>
              <option value="0.5">50% de resolución (Mitad de tamaño)</option>
              <option value="1080p">Escalar a 1080p Max Width (1920px)</option>
              <option value="720p">Escalar a 720p Max Width (1280px)</option>
            </select>
          </div>

          {/* Timestamp Burn-in Overlay Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.8rem 1rem',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Stamp size={16} color="#06b6d4" /> Estampar Marca de Tiempo
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Imprime la marca de tiempo exacta (ej. 00:01:23.450) en la esquina de la imagen exportada.
              </p>
            </div>
            <input
              type="checkbox"
              checked={exportSettings.burnTimestamp}
              onChange={(e) => handleChange('burnTimestamp', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          {/* Naming Template */}
          <div className="option-group">
            <label className="option-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} /> Plantilla de Nombre de Archivo
              </span>
            </label>
            <input
              type="text"
              className="number-input"
              value={exportSettings.namingPattern}
              onChange={(e) => handleChange('namingPattern', e.target.value)}
              placeholder="{video}_frame_{index}_{timestamp}"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Variables disponibles: <code>{'{video}'}</code>, <code>{'{index}'}</code>, <code>{'{timestamp}'}</code>
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            <Check size={16} /> Guardar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
}

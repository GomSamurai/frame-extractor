import React, { useState, useEffect } from 'react';
import {
  Images, Download, Trash2, CheckSquare, Square, Copy,
  Maximize2, X, ChevronLeft, ChevronRight, Archive, Sparkles, Check,
  Edit3, Columns, Filter, Pin
} from 'lucide-react';
import JSZip from 'jszip';
import ImageEditorModal from './ImageEditorModal';
import CompareFramesModal from './CompareFramesModal';
import { filterDuplicateFrames } from '../utils/perceptualHash';

export default function FrameGallery({
  frames,
  setFrames,
  onDeleteFrame,
  onClearAllFrames,
  exportSettings,
  onOpenSettings,
  onAddToMoodboard
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lightboxFrame, setLightboxFrame] = useState(null);
  const [editingFrame, setEditingFrame] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === frames.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(frames.map(f => f.id)));
    }
  };

  const deleteSelected = () => {
    selectedIds.forEach(id => onDeleteFrame(id));
    setSelectedIds(new Set());
  };

  const handleFilterDuplicates = () => {
    const initialCount = frames.length;
    const unique = filterDuplicateFrames(frames, 8);
    const removedCount = initialCount - unique.length;
    if (removedCount > 0) {
      setFrames(unique);
      alert(`¡Limpieza completada! Se eliminaron ${removedCount} fotogramas idénticos/repetidos.`);
    } else {
      alert('No se encontraron fotogramas duplicados en la galería.');
    }
  };

  const copyToClipboard = async (frame) => {
    try {
      const response = await fetch(frame.dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedId(frame.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudo copiar directamente la imagen al portapapeles.');
    }
  };

  const downloadSingle = (frame) => {
    const link = document.createElement('a');
    link.href = frame.dataUrl;
    link.download = frame.filename || `frame_${frame.timestampFormatted}.${exportSettings?.format || 'png'}`;
    link.click();
  };

  const downloadAsZip = async (targetFrames = frames) => {
    if (targetFrames.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("frameforge_captures");

      targetFrames.forEach((frame, idx) => {
        const base64Data = frame.dataUrl.split(',')[1];
        const ext = exportSettings?.format || 'png';
        const name = frame.filename || `frame_${String(idx + 1).padStart(4, '0')}_${frame.timestampFormatted}.${ext}`;
        folder.file(name, base64Data, { base64: true });
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FrameForge_Captures_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creando archivo ZIP:', err);
      alert('Ocurrió un error al empaquetar el ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const handlePrevLightbox = () => {
    if (!lightboxFrame) return;
    const idx = frames.findIndex(f => f.id === lightboxFrame.id);
    if (idx > 0) {
      setLightboxFrame(frames[idx - 1]);
    } else {
      setLightboxFrame(frames[frames.length - 1]);
    }
  };

  const handleNextLightbox = () => {
    if (!lightboxFrame) return;
    const idx = frames.findIndex(f => f.id === lightboxFrame.id);
    if (idx < frames.length - 1) {
      setLightboxFrame(frames[idx + 1]);
    } else {
      setLightboxFrame(frames[0]);
    }
  };

  const handleSaveEditedFrame = (editedFrame) => {
    setFrames(prev => [editedFrame, ...prev]);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxFrame) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextLightbox();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxFrame(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxFrame, frames]);

  const currentLightboxIndex = lightboxFrame ? frames.findIndex(f => f.id === lightboxFrame.id) : -1;
  const selectedFramesList = frames.filter(f => selectedIds.has(f.id));

  return (
    <div className="glass-panel gallery-section">
      {/* Header & Controls */}
      <div className="gallery-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Images size={22} color="#06b6d4" />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Galería de Fotogramas ({frames.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {selectedIds.size > 0 ? `${selectedIds.size} seleccionados` : 'Haz clic en una captura para ampliar (Navega con Flechas Izq/Der)'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {frames.length > 0 && (
            <>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                onClick={handleFilterDuplicates}
                title="Eliminar capturas repetidas con Hash Perceptual"
              >
                <Filter size={14} color="#f59e0b" /> Limpiar Duplicados
              </button>

              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                onClick={selectAll}
              >
                {selectedIds.size === frames.length ? <CheckSquare size={14} /> : <Square size={14} />}
                {selectedIds.size === frames.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}
              </button>

              {selectedIds.size === 2 && (
                <button
                  className="btn btn-accent"
                  style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                  onClick={() => setCompareModalOpen(true)}
                >
                  <Columns size={14} /> Comparar 2 Fotos
                </button>
              )}

              {selectedIds.size > 0 ? (
                <>
                  <button
                    className="btn btn-accent"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => onAddToMoodboard && onAddToMoodboard(selectedFramesList)}
                    title="Enviar fotogramas seleccionados a la Pizarra Moodboard"
                  >
                    <Pin size={14} /> Enviar a Pizarra ({selectedIds.size})
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={deleteSelected}
                  >
                    <Trash2 size={14} /> Eliminar ({selectedIds.size})
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => downloadAsZip(selectedFramesList)}
                    disabled={isZipping}
                  >
                    <Archive size={14} /> Descargar Seleccionados ZIP
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-accent"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => onAddToMoodboard && onAddToMoodboard(frames)}
                    title="Enviar todos los fotogramas a la Pizarra Moodboard"
                  >
                    <Pin size={14} /> Enviar Todo a Pizarra
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={onClearAllFrames}
                  >
                    <Trash2 size={14} /> Vaciar Galería
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => downloadAsZip(frames)}
                    disabled={isZipping}
                  >
                    <Archive size={14} /> Descargar Todo (.ZIP)
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grid Frames */}
      {frames.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <Sparkles size={36} color="var(--accent-primary)" style={{ marginBottom: '0.5rem', opacity: 0.7 }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Aún no has capturado ningún fotograma.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
            Usa el botón "Capturar Frame" o ejecuta uno de los Modos Automáticos o IA para extraer fotogramas.
          </p>
        </div>
      ) : (
        <div className="frames-grid">
          {frames.map((frame, index) => {
            const isSelected = selectedIds.has(frame.id);
            return (
              <div
                key={frame.id}
                className={`frame-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="frame-thumb-wrapper">
                  <img src={frame.dataUrl} alt={`Fotograma ${index + 1}`} />

                  {/* Actions Overlay */}
                  <div className="frame-card-actions">
                    <button
                      className="btn-action-icon"
                      onClick={() => onAddToMoodboard && onAddToMoodboard(frame)}
                      title="📌 Enviar a la Pizarra Moodboard"
                    >
                      <Pin size={15} color="#ec4899" />
                    </button>
                    <button
                      className="btn-action-icon"
                      onClick={() => setLightboxFrame(frame)}
                      title="Ampliar en pantalla completa"
                    >
                      <Maximize2 size={15} />
                    </button>
                    <button
                      className="btn-action-icon"
                      onClick={() => setEditingFrame(frame)}
                      title="Editar foto (brillo, recorte, saturación)"
                    >
                      <Edit3 size={15} color="#67e8f9" />
                    </button>
                    <button
                      className="btn-action-icon"
                      onClick={() => copyToClipboard(frame)}
                      title="Copiar al portapapeles"
                    >
                      {copiedId === frame.id ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                    </button>
                    <button
                      className="btn-action-icon"
                      onClick={() => downloadSingle(frame)}
                      title="Descargar imagen"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      className="btn-action-icon btn-action-danger"
                      onClick={() => onDeleteFrame(frame.id)}
                      title="Eliminar fotograma"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Selection Checkbox Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    onClick={() => toggleSelect(frame.id)}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} color="#ec4899" fill="rgba(236,72,153,0.3)" />
                    ) : (
                      <Square size={20} color="rgba(255,255,255,0.7)" />
                    )}
                  </div>
                </div>

                <div className="frame-card-info">
                  <span>#{String(index + 1).padStart(2, '0')}</span>
                  <span>{frame.timestampFormatted}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxFrame && (
        <div className="modal-backdrop" onClick={() => setLightboxFrame(null)}>
          <div className="glass-panel-elevated modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge badge-indigo">
                  Fotograma {currentLightboxIndex + 1} de {frames.length}
                </span>
                <span className="badge badge-cyan">Timestamp: {lightboxFrame.timestampFormatted}</span>
                <span className="badge badge-emerald">{lightboxFrame.width}x{lightboxFrame.height}px</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setEditingFrame(lightboxFrame)}>
                  <Edit3 size={16} /> Editar
                </button>
                <button className="btn btn-secondary" onClick={() => copyToClipboard(lightboxFrame)}>
                  <Copy size={16} /> Copiar
                </button>
                <button className="btn btn-primary" onClick={() => downloadSingle(lightboxFrame)}>
                  <Download size={16} /> Descargar
                </button>
                <button className="btn btn-secondary btn-icon-only" onClick={() => setLightboxFrame(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Inner viewport container */}
            <div style={{
              position: 'relative',
              width: '100%',
              flex: 1,
              minHeight: 0,
              maxHeight: '68vh',
              background: '#000',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={lightboxFrame.dataUrl}
                alt="Vista Ampliada"
                style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain' }}
              />

              {/* Prev / Next buttons */}
              <button
                className="btn btn-secondary btn-icon-only"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                onClick={handlePrevLightbox}
                title="Fotograma Anterior (Flecha Izquierda)"
              >
                <ChevronLeft size={28} />
              </button>

              <button
                className="btn btn-secondary btn-icon-only"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                onClick={handleNextLightbox}
                title="Fotograma Siguiente (Flecha Derecha)"
              >
                <ChevronRight size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      <ImageEditorModal
        isOpen={Boolean(editingFrame)}
        onClose={() => setEditingFrame(null)}
        frame={editingFrame}
        onSaveEditedFrame={handleSaveEditedFrame}
      />

      {/* Compare Dual Modal */}
      {selectedFramesList.length === 2 && (
        <CompareFramesModal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          frameA={selectedFramesList[0]}
          frameB={selectedFramesList[1]}
          onDeleteFrame={onDeleteFrame}
        />
      )}
    </div>
  );
}

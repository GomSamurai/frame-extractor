import React from 'react';
import { Columns, X, Download, Copy, Trash2, Check, Sparkles } from 'lucide-react';

export default function CompareFramesModal({
  isOpen,
  onClose,
  frameA,
  frameB,
  onDeleteFrame
}) {
  if (!isOpen || !frameA || !frameB) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel-elevated modal-content" style={{ maxWidth: '1200px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Columns size={22} color="#06b6d4" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Comparador Dual de Fotogramas Lado a Lado</h3>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', flex: 1, minHeight: 0 }}>
          {/* Left Frame A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-cyan">Opción A: {frameA.timestampFormatted}</span>
              <span className="badge badge-indigo">{frameA.width}x{frameA.height}px</span>
            </div>

            <div style={{
              background: '#000',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              maxHeight: '58vh',
              flex: 1
            }}>
              <img src={frameA.dataUrl} alt="Fotograma A" style={{ maxWidth: '100%', maxHeight: '58vh', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => {
                const link = document.createElement('a');
                link.href = frameA.dataUrl;
                link.download = frameA.filename;
                link.click();
              }}>
                <Download size={14} /> Conservar Opción A
              </button>
              <button className="btn btn-danger btn-icon-only" title="Descartar Opción A" onClick={() => {
                onDeleteFrame(frameA.id);
                onClose();
              }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Right Frame B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-cyan">Opción B: {frameB.timestampFormatted}</span>
              <span className="badge badge-indigo">{frameB.width}x{frameB.height}px</span>
            </div>

            <div style={{
              background: '#000',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              maxHeight: '58vh',
              flex: 1
            }}>
              <img src={frameB.dataUrl} alt="Fotograma B" style={{ maxWidth: '100%', maxHeight: '58vh', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => {
                const link = document.createElement('a');
                link.href = frameB.dataUrl;
                link.download = frameB.filename;
                link.click();
              }}>
                <Download size={14} /> Conservar Opción B
              </button>
              <button className="btn btn-danger btn-icon-only" title="Descartar Opción B" onClick={() => {
                onDeleteFrame(frameB.id);
                onClose();
              }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

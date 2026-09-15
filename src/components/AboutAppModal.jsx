import React from 'react';
import { X, Sparkles, Heart, Bot, Zap, LayoutGrid, Filter, Edit3, ShieldCheck, Film, Code, Github } from 'lucide-react';
import AppLogoIcon from './AppLogoIcon';

export default function AboutAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel-elevated modal-content"
        style={{ maxWidth: '620px', borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon-wrapper">
              <AppLogoIcon size={30} />
            </div>
            <div>
              <h2 className="brand-title" style={{ fontSize: '1.4rem' }}>Frame Extractor</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Versión 1.0.0 • Studio Edition
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: '1rem 0', maxHeight: '65vh', overflowY: 'auto', paddingRight: '0.3rem' }}>
          {/* Main Description Banner */}
          <div style={{ padding: '1rem 1.25rem', background: 'var(--gradient-brand-glow)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#f59e0b" /> Extractor Magistral de Fotogramas e Inteligencia Visual
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              <strong>Frame Extractor</strong> es una suite completa para capturar, analizar, filtrar, retocar y componer los mejores fotogramas de cualquier archivo de vídeo en segundos.
            </p>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.85rem', color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Bot size={16} /> 🤖 Smart IA Vision Engine
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Buscador por texto libre, detector de sonrisas, ojos abiertos (anti-parpadeo), expresión natural, parejas y mascotas.
              </p>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <LayoutGrid size={16} /> 🎨 Pizarra PureRef Moodboard
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Lienzo espacial infinito con zoom, pan, arrastre, escala, rotación libre (0°-360°), notas adhesivas y exportación PNG.
              </p>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Edit3 size={16} /> 🎨 Photo Studio Editor & Compare
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Ajuste de brillo, contraste, saturación, recortes 1:1/16:9/4:5 y comparador dual lado a lado.
              </p>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.85rem', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Filter size={16} /> 🧹 Hash Perceptual (dHash)
              </strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Detección y eliminación inteligente de fotogramas duplicados o idénticos.
              </p>
            </div>
          </div>

          {/* Credits Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '0.85rem 1.1rem',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Heart size={18} color="#e11d48" fill="#e11d48" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Diseñada con pasión por <strong style={{ color: '#f59e0b' }}>Fran Gómez</strong>
              </span>
            </div>

            <a
              href="https://github.com/GomSamurai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', textDecoration: 'none' }}
            >
              <Github size={14} /> @GomSamurai
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

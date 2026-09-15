import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Move, Layers, Grid,
  Download, Trash2, Plus, StickyNote, Lock, Unlock, ArrowUp, ArrowDown,
  Sparkles, Check, LayoutGrid, Sun, Moon
} from 'lucide-react';

export default function MoodboardCanvasModal({
  isOpen,
  onClose,
  items,
  setItems,
  onRemoveItem
}) {
  if (!isOpen) return null;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [selectedId, setSelectedId] = useState(null);
  const [dragState, setDragState] = useState(null); // { type: 'move'|'resize'|'rotate', itemId, startX, startY, origItem }

  const [bgStyle, setBgStyle] = useState('grid'); // 'grid', 'dark', 'studio', 'white'
  const [isExporting, setIsExporting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const containerRef = useRef(null);

  // Zoom Handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.2, Math.min(3.5, prev * zoomFactor)));
  };

  // Canvas Pan Handlers
  const handleBgMouseDown = (e) => {
    // If click is directly on background or container
    if (e.target.classList.contains('moodboard-viewport') || e.target.classList.contains('moodboard-grid-bg')) {
      setSelectedId(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!dragState) return;

    const dx = (e.clientX - dragState.startX) / zoom;
    const dy = (e.clientY - dragState.startY) / zoom;
    const { type, itemId, origItem } = dragState;

    if (type === 'move') {
      if (origItem.pinned) return;
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            x: Math.round(origItem.x + dx),
            y: Math.round(origItem.y + dy)
          };
        }
        return item;
      }));
    } else if (type === 'resize') {
      const handle = dragState.handle;
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          let newW = origItem.width;
          let newH = origItem.height;

          if (handle.includes('r')) newW = Math.max(80, origItem.width + dx);
          if (handle.includes('b')) newH = Math.max(60, origItem.height + dy);
          if (handle.includes('l')) {
            const possibleW = Math.max(80, origItem.width - dx);
            newW = possibleW;
          }

          // Maintain aspect ratio for images if shift or default
          if (item.aspectRatio && !e.shiftKey) {
            newH = Math.round(newW / item.aspectRatio);
          }

          return { ...item, width: newW, height: newH };
        }
        return item;
      }));
    } else if (type === 'rotate') {
      const itemElem = document.getElementById(`mb-item-${itemId}`);
      if (!itemElem) return;
      const rect = itemElem.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let deg = Math.round(rad * (180 / Math.PI)) + 90;
      if (deg < 0) deg += 360;

      // Snap to 45 degree intervals if shift is pressed
      if (e.shiftKey) {
        deg = Math.round(deg / 45) * 45;
      }

      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, rotation: deg % 360 };
        }
        return item;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
  };

  useEffect(() => {
    if (isPanning || dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, dragState, panStart, zoom]);

  // Start item drag move
  const startItemMove = (e, item) => {
    e.stopPropagation();
    setSelectedId(item.id);
    if (item.pinned) return;

    setDragState({
      type: 'move',
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origItem: { ...item }
    });
  };

  // Start item resize
  const startItemResize = (e, item, handle) => {
    e.stopPropagation();
    setDragState({
      type: 'resize',
      handle,
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origItem: { ...item }
    });
  };

  // Start item rotate
  const startItemRotate = (e, item) => {
    e.stopPropagation();
    setDragState({
      type: 'rotate',
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origItem: { ...item }
    });
  };

  // Add Note Sticker
  const handleAddNote = () => {
    const newNote = {
      id: `note_${Date.now()}`,
      type: 'note',
      text: 'Escribe tu nota aquí...',
      color: '#fef08a', // Yellow sticker default
      x: Math.round(-pan.x / zoom + 250),
      y: Math.round(-pan.y / zoom + 200),
      width: 220,
      height: 180,
      rotation: 0,
      zIndex: items.length + 1
    };
    setItems(prev => [...prev, newNote]);
    setSelectedId(newNote.id);
  };

  // Auto-arrange Grid Matrix
  const handleAutoArrangeGrid = () => {
    if (items.length === 0) return;
    const cols = Math.ceil(Math.sqrt(items.length));
    const padding = 30;
    const itemW = 320;
    const itemH = 180;

    setItems(prev => prev.map((item, index) => {
      const c = index % cols;
      const r = Math.floor(index / cols);
      return {
        ...item,
        x: c * (itemW + padding) + 50,
        y: r * (itemH + padding + 40) + 50,
        rotation: 0
      };
    }));
    setPan({ x: 80, y: 80 });
    setZoom(0.85);
  };

  // Layer ordering
  const bringToFront = (id) => {
    const maxZ = Math.max(...items.map(i => i.zIndex || 1), 1);
    setItems(prev => prev.map(item => item.id === id ? { ...item, zIndex: maxZ + 1 } : item));
  };

  const sendToBack = (id) => {
    const minZ = Math.min(...items.map(i => i.zIndex || 1), 1);
    setItems(prev => prev.map(item => item.id === id ? { ...item, zIndex: Math.max(1, minZ - 1) } : item));
  };

  const togglePin = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item));
  };

  // Export Composition Composite to PNG
  const exportCanvasComposition = async () => {
    if (items.length === 0) return;
    setIsExporting(true);

    try {
      // Find bounding box of all items
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      items.forEach(item => {
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + item.width);
        maxY = Math.max(maxY, item.y + item.height);
      });

      const padding = 80;
      const exportW = Math.max(800, Math.ceil(maxX - minX + padding * 2));
      const exportH = Math.max(600, Math.ceil(maxY - minY + padding * 2));

      const canvas = document.createElement('canvas');
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext('2d');

      // Draw Background
      if (bgStyle === 'white') {
        ctx.fillStyle = '#ffffff';
      } else if (bgStyle === 'studio') {
        ctx.fillStyle = '#1e293b';
      } else {
        ctx.fillStyle = '#070913';
      }
      ctx.fillRect(0, 0, exportW, exportH);

      // Draw Grid if active
      if (bgStyle === 'grid') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < exportW; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, exportH); ctx.stroke();
        }
        for (let y = 0; y < exportH; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(exportW, y); ctx.stroke();
        }
      }

      // Sort items by zIndex
      const sorted = [...items].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      for (const item of sorted) {
        ctx.save();

        const renderX = item.x - minX + padding + item.width / 2;
        const renderY = item.y - minY + padding + item.height / 2;

        ctx.translate(renderX, renderY);
        ctx.rotate(((item.rotation || 0) * Math.PI) / 180);

        if (item.type === 'image' && item.dataUrl) {
          const img = new Image();
          img.src = item.dataUrl;
          await new Promise((resolve) => { img.onload = resolve; });

          // Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetY = 8;

          ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        } else if (item.type === 'note') {
          // Note Sticker background
          ctx.fillStyle = item.color || '#fef08a';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 10;
          ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);

          // Note text
          ctx.fillStyle = '#1e293b';
          ctx.font = '600 15px Outfit, sans-serif';
          ctx.shadowBlur = 0;
          
          const words = (item.text || '').split(' ');
          let line = '';
          let lineY = -item.height / 2 + 30;
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > item.width - 24 && n > 0) {
              ctx.fillText(line, -item.width / 2 + 12, lineY);
              line = words[n] + ' ';
              lineY += 22;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, -item.width / 2 + 12, lineY);
        }

        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Moodboard_Pizarra_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error('Error al exportar la pizarra:', err);
      alert('Ocurrió un error al exportar la composición.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className="modal-backdrop" style={{ padding: 0 }} onClick={onClose}>
      <div
        className="glass-panel-elevated"
        style={{
          width: '100vw',
          height: '100vh',
          borderRadius: 0,
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: bgStyle === 'white' ? '#f8fafc' : bgStyle === 'studio' ? '#0f172a' : '#070913'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top Control Toolbar */}
        <div className="moodboard-toolbar glass-panel" style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid var(--border-subtle)', paddingRight: '0.75rem' }}>
            <Sparkles size={18} color="#06b6d4" />
            <strong style={{ fontSize: '0.95rem', fontWeight: 800 }}>Pizarra Moodboard PureRef</strong>
            <span className="badge badge-cyan">{items.length} Elementos</span>
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <button className="btn btn-secondary btn-icon-only" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.15))} title="Alejar (Zoom Out)">
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', minWidth: '45px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="btn btn-secondary btn-icon-only" onClick={() => setZoom(prev => Math.min(3.5, prev + 0.15))} title="Acercar (Zoom In)">
              <ZoomIn size={16} />
            </button>
            <button className="btn btn-secondary btn-icon-only" onClick={() => { setZoom(1); setPan({ x: 100, y: 100 }); }} title="Restablecer vista">
              <RotateCcw size={14} />
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

          {/* Actions */}
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }} onClick={handleAddNote} title="Añadir Nota de Texto Adhesiva">
            <StickyNote size={15} color="#f59e0b" /> Nota
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }} onClick={handleAutoArrangeGrid} title="Organizar automáticamente todos los fotogramas en cuadrícula">
            <LayoutGrid size={15} color="#34d399" /> Cuadrícula
          </button>

          <select
            className="select-input"
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: '110px' }}
            value={bgStyle}
            onChange={(e) => setBgStyle(e.target.value)}
            title="Estilo de Fondo"
          >
            <option value="grid">Rejilla Oscura</option>
            <option value="dark">Fondo Negro</option>
            <option value="studio">Gris Studio</option>
            <option value="white">Blanco Limpio</option>
          </select>

          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportCanvasComposition} disabled={isExporting || items.length === 0}>
            <Download size={15} /> Exportar Imagen PNG
          </button>

          <button className="btn btn-secondary btn-icon-only" onClick={onClose} title="Cerrar Pizarra (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Selected Item Floating Sub-bar */}
        {selectedItem && (
          <div className="glass-panel" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {selectedItem.type === 'image' ? 'Fotograma' : 'Nota'} Seleccionado ({selectedItem.width}x{selectedItem.height}px | {selectedItem.rotation || 0}°)
            </span>

            <button className="btn btn-secondary btn-icon-only" onClick={() => bringToFront(selectedItem.id)} title="Traer al Frente">
              <ArrowUp size={15} />
            </button>
            <button className="btn btn-secondary btn-icon-only" onClick={() => sendToBack(selectedItem.id)} title="Enviar al Fondo">
              <ArrowDown size={15} />
            </button>
            <button className="btn btn-secondary btn-icon-only" onClick={() => togglePin(selectedItem.id)} title={selectedItem.pinned ? "Desbloquear Posición" : "Bloquear Posición"}>
              {selectedItem.pinned ? <Lock size={15} color="#f43f5e" /> : <Unlock size={15} />}
            </button>

            {selectedItem.type === 'note' && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {['#fef08a', '#a5f3fc', '#fbcfe8', '#cbd5e1', '#334155'].map(c => (
                  <div
                    key={c}
                    style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, cursor: 'pointer', border: selectedItem.color === c ? '2px solid #fff' : 'none' }}
                    onClick={() => setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, color: c } : i))}
                  />
                ))}
              </div>
            )}

            <button className="btn btn-danger btn-icon-only" onClick={() => { onRemoveItem(selectedItem.id); setSelectedId(null); }} title="Eliminar de la Pizarra">
              <Trash2 size={15} />
            </button>
          </div>
        )}

        {/* Infinite Viewport Workspace */}
        <div
          ref={containerRef}
          className={`moodboard-viewport ${bgStyle === 'grid' ? 'moodboard-grid-bg' : ''}`}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'default',
            overflow: 'hidden'
          }}
          onWheel={handleWheel}
          onMouseDown={handleBgMouseDown}
        >
          {/* Infinite Canvas Layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              willChange: 'transform'
            }}
          >
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              const rot = item.rotation || 0;

              return (
                <div
                  key={item.id}
                  id={`mb-item-${item.id}`}
                  style={{
                    position: 'absolute',
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                    zIndex: item.zIndex || 1,
                    transform: `rotate(${rot}deg)`,
                    transformOrigin: 'center center',
                    userSelect: 'none',
                    touchAction: 'none'
                  }}
                  onMouseDown={(e) => startItemMove(e, item)}
                >
                  {/* Item Frame Container */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      borderRadius: item.type === 'note' ? '8px' : '6px',
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 0 0 3px var(--accent-cyan), 0 15px 30px rgba(0,0,0,0.6)' : '0 10px 25px rgba(0,0,0,0.4)',
                      border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.15)',
                      background: item.type === 'note' ? (item.color || '#fef08a') : '#000'
                    }}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.dataUrl}
                        alt="Fotograma"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                      />
                    ) : (
                      <textarea
                        value={item.text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems(prev => prev.map(i => i.id === item.id ? { ...i, text: val } : i));
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          padding: '12px',
                          fontFamily: 'var(--font-main)',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: item.color === '#334155' ? '#fff' : '#1e293b'
                        }}
                        placeholder="Escribe algo aquí..."
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>

                  {/* Handles for selected item */}
                  {isSelected && !item.pinned && (
                    <>
                      {/* Top Rotation Stem & Handle */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-28px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--gradient-brand)',
                          border: '2px solid #fff',
                          cursor: 'grab',
                          zIndex: 10,
                          boxShadow: '0 0 10px rgba(6,182,212,0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseDown={(e) => startItemRotate(e, item)}
                        title="Arrastrar para rotar (Mantén Shift para ajustar a 45°)"
                      >
                        <RotateCcw size={10} color="#fff" />
                      </div>

                      {/* 4 Corner Resize Handles */}
                      <div
                        style={{ position: 'absolute', top: '-6px', left: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nwse-resize', zIndex: 10, borderRadius: '2px' }}
                        onMouseDown={(e) => startItemResize(e, item, 'tl')}
                      />
                      <div
                        style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nesw-resize', zIndex: 10, borderRadius: '2px' }}
                        onMouseDown={(e) => startItemResize(e, item, 'tr')}
                      />
                      <div
                        style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nesw-resize', zIndex: 10, borderRadius: '2px' }}
                        onMouseDown={(e) => startItemResize(e, item, 'bl')}
                      />
                      <div
                        style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-cyan)', cursor: 'nwse-resize', zIndex: 10, borderRadius: '2px' }}
                        onMouseDown={(e) => startItemResize(e, item, 'br')}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

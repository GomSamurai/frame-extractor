import React, { useState } from 'react';
import {
  Camera, Sliders, Clock, Shuffle, Eye, Flame, Grid, Play, Sparkles,
  Bot, Heart, UserCheck, Zap, ShieldCheck, SunMedium, MoveHorizontal, Smile, EyeOff, Search, Dog, Car,
  Plus, X, Check, RotateCcw
} from 'lucide-react';

const DEFAULT_PRESET_TAGS = [
  'sonrisa radiante',
  'mirada a cámara',
  'pareja',
  'perro / mascota',
  'paisaje',
  'coche / vehículo'
];

export default function ExtractionControlHub({
  videoRef,
  duration,
  inPoint,
  outPoint,
  isProcessing,
  onRunBatchExtraction,
  onOpenContactSheet
}) {
  const [activeTab, setActiveTab] = useState('smart-ai');
  const [aiSubTab, setAiSubTab] = useState('custom-prompt'); // 'custom-prompt', 'couples', 'objects', 'sharpness', 'framing', 'aesthetic', 'combined'

  // Standard Modes Configs
  const [uniformCount, setUniformCount] = useState(10);
  const [intervalSeconds, setIntervalSeconds] = useState(2);
  const [randomCount, setRandomCount] = useState(8);
  const [minGapSeconds, setMinGapSeconds] = useState(1);
  const [sensitivityThreshold, setSensitivityThreshold] = useState(18);
  const [sceneSampleStep, setSceneSampleStep] = useState(0.5);
  const [burstCount, setBurstCount] = useState(10);
  const [burstStep, setBurstStep] = useState(0.1);

  // AI Smart Vision Configs
  const [customPrompt, setCustomPrompt] = useState('sonrisa radiante');
  const [sharpnessThreshold, setSharpnessThreshold] = useState(70);
  const [targetSubjectFilter, setTargetSubjectFilter] = useState('1-persona');
  const [targetFraming, setTargetFraming] = useState('any');
  const [targetPosture, setTargetPosture] = useState('any');
  const [minAestheticScore, setMinAestheticScore] = useState(60);
  const [aiSampleInterval, setAiSampleInterval] = useState(0.5);
  const [maxAiCaptures, setMaxAiCaptures] = useState(12);

  // Custom Preset Tags Management with LocalStorage
  const [presetTags, setPresetTags] = useState(() => {
    try {
      const saved = localStorage.getItem('frameextractor_preset_tags');
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_TAGS;
    } catch (e) {
      return DEFAULT_PRESET_TAGS;
    }
  });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim();
    if (!clean) return;
    if (!presetTags.includes(clean)) {
      const updated = [...presetTags, clean];
      setPresetTags(updated);
      try {
        localStorage.setItem('frameextractor_preset_tags', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setCustomPrompt(clean);
    setIsAddingTag(false);
    setNewTagText('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = presetTags.filter(t => t !== tagToRemove);
    setPresetTags(updated);
    try {
      localStorage.setItem('frameextractor_preset_tags', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetTags = () => {
    setPresetTags(DEFAULT_PRESET_TAGS);
    try {
      localStorage.setItem('frameextractor_preset_tags', JSON.stringify(DEFAULT_PRESET_TAGS));
    } catch (e) {
      console.error(e);
    }
  };

  // Facial Intelligence Toggles (Desactivados por defecto a petición del usuario)
  const [filterBlinking, setFilterBlinking] = useState(false);
  const [filterVocalizing, setFilterVocalizing] = useState(false);

  const effectiveDuration = outPoint - inPoint;

  const handleStartExtraction = () => {
    if (!videoRef.current || duration <= 0) {
      alert('Por favor, carga un vídeo antes de iniciar la extracción.');
      return;
    }

    const config = {
      mode: activeTab,
      inPoint,
      outPoint,
      duration: effectiveDuration,
      params: {}
    };

    if (activeTab === 'smart-ai') {
      config.params = {
        aiSubTab,
        customPrompt,
        sharpnessThreshold,
        targetSubjectFilter,
        targetFraming,
        targetPosture,
        minAestheticScore,
        sampleInterval: aiSampleInterval,
        maxCaptures: maxAiCaptures,
        filterBlinking,
        filterVocalizing
      };
    } else if (activeTab === 'uniform') {
      config.params = { count: uniformCount };
    } else if (activeTab === 'interval') {
      config.params = { interval: intervalSeconds };
    } else if (activeTab === 'random') {
      config.params = { count: randomCount, minGap: minGapSeconds };
    } else if (activeTab === 'scene') {
      config.params = { threshold: sensitivityThreshold, step: sceneSampleStep };
    } else if (activeTab === 'burst') {
      config.params = { count: burstCount, step: burstStep, centerTime: videoRef.current.currentTime };
    }

    onRunBatchExtraction(config);
  };

  return (
    <div className="glass-panel hub-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={22} color="#06b6d4" /> Modos de Extracción e IA
        </h3>
        <span className="badge badge-indigo" title="Motor de visión artificial local sin enviar datos a la nube">
          <Sparkles size={14} /> Smart Vision Engine
        </span>
      </div>

      {/* Main Tabs list */}
      <div className="hub-tabs">
        <button
          className={`hub-tab-btn ${activeTab === 'smart-ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('smart-ai')}
          style={{ background: activeTab === 'smart-ai' ? 'var(--gradient-brand)' : undefined, color: activeTab === 'smart-ai' ? '#fff' : undefined }}
          title="🤖 Smart IA Vision: Analiza inteligentemente el vídeo con IA local buscando conceptos por texto libre, expresiones, nitidez y sujetos."
        >
          <Sparkles size={16} /> 🤖 Smart IA Vision
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'uniform' ? 'active' : ''}`}
          onClick={() => setActiveTab('uniform')}
          title="🔢 Conteo Uniforme: Extrae una cantidad exactas de fotogramas repartidos equitativamente a lo largo del vídeo."
        >
          <Sliders size={16} /> Conteo Uniforme
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'interval' ? 'active' : ''}`}
          onClick={() => setActiveTab('interval')}
          title="⏱️ Intervalo de Tiempo: Toma un fotograma automáticamente cada X segundos de reproducción."
        >
          <Clock size={16} /> Intervalo Tiempo
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'random' ? 'active' : ''}`}
          onClick={() => setActiveTab('random')}
          title="🎲 Aleatorio: Captura fotogramas en momentos al azar garantizando una separación mínima especificada."
        >
          <Shuffle size={16} /> Aleatorio
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'scene' ? 'active' : ''}`}
          onClick={() => setActiveTab('scene')}
          title="👁️ Detección de Escena: Compara cambios cromáticos entre imágenes para detectar cortes de plano o cambios de cámara."
        >
          <Eye size={16} /> Detección Escena
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'burst' ? 'active' : ''}`}
          onClick={() => setActiveTab('burst')}
          title="🔥 Ráfaga Continua: Extrae fotogramas consecutivos a alta velocidad centrados en la posición actual del vídeo."
        >
          <Flame size={16} /> Ráfaga
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={onOpenContactSheet}
          title="📐 Storyboard Grid: Genera una hoja de contactos/cuadrícula descargable combinando múltiples capturas en una sola imagen."
        >
          <Grid size={16} /> Storyboard Grid
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content-panel">
        {/* SMART IA VISION PANEL */}
        {activeTab === 'smart-ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 'var(--radius-md)' }}>
              <button
                className={`btn ${aiSubTab === 'custom-prompt' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => setAiSubTab('custom-prompt')}
                title="✍️ Buscador por Texto Libre: Describe la acción o concepto exacto que deseas encontrar en el vídeo."
              >
                <Search size={14} color="#67e8f9" /> ✍️ Buscador por Texto Libre
              </button>

              <button
                className={`btn ${aiSubTab === 'couples' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => setAiSubTab('couples')}
                title="👩‍❤️‍👨 Sujetos y Parejas: Filtra entre retratos individuales, tomas de parejas o momentos grupales."
              >
                <Heart size={14} color="#ec4899" /> Sujetos y Parejas
              </button>

              <button
                className={`btn ${aiSubTab === 'objects' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => setAiSubTab('objects')}
                title="🐶 Mascotas & Objetos: Identifica automáticamente perros, gatos, mascotas, vehículos y elementos de entorno."
              >
                <Dog size={14} color="#f59e0b" /> Mascotas & Objetos
              </button>

              <button
                className={`btn ${aiSubTab === 'sharpness' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => setAiSubTab('sharpness')}
                title="⚡ Filtro de Nitidez: Descarta fotos borrosas o movidas quedándose solo con el top de mayor enfoque."
              >
                <Zap size={14} color="#06b6d4" /> Filtro Nitidez
              </button>

              <button
                className={`btn ${aiSubTab === 'combined' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => setAiSubTab('combined')}
                title="🤖 Curador Maestro: Evaluador integral que prioriza nitidez, iluminación, ojos abiertos y sonrisas."
              >
                <Bot size={14} color="#10b981" /> Curador Maestro
              </button>
            </div>

            {/* Facial Precision Toggles Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              padding: '0.65rem',
              background: 'rgba(99,102,241,0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99,102,241,0.25)'
            }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, color: '#67e8f9' }}
                title="👁️ Filtro Anti-Parpadeo (Desactivado por defecto): Actívalo si deseas ignorar los fotogramas donde las personas aparezcan con los ojos cerrados o a medio parpadear."
              >
                <input
                  type="checkbox"
                  checked={filterBlinking}
                  onChange={(e) => setFilterBlinking(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '15px', height: '15px' }}
                />
                <EyeOff size={14} /> Filtro Anti-Parpadeo (Solo Ojos Abiertos)
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, color: '#a5b4fc' }}
                title="😀 Expresión Natural (Desactivada por defecto): Actívalo para filtrar fotos congeladas a mitad de habla con la boca abierta o muecas raras."
              >
                <input
                  type="checkbox"
                  checked={filterVocalizing}
                  onChange={(e) => setFilterVocalizing(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '15px', height: '15px' }}
                />
                <Smile size={14} /> Expresión Natural (Sin muecas al hablar)
              </label>
            </div>

            {/* Sub-Tab: FREE TEXT CUSTOM PROMPT SEARCH */}
            {aiSubTab === 'custom-prompt' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Escribe la acción, emoción o concepto que deseas que la IA busque y extraiga del vídeo (100% en local):
                </p>

                <div className="option-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="option-label" style={{ margin: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Search size={16} color="#06b6d4" /> Buscar Acción / Concepto:
                      </span>
                    </label>
                    {customPrompt.trim() && !presetTags.includes(customPrompt.trim()) && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleAddTag(customPrompt)}
                        title="Guardar este concepto como tag accesible rápidamente"
                      >
                        <Plus size={13} /> Guardar como Tag
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    className="number-input"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ej. sonrisa radiante, mirada a cámara, beso, coche rojo, perro..."
                  />

                  {/* Interactive Dynamic Tags Pills */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem', alignItems: 'center' }}>
                    {presetTags.map(tag => {
                      const isActive = customPrompt.trim().toLowerCase() === tag.toLowerCase();
                      return (
                        <div
                          key={tag}
                          className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '0.2rem 0.55rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          onClick={() => setCustomPrompt(tag)}
                          title={`Usar tag "${tag}"`}
                        >
                          <span style={{ cursor: 'pointer' }}>+ {tag}</span>
                          <span
                            style={{
                              opacity: 0.6,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1px',
                              borderRadius: '3px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(tag);
                            }}
                            title={`Eliminar tag "${tag}"`}
                          >
                            <X size={12} />
                          </span>
                        </div>
                      );
                    })}

                    {isAddingTag ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="text"
                          className="number-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: '130px' }}
                          placeholder="Nuevo tag..."
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTag(newTagText);
                            if (e.key === 'Escape') { setIsAddingTag(false); setNewTagText(''); }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          onClick={() => handleAddTag(newTagText)}
                          title="Guardar tag"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          onClick={() => { setIsAddingTag(false); setNewTagText(''); }}
                          title="Cancelar"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderStyle: 'dashed', color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => setIsAddingTag(true)}
                        title="Añadir un nuevo tag personalizado"
                      >
                        <Plus size={13} /> Añadir Tag
                      </button>
                    )}

                    {presetTags.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon-only"
                        style={{ width: '26px', height: '26px', padding: 0, marginLeft: 'auto' }}
                        onClick={handleResetTags}
                        title="Restablecer tags predeterminados"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab: Sujetos y Parejas */}
            {aiSubTab === 'couples' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Analiza el vídeo mediante segmentación espacial y detecta la presencia de personas, parejas o momentos de cercanía íntima.
                </p>

                <div className="option-group">
                  <label className="option-label">Filtrar por tipo de sujeto / escena:</label>
                  <select
                    className="select-input"
                    value={targetSubjectFilter}
                    onChange={(e) => setTargetSubjectFilter(e.target.value)}
                  >
                    <option value="1-persona">👤 Solo 1 Persona (Retratos / Tomas individuales)</option>
                    <option value="pareja">👩‍❤️‍👨 Parejas / 2 Personas juntas (Escenas íntimas o compartidas)</option>
                    <option value="grupo">👨‍👩‍👧 Grupos (3 o más personas en escena)</option>
                    <option value="any">Cualquier sujeto detectado</option>
                  </select>
                </div>
              </div>
            )}

            {/* Sub-Tab: Mascotas y Objetos */}
            {aiSubTab === 'objects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  La IA detecta automáticamente animales/mascotas (perros, gatos), vehículos y elementos de paisaje/naturaleza.
                </p>

                <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.8rem' }}>
                  🐶 Detectará momentos con animales domésticos, tonos de pelaje, naturaleza o vehículos.
                </div>
              </div>
            )}

            {/* Sub-Tab: Filtro de Nitidez */}
            {aiSubTab === 'sharpness' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  La IA analiza la varianza Laplaciana de gradientes para descartar tomas fuera de foco, borrosas o movidas por la cámara.
                </p>

                <div className="option-group">
                  <div className="option-label">
                    <span>Quedarse solo con el top de fotogramas más nítidos:</span>
                    <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>Top {sharpnessThreshold}% Nítidos</strong>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    value={sharpnessThreshold}
                    onChange={(e) => setSharpnessThreshold(parseInt(e.target.value))}
                    className="range-input"
                  />
                </div>
              </div>
            )}

            {/* Sub-Tab: Curador Maestro */}
            {aiSubTab === 'combined' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Modo Maestro: La IA sopesa simultáneamente Nitidez + Iluminación + Ojos Abiertos + Expresión Natural para seleccionar las fotos perfectas del vídeo.
                </p>
              </div>
            )}

            {/* Shared AI Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Paso de escaneo IA</label>
                <select
                  className="select-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  value={aiSampleInterval}
                  onChange={(e) => setAiSampleInterval(parseFloat(e.target.value))}
                >
                  <option value={0.25}>Cada 0.25s (Ultra preciso)</option>
                  <option value={0.5}>Cada 0.5s (Recomendado)</option>
                  <option value={1.0}>Cada 1.0s (Rápido)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Máximo de capturas IA</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="number-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  value={maxAiCaptures}
                  onChange={(e) => setMaxAiCaptures(parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </div>
        )}

        {/* UNIFORM PANEL */}
        {activeTab === 'uniform' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Extrae una cantidad exacta de fotogramas distribuidos equitativamente a lo largo de la duración total o del rango recortado.
            </p>

            <div className="option-group">
              <div className="option-label">
                <span>Número de Fotogramas a Exportar:</span>
                <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>{uniformCount} frames</strong>
              </div>
              <input
                type="range"
                min={2}
                max={100}
                value={uniformCount}
                onChange={(e) => setUniformCount(parseInt(e.target.value))}
                className="range-input"
              />
            </div>
          </div>
        )}

        {/* INTERVAL PANEL */}
        {activeTab === 'interval' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Extrae automáticamente un fotograma cada intervalo específico de segundos.
            </p>

            <div className="option-group">
              <div className="option-label">
                <span>Cada cuántos segundos capturar:</span>
                <strong style={{ color: '#67e8f9', fontFamily: 'var(--font-mono)' }}>cada {intervalSeconds}s</strong>
              </div>
              <input
                type="range"
                min={0.1}
                max={30}
                step={0.1}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
                className="range-input"
              />
            </div>
          </div>
        )}

        {/* RANDOM PANEL */}
        {activeTab === 'random' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Extrae fotogramas en marcas de tiempo aleatorias asegurando una separación mínima.
            </p>
          </div>
        )}

        {/* SCENE PANEL */}
        {activeTab === 'scene' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Analiza las diferencias de píxeles entre fotogramas consecutivos para detectar automáticamente cortes de escena o cambios de plano.
            </p>
          </div>
        )}

        {/* BURST PANEL */}
        {activeTab === 'burst' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Captura una ráfaga rápida de fotogramas continuos centrados en la posición actual del vídeo.
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {activeTab !== 'contact' && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
          onClick={handleStartExtraction}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>Extrayendo fotogramas...</>
          ) : (
            <>
              <Sparkles size={18} /> {activeTab === 'smart-ai' ? 'Ejecutar Búsqueda IA Local' : 'Ejecutar Extracción'}
            </>
          )}
        </button>
      )}
    </div>
  );
}

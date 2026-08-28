// Canvas.jsx — Área central de edición WYSIWYG de lección/evaluación
import React from 'react';
import { useCourseStore } from '../store/courseStore';
import TextBlock from './blocks/TextBlock';
import VideoBlock from './blocks/VideoBlock';
import AccordionBlock from './blocks/AccordionBlock';
import FlipCardBlock from './blocks/FlipCardBlock';
import TimelineBlock from './blocks/TimelineBlock';
import CalloutBlock from './blocks/CalloutBlock';
import GalleryBlock from './blocks/GalleryBlock';
import ResourceBlock from './blocks/ResourceBlock';
import KnowledgeCheckBlock from './blocks/KnowledgeCheckBlock';
import QuizBuilder from './QuizBuilder';
import {
  Quote,
  Plus,
  Image as ImageIcon,
  Type,
  Video,
  Layers,
  RefreshCw,
  GitCommit,
  AlertCircle,
  Download,
  HelpCircle,
  Settings,
  Upload
} from 'lucide-react';

function findLesson(course, lessonId) {
  for (const m of course.modules) {
    for (const t of m.children) {
      for (const n of t.children) {
        if (n.id === lessonId) return n;
      }
    }
  }
  return null;
}

const BLOCK_COMPONENTS = {
  text: TextBlock,
  video: VideoBlock,
  accordion: AccordionBlock,
  flipcard: FlipCardBlock,
  timeline: TimelineBlock,
  callout: CalloutBlock,
  gallery: GalleryBlock,
  resource: ResourceBlock,
  knowledge_check: KnowledgeCheckBlock
};

export default function Canvas() {
  const { course, selectedLessonId, addBlock, updateLessonQuote } = useCourseStore();
  const [showQuoteConfigModal, setShowQuoteConfigModal] = React.useState(false);
  const node = selectedLessonId ? findLesson(course, selectedLessonId) : null;

  if (!node) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
        <p className="text-sm font-medium">Selecciona una lección o evaluación en el árbol lateral</p>
      </main>
    );
  }

  if (node.type === 'assessment') return <QuizBuilder assessment={node} />;

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-white max-w-4xl mx-auto w-full">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-800">{node.title}</h1>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">
          {node.subtitle || 'ELEMENTO DEL MÓDULO'}
        </p>
      </div>

      {/* Editor de Banner Hero de Cita Resaltada (Captura 2) */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Quote size={14} className="text-[#f58220]" />
          <span>Banner de Cita Resaltada (Hero Quote Card)</span>
        </div>

        <div className="space-y-2 text-xs">
          <textarea
            rows={2}
            className="w-full p-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-[#f58220]"
            placeholder="Texto resaltado en la carta hero (ej: La gestión financiera hace referencia al proceso...)"
            value={node.quoteBanner?.text || ''}
            onChange={(e) => updateLessonQuote(node.id, { text: e.target.value })}
          />
          <div className="flex items-center space-x-2">
            <ImageIcon size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#f58220]"
              placeholder="URL o ruta de imagen para el banner de cita"
              value={node.quoteBanner?.bgImage || ''}
              onChange={(e) => updateLessonQuote(node.id, { bgImage: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowQuoteConfigModal(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer shrink-0 flex items-center space-x-1"
              title="Configurar propiedades de imagen del banner de cita"
            >
              <Settings size={14} className="text-slate-600 hover:text-[#f58220]" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIGURACIÓN DE IMAGEN PARA BANNER DE CITA */}
      {showQuoteConfigModal && (() => {
        const qb = node.quoteBanner || {};
        const bgPosX = qb.bgPositionX ?? 50;
        const bgPosY = qb.bgPositionY ?? 50;
        const bgSize = qb.bgSize || 'cover';
        const bgRepeat = qb.bgRepeat || 'no-repeat';
        const bgOpacity = qb.bgOpacity ?? 40;
        const bgColor = qb.bgColor || '#0f172a';
        const overlayEnabled = qb.overlayEnabled !== false;
        const overlayOpacity = qb.overlayOpacity ?? 60;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Settings size={16} className="text-[#f58220]" />
                  <span>Configuración de Imagen de Cita</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuoteConfigModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </h3>

              {/* VISTA PREVIA MINI CARTA DE CITA */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-xs block">Vista Previa del Banner</label>
                <div
                  className="relative rounded-lg overflow-hidden text-white min-h-[120px] flex items-center p-4 shadow-md transition-all"
                  style={{ backgroundColor: bgColor }}
                >
                  {qb.bgImage && (
                    <div
                      className="absolute inset-0 transition-all duration-200"
                      style={{
                        backgroundImage: `url('${qb.bgImage}')`,
                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                        backgroundSize: bgSize,
                        backgroundRepeat: bgRepeat,
                        opacity: bgOpacity / 100,
                      }}
                    />
                  )}
                  {overlayEnabled && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-200"
                      style={{
                        background: `linear-gradient(to right, rgba(0,0,0,${overlayOpacity / 100}), rgba(0,0,0,${(overlayOpacity * 0.7) / 100}))`
                      }}
                    />
                  )}
                  <div className="relative z-10 space-y-2">
                    <div className="w-8 h-1 bg-white rounded-full" />
                    <p className="text-xs font-bold leading-relaxed text-white drop-shadow-sm line-clamp-3">
                      {qb.text || 'Vista previa del texto de cita resaltada...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTROLES DE CONFIGURACIÓN */}
              <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                {/* Choose color & file */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Choose color & file (Fondo e Imagen)</label>
                  <div className="flex items-center space-x-3 pt-1">
                    <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded px-2 py-1">
                      <input
                        type="color"
                        className="w-5 h-5 p-0 border-0 cursor-pointer shrink-0"
                        value={bgColor}
                        onChange={(e) => updateLessonQuote(node.id, { bgColor: e.target.value })}
                        title="Color de fondo base"
                      />
                      <span className="font-mono text-[11px] uppercase text-slate-600">{bgColor}</span>
                    </div>

                    <label className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-3 py-1 rounded cursor-pointer border border-slate-300 transition-colors">
                      <Upload size={13} className="text-[#f58220]" />
                      <span>Cargar desde equipo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            alert('La imagen no debe superar los 10MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              updateLessonQuote(node.id, { bgImage: event.target.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    {qb.bgImage && (
                      <button
                        type="button"
                        onClick={() => updateLessonQuote(node.id, { bgImage: '' })}
                        className="text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
                      >
                        Quitar imagen
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="O pegue una URL de imagen (https://...)"
                      className="w-full border border-slate-300 rounded px-3 py-1 bg-white focus:outline-none focus:border-[#f58220]"
                      value={qb.bgImage || ''}
                      onChange={(e) => updateLessonQuote(node.id, { bgImage: e.target.value })}
                    />
                  </div>
                </div>

                {/* Background Position X e Y */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Background Position</label>
                  <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded border border-slate-200">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600 font-medium">X: {bgPosX}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full accent-[#f58220]"
                          value={bgPosX}
                          onChange={(e) => updateLessonQuote(node.id, { bgPositionX: Number(e.target.value) })}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-14 border border-slate-300 rounded px-1 py-0.5 text-center font-mono"
                          value={bgPosX}
                          onChange={(e) => updateLessonQuote(node.id, { bgPositionX: Math.min(100, Math.max(0, Number(e.target.value))) })}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600 font-medium">Y: {bgPosY}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full accent-[#f58220]"
                          value={bgPosY}
                          onChange={(e) => updateLessonQuote(node.id, { bgPositionY: Number(e.target.value) })}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-14 border border-slate-300 rounded px-1 py-0.5 text-center font-mono"
                          value={bgPosY}
                          onChange={(e) => updateLessonQuote(node.id, { bgPositionY: Math.min(100, Math.max(0, Number(e.target.value))) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Size & Background Repeat */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Background Size</label>
                    <select
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#f58220]"
                      value={bgSize}
                      onChange={(e) => updateLessonQuote(node.id, { bgSize: e.target.value })}
                    >
                      <option value="cover">cover (Cubrir completa)</option>
                      <option value="contain">contain (Contener)</option>
                      <option value="auto">auto (Original)</option>
                      <option value="100% 100%">100% 100% (Estirar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Background Repeat</label>
                    <select
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#f58220]"
                      value={bgRepeat}
                      onChange={(e) => updateLessonQuote(node.id, { bgRepeat: e.target.value })}
                    >
                      <option value="no-repeat">no-repeat (Sin repetición)</option>
                      <option value="repeat">repeat (Repetir ambos ejes)</option>
                      <option value="repeat-x">repeat-x (Repetir horizontal)</option>
                      <option value="repeat-y">repeat-y (Repetir vertical)</option>
                    </select>
                  </div>
                </div>

                {/* Background Opacity */}
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">Opacidad de Imagen (Background Opacity)</span>
                    <span className="text-slate-600 font-medium font-mono">{bgOpacity}%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full accent-[#f58220]"
                      value={bgOpacity}
                      onChange={(e) => updateLessonQuote(node.id, { bgOpacity: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-14 border border-slate-300 rounded px-1 py-0.5 text-center font-mono"
                      value={bgOpacity}
                      onChange={(e) => updateLessonQuote(node.id, { bgOpacity: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    />
                  </div>
                </div>

                {/* Overlay de Oscurecimiento */}
                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-2">
                  <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#f58220] w-4 h-4"
                      checked={overlayEnabled}
                      onChange={(e) => updateLessonQuote(node.id, { overlayEnabled: e.target.checked })}
                    />
                    <span>Activar Capa de Oscurecimiento (Overlay Contrast)</span>
                  </label>

                  {overlayEnabled && (
                    <div className="pt-1 space-y-1 border-t border-slate-100">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Opacidad de Oscurecimiento</span>
                        <span className="font-mono">{overlayOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="w-full accent-[#f58220]"
                        value={overlayOpacity}
                        onChange={(e) => updateLessonQuote(node.id, { overlayOpacity: Number(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteConfigModal(false)}
                  className="bg-[#f58220] text-white font-bold text-xs px-5 py-2 rounded uppercase shadow-sm cursor-pointer hover:bg-[#e07010] transition-colors"
                >
                  Guardar y cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bloques de Contenido */}
      <div className="space-y-4">
        {node.blocks.map((block) => {
          const Block = BLOCK_COMPONENTS[block.kind];
          return Block ? <Block key={block.id} lessonId={node.id} block={block} /> : null;
        })}
      </div>

      {/* BARRA DE HERRAMIENTAS DE BLOQUES INTERACTIVOS (AGREGAR OBJETOS DIDÁCTICOS) */}
      <div className="mt-8 pt-4 border-t border-slate-200 space-y-2">
        <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
          + Añadir Objeto Didáctico o Interactivo a la Lección
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addBlock(node.id, 'text')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Type size={13} className="text-indigo-600" />
            <span>Texto</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'video')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Video size={13} className="text-red-500" />
            <span>Video</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'accordion')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Layers size={13} className="text-[#f58220]" />
            <span>Acordeón</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'flipcard')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw size={13} className="text-purple-600" />
            <span>Tarjetas 3D</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'timeline')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <GitCommit size={13} className="text-blue-600" />
            <span>Línea de Tiempo</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'callout')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <AlertCircle size={13} className="text-amber-500" />
            <span>Caja Destacada</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'gallery')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <ImageIcon size={13} className="text-emerald-600" />
            <span>Galería</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'resource')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Download size={13} className="text-cyan-600" />
            <span>Recurso / PDF</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'knowledge_check')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <HelpCircle size={13} className="text-pink-600" />
            <span>Trivia Rápida</span>
          </button>
        </div>
      </div>
    </main>
  );
}

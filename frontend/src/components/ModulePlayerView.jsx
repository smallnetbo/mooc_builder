import React, { useState } from 'react';
import { useCourseStore, getAllLessons } from '../store/courseStore';
import ModuleCoverView from './ModuleCoverView';
import {
  Menu,
  ArrowUp,
  Search,
  Check,
  Circle,
  Play,
  FileText,
  HelpCircle,
  ChevronRight,
  Layers,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
  Briefcase,
  Download,
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import QuizRunner from './QuizRunner';

function StudentAccordion({ block, themeColor }) {
  const items = block.content?.items || [];
  const [openIds, setOpenIds] = useState(items[0] ? [items[0].id] : []);

  const toggle = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-2 border border-slate-200 rounded-xl p-2 bg-white shadow-2xs">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all">
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
            >
              <span className="text-xs sm:text-sm font-bold text-slate-800">{item.title}</span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                style={isOpen ? { color: themeColor } : {}}
              />
            </button>
            {isOpen && (
              <div className="p-4 bg-white text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StudentFlipCards({ block, themeColor }) {
  const [flippedIds, setFlippedIds] = useState([]);
  const cards = block.content?.cards || [];

  const toggleFlip = (id) => {
    setFlippedIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => {
        const isFlipped = flippedIds.includes(card.id);
        return (
          <div
            key={card.id}
            onClick={() => toggleFlip(card.id)}
            className="h-44 cursor-pointer group"
            style={{ perspective: '1000px' }}
          >
            <div
              className={`relative w-full h-full rounded-xl transition-all duration-500 shadow-md ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Cara Frontal */}
              <div
                className="absolute inset-0 rounded-xl p-5 flex flex-col justify-between items-center text-center text-white shadow-sm [backface-visibility:hidden]"
                style={{ backgroundColor: themeColor }}
              >
                <div className="w-full flex justify-end">
                  <RefreshCw size={14} className="opacity-70 group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <h4 className="text-sm sm:text-base font-extrabold px-2">{card.frontTitle}</h4>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                  Haz clic para voltear ↺
                </span>
              </div>

              {/* Cara Posterior */}
              <div
                className="absolute inset-0 rounded-xl p-5 flex flex-col justify-between items-center text-center bg-slate-900 text-white shadow-sm [transform:rotateY(180deg)] [backface-visibility:hidden]"
              >
                <div className="w-full flex justify-end">
                  <RefreshCw size={14} className="opacity-70" />
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed overflow-y-auto max-h-24">
                  {card.backContent}
                </p>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
                  Volver al frente ↺
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StudentTimeline({ block, themeColor }) {
  const steps = block.content?.steps || [];
  return (
    <div className="space-y-4 relative border-l-2 pl-6 ml-3 my-4" style={{ borderColor: `${themeColor}40` }}>
      {steps.map((step, idx) => (
        <div key={step.id} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div
            className="absolute -left-[33px] top-4 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
            style={{ backgroundColor: themeColor }}
          >
            {idx + 1}
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">{step.title}</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

function StudentCallout({ block }) {
  const content = block.content || {};
  const type = content.type || 'tip';

  const configMap = {
    tip: { icon: Lightbulb, color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/80' },
    important: { icon: AlertCircle, color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/80' },
    warning: { icon: AlertTriangle, color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50/80' },
    example: { icon: Briefcase, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50/80' }
  };

  const cfg = configMap[type] || configMap.tip;
  const IconComp = cfg.icon;

  return (
    <div className={`border rounded-xl p-4 sm:p-5 ${cfg.border} ${cfg.bg} space-y-2 shadow-xs`}>
      <div className="flex items-center space-x-2">
        <IconComp size={18} className={cfg.color} />
        <h4 className={`text-xs sm:text-sm font-bold ${cfg.color}`}>{content.title}</h4>
      </div>
      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-6">{content.text}</p>
    </div>
  );
}

function StudentGallery({ block, themeColor }) {
  const [currIdx, setCurrIdx] = useState(0);
  const images = block.content?.images || [];

  if (images.length === 0) return null;

  const currentImg = images[currIdx] || images[0];

  const prev = () => setCurrIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg text-white space-y-2 p-4">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
        <img
          src={currentImg.url}
          alt={currentImg.caption}
          className="w-full h-full object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
        <p className="font-semibold italic">{currentImg.caption}</p>
        <span className="font-bold tracking-widest text-[10px] text-white/70">
          {currIdx + 1} / {images.length}
        </span>
      </div>
    </div>
  );
}

function StudentResource({ block, themeColor }) {
  const content = block.content || {};
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-start space-x-3.5">
        <div
          className="w-10 h-10 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs"
          style={{ backgroundColor: themeColor }}
        >
          {content.fileType || 'FILE'}
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{content.fileTitle}</h4>
          <p className="text-xs text-slate-500 leading-snug">{content.description}</p>
          {content.fileSize && (
            <span className="inline-block text-[10px] font-semibold text-slate-400">
              Tamaño: {content.fileSize}
            </span>
          )}
        </div>
      </div>
      <a
        href={content.fileUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="text-xs font-bold text-white px-4 py-2 rounded-lg flex items-center space-x-2 shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        style={{ backgroundColor: themeColor }}
      >
        <Download size={14} />
        <span>Descargar</span>
      </a>
    </div>
  );
}

function StudentKnowledgeCheck({ block, themeColor }) {
  const content = block.content || {};
  const [selectedOptId, setSelectedOptId] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const options = content.options || [];

  const handleCheck = () => {
    if (!selectedOptId) return;
    setSubmitted(true);
  };

  const selectedOpt = options.find((o) => o.id === selectedOptId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <HelpCircle size={15} style={{ color: themeColor }} />
        <span>Comprobación Rápida de Conocimiento</span>
      </div>

      <h3 className="text-sm sm:text-base font-bold text-slate-900">{content.question}</h3>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedOptId === opt.id;
          let optStyle = 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700';

          if (submitted) {
            if (opt.isCorrect) {
              optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
            } else if (isSelected && !opt.isCorrect) {
              optStyle = 'border-rose-500 bg-rose-50 text-rose-900';
            }
          } else if (isSelected) {
            optStyle = 'border-slate-900 bg-slate-900 text-white font-semibold';
          }

          return (
            <label
              key={opt.id}
              onClick={() => !submitted && setSelectedOptId(opt.id)}
              className={`flex items-center space-x-3 p-3 rounded-lg border text-xs sm:text-sm cursor-pointer transition-all ${optStyle}`}
            >
              <input
                type="radio"
                name={`kc_opt_${block.id}`}
                checked={isSelected}
                onChange={() => {}}
                disabled={submitted}
                className="hidden"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-white' : 'border-slate-400'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>
              <span className="flex-1">{opt.text}</span>
            </label>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleCheck}
          disabled={!selectedOptId}
          style={{ backgroundColor: themeColor }}
          className={`text-xs font-bold text-white px-5 py-2.5 rounded-lg tracking-wider uppercase transition-opacity cursor-pointer ${
            !selectedOptId ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-105 shadow-sm'
          }`}
        >
          Comprobar Respuesta
        </button>
      ) : (
        <div
          className={`p-4 rounded-lg text-xs sm:text-sm space-y-1 ${
            selectedOpt?.isCorrect
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <p className="font-bold">
            {selectedOpt?.isCorrect ? '¡Correcto! 🎉' : 'Respuesta Incorrecta'}
          </p>
          <p className="leading-relaxed">{content.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default function ModulePlayerView() {
  const {
    course,
    selectedModuleId,
    selectedLessonId,
    completedLessonIds,
    selectModule,
    selectLesson,
    nextLesson,
    playerScreen,
    setPlayerScreen,
    sidebarOpen,
    toggleSidebar
  } = useCourseStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const moduleNode = course.modules.find((m) => m.id === selectedModuleId) || course.modules[0];

  if (!moduleNode) {
    return <div className="p-8 text-center text-slate-500">No hay módulo activo.</div>;
  }

  const lessons = getAllLessons(moduleNode);
  const currentLessonIndex = lessons.findIndex((l) => l.id === selectedLessonId);
  const currentLesson = lessons[currentLessonIndex] || lessons[0];

  // Cálculo exacto del porcentaje de completitud (20% por cada 1 de 5)
  const completedCount = lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const themeColor = moduleNode.primaryColor || '#f58220';

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      {/* BARRA SUPERIOR PRINCIPAL (Captura 2) */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Alternar menú lateral"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Botón Central ↑ Inicio (Vuelve a la carátula Captura 1) */}
        <button
          onClick={() => setPlayerScreen('cover')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:opacity-80 transition-colors cursor-pointer"
        >
          <ArrowUp size={14} style={{ color: themeColor }} />
          <span>Inicio</span>
        </button>

        {/* Botón Derecho TERMINAR */}
        <button
          onClick={() => setPlayerScreen('cover')}
          className="text-xs font-bold text-slate-700 hover:opacity-80 tracking-wider uppercase cursor-pointer"
          style={{ color: themeColor }}
        >
          TERMINAR
        </button>
      </header>

      {/* CUERPO CON SIDEBAR Y CONTENIDO */}
      <div className="flex flex-1 min-h-0 relative">
        {/* PANEL LATERAL (SIDEBAR CON SELECTOR DE MÓDULO) */}
        {sidebarOpen && (
          <aside className="w-72 bg-[#f4f4f6] border-r border-slate-200 flex flex-col shrink-0 z-20 transition-all duration-200">
            {/* Cabecera Vistosa con Color Primario Dinámico y Selector de Módulo */}
            <div className="text-white p-4 space-y-3 shadow-sm" style={{ backgroundColor: themeColor }}>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">
                    Seleccionar Módulo
                  </span>
                  <button
                    onClick={() => setShowSearchInput(!showSearchInput)}
                    className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
                    title="Buscar lección en el módulo"
                  >
                    <Search size={15} />
                  </button>
                </div>

                {/* SELECTOR DESPLEGABLE DE MÓDULOS */}
                <select
                  value={selectedModuleId}
                  onChange={(e) => selectModule(e.target.value)}
                  className="w-full text-xs font-bold bg-black/20 text-white border border-white/30 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white cursor-pointer"
                >
                  {course.modules.map((m) => (
                    <option key={m.id} value={m.id} className="text-slate-900 font-medium">
                      {m.number ? `${m.number}: ` : ''}{m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input de Búsqueda opcional */}
              {showSearchInput && (
                <input
                  type="text"
                  placeholder="Buscar lección..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white"
                />
              )}

              {/* Barra de Progreso: "% COMPLETA" */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px] font-extrabold tracking-wider uppercase text-white/90">
                  <span>{progressPercent}% COMPLETA</span>
                </div>
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de Lecciones/Elementos en Sidebar */}
            <nav className="flex-1 overflow-y-auto divide-y divide-slate-200/60 py-1">
              {filteredLessons.map((lesson, idx) => {
                const isCurrent = playerScreen === 'lesson' && lesson.id === selectedLessonId;
                const isCompleted = completedLessonIds.includes(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => selectLesson(lesson.id)}
                    style={isCurrent ? { borderLeftColor: themeColor, borderLeftWidth: '4px' } : {}}
                    className={`flex items-start justify-between p-3.5 text-xs transition-colors cursor-pointer group ${
                      isCurrent
                        ? 'bg-white font-bold text-slate-900 shadow-2xs'
                        : 'hover:bg-slate-200/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 pr-2">
                      <span className="mt-0.5" style={{ color: isCurrent ? themeColor : '#94a3b8' }}>
                        {lesson.type === 'assessment' ? (
                          <HelpCircle size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </span>
                      <span className="leading-snug">{lesson.title}</span>
                    </div>

                    {/* Indicador de estado a la derecha */}
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs" style={{ backgroundColor: themeColor }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: themeColor }}>
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: themeColor }} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        {/* ÁREA DE CONTENIDO PRINCIPAL (CARÁTULA O REPRODUCTOR) */}
        <main className="flex-1 overflow-y-auto">
          {playerScreen === 'cover' ? (
            <ModuleCoverView />
          ) : (
            <div className="p-4 sm:p-8 flex flex-col items-center">
              <div className="max-w-3xl w-full space-y-6">
                {/* Título de la Lección y Subtítulo: "ELEMENTO 1 DE 5" */}
                <div className="text-center space-y-1 pt-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {currentLesson?.title}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                    ELEMENTO {currentLessonIndex + 1} DE {lessons.length}
                  </p>
                </div>

                {/* CARTA HERO DE CITA / CONCEPTO CLAVE (Captura 2) */}
                {currentLesson?.quoteBanner && (() => {
                  const qb = currentLesson.quoteBanner;
                  const bgPosX = qb.bgPositionX ?? 50;
                  const bgPosY = qb.bgPositionY ?? 50;
                  const bgSize = qb.bgSize || 'cover';
                  const bgRepeat = qb.bgRepeat || 'no-repeat';
                  const bgOpacity = qb.bgOpacity ?? 30;
                  const bgColor = qb.bgColor || '#0f172a';
                  const overlayEnabled = qb.overlayEnabled !== false;
                  const overlayOpacity = qb.overlayOpacity ?? 70;

                  return (
                    <div
                      className="relative w-full rounded-lg overflow-hidden text-white min-h-[180px] sm:min-h-[220px] flex items-center p-6 sm:p-10 shadow-lg transition-all"
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

                      <div className="relative z-10 max-w-xl space-y-3">
                        <div className="w-12 h-1 bg-white rounded-full mb-3" />
                        <p className="text-sm sm:text-base md:text-lg font-bold leading-relaxed tracking-wide text-white drop-shadow-sm">
                          {qb.text}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* CONTENIDO DE LOS BLOQUES DE LA LECCIÓN */}
                {currentLesson?.type === 'assessment' ? (
                  <QuizRunner assessment={currentLesson} onComplete={nextLesson} themeColor={themeColor} />
                ) : (
                  <div className="space-y-6 py-2">
                    {currentLesson?.blocks?.map((block) => (
                      <div key={block.id} className="space-y-3">
                        {block.kind === 'text' && (
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                            {block.content}
                          </p>
                        )}

                        {block.kind === 'video' && (
                          <div className="w-full rounded-lg overflow-hidden border border-slate-200 bg-black shadow-md">
                            {typeof block.content === 'object' && block.content.url ? (
                              <div className="aspect-video w-full">
                                <iframe
                                  src={block.content.url}
                                  title="Video lección"
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              // Mock de Reproductor de Video con Botón Play
                              <div className="relative aspect-video w-full bg-slate-800 flex items-center justify-center group cursor-pointer">
                                <img
                                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1200&auto=format&fit=crop"
                                  alt="Video thumbnail"
                                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity"
                                />
                                <div
                                  className="relative z-10 w-16 h-16 rounded-full text-white flex items-center justify-center transition-all transform group-hover:scale-110 shadow-xl"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  <Play size={28} className="ml-1 fill-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {block.kind === 'accordion' && (
                          <StudentAccordion block={block} themeColor={themeColor} />
                        )}

                        {block.kind === 'flipcard' && (
                          <StudentFlipCards block={block} themeColor={themeColor} />
                        )}

                        {block.kind === 'timeline' && (
                          <StudentTimeline block={block} themeColor={themeColor} />
                        )}

                        {block.kind === 'callout' && (
                          <StudentCallout block={block} />
                        )}

                        {block.kind === 'gallery' && (
                          <StudentGallery block={block} themeColor={themeColor} />
                        )}

                        {block.kind === 'resource' && (
                          <StudentResource block={block} themeColor={themeColor} />
                        )}

                        {block.kind === 'knowledge_check' && (
                          <StudentKnowledgeCheck block={block} themeColor={themeColor} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* BOTÓN INFERIOR ANCHO VIBRANTE "CONTINUAR" */}
                <div className="pt-6 pb-12 w-full">
                  <button
                    onClick={nextLesson}
                    style={{ backgroundColor: themeColor }}
                    className="w-full text-white font-bold py-3.5 px-6 rounded shadow-md hover:shadow-lg tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center text-xs sm:text-sm hover:brightness-105"
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

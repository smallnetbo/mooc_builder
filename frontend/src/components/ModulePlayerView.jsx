// ModulePlayerView.jsx — Pantalla de reproducción de contenido del módulo (Captura 2)
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
  Layers
} from 'lucide-react';
import QuizRunner from './QuizRunner';

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
                {currentLesson?.quoteBanner && (
                  <div className="relative w-full rounded-lg overflow-hidden bg-slate-900 text-white min-h-[180px] sm:min-h-[220px] flex items-center p-6 sm:p-10 shadow-lg">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-30 transform scale-105"
                      style={{ backgroundImage: `url(${currentLesson.quoteBanner.bgImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/70" />

                    <div className="relative z-10 max-w-xl space-y-3">
                      {/* Línea horizontal blanca de acento */}
                      <div className="w-12 h-1 bg-white rounded-full mb-3" />
                      <p className="text-sm sm:text-base md:text-lg font-bold leading-relaxed tracking-wide text-white drop-shadow-sm">
                        {currentLesson.quoteBanner.text}
                      </p>
                    </div>
                  </div>
                )}

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

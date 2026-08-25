// ModuleCoverView.jsx — Pantalla de presentación/carátula del módulo (Captura 1)
import React from 'react';
import { useCourseStore, getAllLessons } from '../store/courseStore';
import { AlignLeft, Check, Circle } from 'lucide-react';

export default function ModuleCoverView() {
  const {
    course,
    selectedModuleId,
    completedLessonIds,
    selectLesson,
    setPlayerScreen
  } = useCourseStore();

  const moduleNode = course.modules.find((m) => m.id === selectedModuleId) || course.modules[0];

  if (!moduleNode) {
    return <div className="p-8 text-center text-slate-500">No hay ningún módulo seleccionado.</div>;
  }

  const lessons = getAllLessons(moduleNode);

  const handleStartOrContinue = () => {
    // Busca la primera lección no completada en este módulo
    const firstUnfinished = lessons.find((l) => !completedLessonIds.includes(l.id));
    if (firstUnfinished) {
      selectLesson(firstUnfinished.id);
    } else {
      // Si el módulo actual ya se completó, avanza al siguiente módulo del curso
      const modIndex = course.modules.findIndex((m) => m.id === selectedModuleId);
      if (modIndex >= 0 && modIndex < course.modules.length - 1) {
        const nextMod = course.modules[modIndex + 1];
        const nextLessons = getAllLessons(nextMod);
        selectModule(nextMod.id);
        if (nextLessons[0]) {
          selectLesson(nextLessons[0].id);
        }
      } else if (lessons[0]) {
        selectLesson(lessons[0].id);
      }
    }
  };

  const themeColor = moduleNode.primaryColor || '#f58220';

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans">
      {/* HERO SECTION CON BORDES CURVOS CONCAVOS (Captura 1) */}
      <div className="relative w-full bg-slate-900 text-white min-h-[420px] sm:min-h-[480px] flex flex-col justify-center items-center overflow-hidden">
        {/* Imagen de fondo con overlay oscuro */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transform scale-105"
          style={{ backgroundImage: `url(${moduleNode.coverImage || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />

        {/* Cita / Título Principal del Módulo */}
        <div className="relative z-10 max-w-4xl px-6 text-center space-y-6 pt-10 pb-20">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-md text-white">
            {moduleNode.number ? `${moduleNode.number}: ` : ''}{moduleNode.title}
          </h1>

          {/* Botón OVALADO blanco CONTINUAR */}
          <div className="pt-2">
            <button
              onClick={handleStartOrContinue}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm px-10 py-3 rounded-full shadow-2xl tracking-widest uppercase transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              CONTINUAR
            </button>
          </div>
        </div>

        {/* CURVA CÓNCAVA INFERIOR (Forma cóncava blanca suave) */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20">
          <svg
            className="relative block w-full h-16 sm:h-24 md:h-28 text-white"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 Q720,130 1440,0 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: OBJETIVO Y LISTADO DE ELEMENTOS */}
      <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-8 flex-1">
        {/* Objetivo del Módulo */}
        <div className="text-center space-y-2">
          <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-slate-800 uppercase">
            Objetivo
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
            {moduleNode.objective || 'Describa aquí los objetivos clave de aprendizaje para este módulo.'}
          </p>
        </div>

        {/* Tabla / Lista de Contenido del Módulo */}
        <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {lessons.map((lesson, idx) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            // Si no está completado, evaluamos si es la lección activa o siguiente
            const isInProgress = !isCompleted && (idx === 0 || completedLessonIds.includes(lessons[idx - 1]?.id));

            return (
              <div
                key={lesson.id}
                onClick={() => selectLesson(lesson.id)}
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                {/* Ícono de lista izquierda + Título */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                    <AlignLeft size={16} />
                  </span>
                  <span className={`text-xs sm:text-sm font-medium ${isCompleted ? 'text-slate-800 font-semibold' : 'text-slate-700'}`}>
                    {lesson.title}
                  </span>
                </div>

                {/* Indicador de estado a la derecha (Dinámico según el color del módulo) */}
                <div className="flex items-center">
                  {isCompleted ? (
                    <div
                      className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : isInProgress ? (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: themeColor }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                      <Circle size={10} className="text-transparent" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

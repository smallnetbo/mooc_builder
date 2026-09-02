import React, { useState, useEffect } from 'react';
import { normalizeQuizConfig, getCurrentUserId } from '../modules/quiz/types';
import { calculateAttemptScore, calculateFinalGrade } from '../modules/quiz/scoring';
import {
  saveQuizAttemptToSCORM,
  loadQuizAttemptsFromSCORM,
  saveActiveQuizDraftToSCORM,
  loadActiveQuizDraftFromSCORM,
  clearActiveQuizDraftInSCORM
} from '../modules/quiz/scormAdapter';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Flag,
  ChevronRight,
  ChevronLeft,
  FileText,
  Award,
  ShieldAlert,
  Check,
  X,
  HelpCircle,
  Info
} from 'lucide-react';

export default function QuizRunner({ assessment, onComplete, themeColor = '#f58220' }) {
  const quizConfig = normalizeQuizConfig(assessment);
  const settings = quizConfig.settings;
  const questions = quizConfig.questions;
  const currentUserId = getCurrentUserId();

  // Estado del flujo: 'cover' | 'attempt' | 'summary' | 'review'
  const [stage, setStage] = useState('cover');
  const [attemptsHistory, setAttemptsHistory] = useState([]);
  const [reviewingAttemptIndex, setReviewingAttemptIndex] = useState(null);

  // Modales
  const [showStartModal, setShowStartModal] = useState(false);
  const [showMaxAttemptsModal, setShowMaxAttemptsModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastSubmittedResult, setLastSubmittedResult] = useState(null);

  // Estado del intento en curso
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: [optIds] }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [qId]: true }
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(settings.time_limit_seconds || 0);

  // Cargar historial de intentos al montar desde SCORM suspend_data (Servidor LMS)
  useEffect(() => {
    const loaded = loadQuizAttemptsFromSCORM(assessment.id);
    setAttemptsHistory(loaded);
  }, [assessment.id]);

  // Cargar borrador de intento activo si existe en SCORM suspend_data
  useEffect(() => {
    const draft = loadActiveQuizDraftFromSCORM(assessment.id);
    if (draft && draft.userAnswers) {
      setUserAnswers(draft.userAnswers || {});
      setFlaggedQuestions(draft.flaggedQuestions || {});
      if (draft.timeRemaining !== undefined) setTimeRemaining(draft.timeRemaining);
      if (draft.stage === 'attempt' || draft.stage === 'summary') setStage(draft.stage);
    }
  }, [assessment.id]);

  // Temporizador flotante de cuenta regresiva
  useEffect(() => {
    let timer = null;
    if (stage === 'attempt' && settings.time_limit_seconds > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinalSubmit(true);
            return 0;
          }
          const nextVal = prev - 1;
          saveActiveQuizDraftToSCORM({
            assessmentId: assessment.id,
            userAnswers,
            flaggedQuestions,
            timeRemaining: nextVal,
            stage
          });
          return nextVal;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, settings.time_limit_seconds, userAnswers, flaggedQuestions, assessment.id]);

  const handleSelectOption = (questionId, optionId, isMultipleChoice) => {
    setUserAnswers((prev) => {
      const current = prev[questionId] || [];
      let updated = [];
      if (isMultipleChoice) {
        if (current.includes(optionId)) {
          updated = current.filter((id) => id !== optionId);
        } else {
          updated = [...current, optionId];
        }
      } else {
        updated = [optionId];
      }
      const newAnswers = { ...prev, [questionId]: updated };
      saveActiveQuizDraftToSCORM({
        assessmentId: assessment.id,
        userAnswers: newAnswers,
        flaggedQuestions,
        timeRemaining,
        stage: 'attempt'
      });
      return newAnswers;
    });
  };

  const toggleFlagQuestion = (questionId) => {
    setFlaggedQuestions((prev) => {
      const updated = { ...prev, [questionId]: !prev[questionId] };
      saveActiveQuizDraftToSCORM({
        assessmentId: assessment.id,
        userAnswers,
        flaggedQuestions: updated,
        timeRemaining,
        stage: 'attempt'
      });
      return updated;
    });
  };

  const handleRequestStartAttempt = () => {
    const attemptsUsed = attemptsHistory.length;
    const max = settings.max_attempts;

    if (max > 0 && attemptsUsed >= max) {
      setShowMaxAttemptsModal(true);
      return;
    }

    if (settings.time_limit_seconds > 0 || max > 0) {
      setShowStartModal(true);
    } else {
      handleStartAttempt();
    }
  };

  const handleStartAttempt = () => {
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQIndex(0);
    setTimeRemaining(settings.time_limit_seconds || 0);
    setShowStartModal(false);
    setShowMaxAttemptsModal(false);
    setStage('attempt');
    saveActiveQuizDraftToSCORM({
      assessmentId: assessment.id,
      userAnswers: {},
      flaggedQuestions: {},
      timeRemaining: settings.time_limit_seconds || 0,
      stage: 'attempt'
    });
  };

  const handleFinalSubmit = (isAutoSubmit = false) => {
    const attemptScore = calculateAttemptScore(quizConfig, userAnswers);
    const passingGrade = settings.passing_grade || 7.0;
    const isPassed = attemptScore.grade >= passingGrade;

    const newAttemptRecord = {
      userId: currentUserId,
      attemptNumber: attemptsHistory.length + 1,
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      userAnswers,
      attemptScore,
      grade: attemptScore.grade,
      maxGrade: settings.max_grade,
      isPassed,
      isAutoSubmit
    };

    const updatedHistory = [...attemptsHistory, newAttemptRecord];
    setAttemptsHistory(updatedHistory);

    clearActiveQuizDraftInSCORM(assessment.id);

    saveQuizAttemptToSCORM({
      assessmentId: assessment.id,
      attemptResult: { grade: attemptScore.grade, isPassed },
      attemptsHistory: updatedHistory,
      quizConfig
    });

    setLastSubmittedResult(newAttemptRecord);
    setReviewingAttemptIndex(updatedHistory.length - 1);
    setShowResultModal(true);
  };


  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColorClass = () => {
    if (timeRemaining <= 120) return 'bg-rose-600 text-white animate-pulse';
    if (timeRemaining <= 300) return 'bg-[#f58220] text-white';
    return 'bg-emerald-600 text-white';
  };

  const attemptsLeft =
    settings.max_attempts > 0 ? settings.max_attempts - attemptsHistory.length : 999;
  const canStartNewAttempt = settings.max_attempts === 0 || attemptsLeft > 0;
  const currentFinal = calculateFinalGrade(attemptsHistory, settings, currentUserId);


  // --- 1. VISTA DE PORTADA E HISTORIAL DE INTENTOS ---
  if (stage === 'cover') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto w-full">
        {/* BANNER ESTILO MOODLE DE EVALUACIÓN */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[140px] shadow-md"
          style={{
            background: `linear-[#f58220] linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)`
          }}
        >
          <div className="relative z-10 space-y-2">
            <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full backdrop-blur-xs tracking-wider">
              CUESTIONARIO
            </span>
            <h1 className="text-xl sm:text-2xl font-black">{quizConfig.title}</h1>
            <p className="text-xs text-white/80 max-w-xl">{quizConfig.description}</p>
          </div>
        </div>

        {/* TARJETA DE REGLAS DE LA EVALUACIÓN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Intentos Permitidos</span>
            <span className="text-slate-800 text-sm font-extrabold">
              {settings.max_attempts > 0 ? settings.max_attempts : 'Sin Límite'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tiempo Límite</span>
            <span className="text-slate-800 text-sm font-extrabold">
              {settings.time_limit_seconds > 0
                ? `${Math.round(settings.time_limit_seconds / 60)} minutos`
                : 'Sin Límite'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Calificación Aprobatoria</span>
            <span className="text-emerald-700 text-sm font-extrabold">
              {settings.passing_grade} de {settings.max_grade}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Método Calificación</span>
            <span className="text-slate-800 text-sm font-extrabold">
              {settings.grading_method === 'HIGHEST_SCORE'
                ? 'Calificación más alta'
                : settings.grading_method === 'AVERAGE'
                ? 'Promedio de intentos'
                : 'Último intento'}
            </span>
          </div>
        </div>

        {/* TABLA DE RESUMEN DE INTENTOS PREVIOS */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Resumen de sus intentos previos
          </h3>

          {attemptsHistory.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              Aún no se han registrado intentos para esta evaluación.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Intento</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Calificación / {settings.max_grade}</th>
                    <th className="p-3 text-right">Revisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attemptsHistory.map((att, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold">Intento {att.attemptNumber || idx + 1}</td>
                      <td className="p-3 text-slate-500">
                        <span className="font-semibold text-slate-700 block">Finalizado</span>
                        <span className="text-[10px] text-slate-400">Enviado: {att.date}</span>
                      </td>
                      <td className="p-3 text-center font-extrabold text-sm">
                        {att.grade}
                      </td>
                      <td className="p-3 text-right">
                        {settings.allow_review && (
                          <button
                            onClick={() => {
                              setReviewingAttemptIndex(idx);
                              setStage('review');
                            }}
                            className="text-indigo-600 hover:underline font-bold"
                          >
                            Revisión
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NOTA FINAL ACUMULADA */}
        {attemptsHistory.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Calificación registrada:</span>
              <span className="text-lg font-black text-slate-900">
                Calificación más alta: {currentFinal.finalGrade} / {settings.max_grade}
              </span>
            </div>
            {currentFinal.isPassed ? (
              <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-2xs">
                ✓ APROBADO
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs shadow-2xs">
                ✕ NO APROBADO
              </span>
            )}
          </div>
        )}

        {/* BOTÓN PRINCIPAL ACCIÓN Y BOTÓN CONTINUAR */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {canStartNewAttempt ? (
            <button
              onClick={handleRequestStartAttempt}
              style={{ backgroundColor: attemptsHistory.length > 0 ? '#475569' : themeColor }}
              className="w-full sm:flex-1 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-transform hover:scale-[1.01] shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{attemptsHistory.length === 0 ? 'Comenzar el cuestionario' : 'Reintentar el cuestionario'}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowMaxAttemptsModal(true)}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl text-xs font-extrabold bg-slate-200 text-slate-600 border border-slate-300 cursor-pointer"
            >
              Límite de Intentos Alcanzado ({settings.max_attempts} de {settings.max_attempts})
            </button>
          )}

          {(attemptsHistory.length > 0 || !canStartNewAttempt) && (
            <button
              type="button"
              onClick={() => {
                if (onComplete) onComplete();
                else if (typeof window !== 'undefined' && typeof window.nextLesson === 'function') window.nextLesson();
              }}
              style={{ backgroundColor: themeColor }}
              className="w-full sm:flex-1 text-white font-black py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-transform hover:scale-[1.01] shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Continuar a la siguiente lección</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* MODAL CONFIRMACIÓN INICIO DE INTENTO (INTENTO X DE Y) */}
        {showStartModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center space-x-3 text-[#f58220] border-b border-slate-100 pb-3">
                <Clock size={24} />
                <h3 className="font-bold text-base text-slate-800">
                  Comenzar Intento {attemptsHistory.length + 1}
                  {settings.max_attempts > 0 ? ` de ${settings.max_attempts}` : ''}
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  Está por comenzar su <strong>Intento {attemptsHistory.length + 1}</strong> para esta evaluación.
                </p>
                {settings.time_limit_seconds > 0 && (
                  <p className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800 font-medium">
                    ⚠️ Su intento tendrá un límite de tiempo de{' '}
                    <strong>{Math.round(settings.time_limit_seconds / 60)} minutos</strong>. El temporizador comenzará a contar automáticamente y no se detendrá.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStartAttempt}
                  style={{ backgroundColor: themeColor }}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  Comenzar Intento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL LÍMITE DE INTENTOS ALCANZADO */}
        {showMaxAttemptsModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200 text-center animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert size={26} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Límite de Intentos Alcanzado</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ha ocupado todos los intentos permitidos (
                <strong>
                  {attemptsHistory.length} de {settings.max_attempts}
                </strong>
                ) para este cuestionario. No es posible realizar más intentos.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700">
                Calificación Registrada: {currentFinal.finalGrade} / {settings.max_grade} (
                {currentFinal.isPassed ? 'Aprobado' : 'No Aprobado'})
              </div>
              <button
                onClick={() => setShowMaxAttemptsModal(false)}
                className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 2. VISTA DE EJECUCIÓN (ESTILO MOODLE: BLOQUE METADATOS IZQ + PREGUNTA + REJILLA DER) ---
  if (stage === 'attempt') {
    const curQ = questions[currentQIndex] || questions[0];
    const isMultiChoice =
      (curQ.options || []).filter((o) => (o.weight_percentage || 0) > 0 || o.is_correct).length > 1;
    const selectedOpts = userAnswers[curQ.id] || [];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-5xl mx-auto w-full">
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y TEMPORIZADOR FLOTANTE */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">{quizConfig.title}</h2>
            <span className="text-xs text-slate-400 font-semibold">
              Pregunta {currentQIndex + 1} de {questions.length}
            </span>
          </div>

          {settings.time_limit_seconds > 0 && (
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-sm ${getTimerColorClass()}`}
            >
              <Clock size={16} />
              <span>Tiempo restante: {formatTimer(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ÁREA PRINCIPAL DE LA PREGUNTA ACTIVA CON BLOQUE IZQUIERDO MOODLE */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              {/* METADATOS DE PREGUNTA (COLUMNA IZQUIERDA MOODLE) */}
              <div className="sm:col-span-3 bg-slate-50 border-r border-slate-200 p-4 text-xs space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    Pregunta {currentQIndex + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {selectedOpts.length > 0 ? 'Respuesta guardada' : 'Sin responder aún'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Se puntúa como {curQ.points || 1},00
                  </span>
                </div>

                <button
                  onClick={() => toggleFlagQuestion(curQ.id)}
                  className={`flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer w-full justify-center ${
                    flaggedQuestions[curQ.id]
                      ? 'border-amber-400 bg-amber-100 text-amber-800'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Flag size={12} />
                  <span>{flaggedQuestions[curQ.id] ? 'Marcada' : 'Marcar pregunta'}</span>
                </button>
              </div>

              {/* CONTENIDO Y OPCIONES (SIN MOSTRAR PORCENTAJES AL ESTUDIANTE AL RESPONDER) */}
              <div className="sm:col-span-9 p-5 bg-white space-y-4">
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{curQ.text}</p>

                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  {isMultiChoice ? 'Seleccione una o más opciones:' : 'Seleccione una:'}
                </span>

                <div className="space-y-2.5 pt-1">
                  {curQ.options.map((opt) => {
                    const isSelected = selectedOpts.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(curQ.id, opt.id, isMultiChoice)}
                        className={`flex items-center space-x-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#f58220] bg-orange-50/50 font-semibold text-slate-900 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type={isMultiChoice ? 'checkbox' : 'radio'}
                          name={`q_${curQ.id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-[#f58220] w-4 h-4 cursor-pointer"
                        />
                        {/* SOLO MOSTRAR TEXTO DE LA OPCION SIN NINGUN INDICADOR % */}
                        <span>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NAVEGACIÓN ENTRE PREGUNTAS */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  style={{ backgroundColor: themeColor }}
                  className="flex items-center space-x-1 px-5 py-2 rounded-lg text-xs font-bold text-white cursor-pointer shadow-md"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setStage('summary')}
                  className="flex items-center space-x-1 px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  <span>Terminar intento...</span>
                </button>
              )}
            </div>
          </div>

          {/* CUADRÍCULA LATERAL DE NAVEGACIÓN DE PREGUNTAS (ESTILO MOODLE) */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-2">
              Navegación por el cuestionario
            </h4>

            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = (userAnswers[q.id] || []).length > 0;
                const isFlagged = Boolean(flaggedQuestions[q.id]);
                const isCurrent = idx === currentQIndex;

                let bgClass = 'bg-white border-slate-300 text-slate-700';
                if (isAnswered) bgClass = 'bg-slate-800 border-slate-800 text-white font-bold';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`relative h-10 rounded-lg border flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${bgClass} ${
                      isCurrent ? 'ring-2 ring-[#f58220] ring-offset-1' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStage('summary')}
              className="w-full py-2.5 mt-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 cursor-pointer shadow-xs"
            >
              Terminar intento...
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. PANTALLA DE RESUMEN PREVIO AL ENVÍO DEFINITIVO ---
  if (stage === 'summary') {
    const answeredCount = questions.filter((q) => (userAnswers[q.id] || []).length > 0).length;
    const unansweredCount = questions.length - answeredCount;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto w-full">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Resumen del intento</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifique el estado de sus respuestas antes del envío final.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Pregunta</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((q, idx) => {
                const isAnswered = (userAnswers[q.id] || []).length > 0;
                const isFlagged = Boolean(flaggedQuestions[q.id]);

                return (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold">Pregunta {idx + 1}</td>
                    <td className="p-3 flex items-center space-x-2">
                      {isAnswered ? (
                        <span className="text-emerald-700 font-semibold">Respuesta guardada</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Sin responder aún</span>
                      )}
                      {isFlagged && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          Marcada
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {unansweredCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle size={18} />
            <span>Tiene {unansweredCount} pregunta(s) sin responder en este intento.</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setStage('attempt')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Volver al intento
          </button>

          <button
            onClick={() => handleFinalSubmit(false)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 shadow-md cursor-pointer"
          >
            Enviar todo y terminar
          </button>
        </div>

        {/* MODAL DE RESULTADO / RETROALIMENTACIÓN POST-ENVÍO */}
        {showResultModal && lastSubmittedResult && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md ${
                  lastSubmittedResult.isPassed
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {lastSubmittedResult.isPassed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>

              <h3 className="font-black text-xl text-slate-800">
                {lastSubmittedResult.isPassed ? '¡Felicidades! Evaluación Aprobada' : 'Intento Finalizado'}
              </h3>

              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase block">Calificación Obtenida</span>
                <span className="text-3xl font-black text-slate-900">
                  {lastSubmittedResult.grade} / {settings.max_grade}
                </span>
                <span className="text-xs text-slate-500 font-semibold block">
                  ({lastSubmittedResult.attemptScore?.percentage}%)
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {lastSubmittedResult.isPassed
                  ? `Has superado la calificación mínima de ${settings.passing_grade} requerida.`
                  : `No alcanzaste la nota mínima de ${settings.passing_grade} para aprobar.`}
                {settings.max_attempts > 0 && (
                  <span className="block mt-1 font-bold text-slate-700">
                    Intentos utilizados: {attemptsHistory.length} de {settings.max_attempts}.
                  </span>
                )}
              </p>

              <div className="flex items-center space-x-3 pt-2">
                {settings.allow_review && (
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setStage('review');
                    }}
                    className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 shadow-md cursor-pointer"
                  >
                    Ver Revisión Detallada (✔ / ✖)
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setStage('cover');
                  }}
                  style={{ backgroundColor: themeColor }}
                  className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:brightness-105 shadow-md cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 4. REVISIÓN DETALLADA Y FEEDBACK POST-INTENTO (ESTILO MOODLE) ---
  if (stage === 'review' && reviewingAttemptIndex !== null) {
    const targetAttempt = attemptsHistory[reviewingAttemptIndex] || attemptsHistory[attemptsHistory.length - 1];
    if (!targetAttempt) return null;

    const attemptScore = targetAttempt.attemptScore;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto w-full">
        {/* ENCABEZADO DE REVISIÓN */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Revisión del Intento {targetAttempt.attemptNumber}
            </h2>
            <span className="text-xs text-slate-500 font-semibold">Enviado: {targetAttempt.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStage('cover')}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Volver a carátula
            </button>
            <button
              type="button"
              onClick={() => {
                if (onComplete) onComplete();
                else if (typeof window !== 'undefined' && typeof window.nextLesson === 'function') window.nextLesson();
              }}
              style={{ backgroundColor: themeColor }}
              className="px-4 py-2 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer hover:brightness-105 flex items-center space-x-1"
            >
              <span>Continuar</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* TABLA DE DETALLES DEL INTENTO (ESTILO MOODLE) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Estado</span>
              <span className="font-bold text-slate-800">Finalizado</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Finalizado en</span>
              <span className="font-bold text-slate-800">{targetAttempt.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Calificación</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {targetAttempt.grade} de {settings.max_grade} ({attemptScore?.percentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Resultado</span>
              {targetAttempt.isPassed ? (
                <span className="font-extrabold text-emerald-600">Aprobado</span>
              ) : (
                <span className="font-extrabold text-rose-600">No Aprobado</span>
              )}
            </div>
          </div>
        </div>

        {/* DESGLOSE PREGUNTA POR PREGUNTA (✔ / ✖ MARCAS Y FEEDBACK MOODLE) */}
        {settings.allow_review && (
          <div className="space-y-6 pt-2">
            {questions.map((q, idx) => {
              const selectedOpts = targetAttempt.userAnswers?.[q.id] || [];
              const qResult = attemptScore?.questionResults?.[q.id] || { rawScore: 0, maxPoints: 1, percentage: 0 };
              const isFullCorrect = qResult.percentage >= 100;
              const isPartial = qResult.percentage > 0 && qResult.percentage < 100;

              return (
                <div
                  key={q.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
                >
                  {/* COLUMNA IZQUIERDA MOODLE */}
                  <div className="sm:col-span-3 bg-slate-50 border-r border-slate-200 p-4 text-xs space-y-1">
                    <span className="font-extrabold text-slate-900 text-sm block">Pregunta {idx + 1}</span>
                    <span
                      className={`font-bold block text-[11px] ${
                        isFullCorrect
                          ? 'text-emerald-700'
                          : isPartial
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {isFullCorrect ? 'Correcta' : isPartial ? 'Parcialmente correcta' : 'Incorrecta'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Se puntúa {qResult.rawScore} sobre {qResult.maxPoints}
                    </span>
                  </div>

                  {/* CONTENIDO Y OPCIONES CON MARCAS DE VERIFICACION */}
                  <div className="sm:col-span-9 p-5 bg-white space-y-4">
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.text}</p>

                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedOpts.includes(opt.id);
                        const isCorrectOption = (opt.weight_percentage || 0) > 0 || opt.is_correct;

                        let optClass = 'border-slate-200 bg-white text-slate-700';
                        let mark = null;

                        if (isSelected && isCorrectOption) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                          mark = <span className="text-emerald-600 font-bold ml-2">✓</span>;
                        } else if (isSelected && !isCorrectOption) {
                          optClass = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold';
                          mark = <span className="text-rose-600 font-bold ml-2">✕</span>;
                        } else if (isCorrectOption) {
                          optClass = 'border-emerald-300 bg-emerald-50/50 text-emerald-900';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm ${optClass}`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                checked={isSelected}
                                readOnly
                                className="accent-[#f58220] w-4 h-4"
                              />
                              <span>{opt.text}</span>
                              {mark}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}

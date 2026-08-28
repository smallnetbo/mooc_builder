// scormAdapter.js — Capa de sincronización SCORM 1.2 / 2004 desacoplada con manejo de fallbacks

/**
 * Guarda los resultados del intento y el historial en el API SCORM si está disponible.
 */
export function saveQuizAttemptToSCORM({ assessmentId, attemptResult, attemptsHistory, quizConfig }) {
  const settings = quizConfig?.settings || {};
  const maxGrade = Number(settings.max_grade) || 10.0;
  const grade = Number(attemptResult?.grade) || 0;
  const isPassed = Boolean(attemptResult?.isPassed);

  // Escalar calificación a 0-100 para cmi.core.score.raw
  const rawScore = maxGrade > 0 ? Math.round((grade / maxGrade) * 100) : Math.round(grade);

  try {
    const scorm = window.ScormWrapper;

    if (scorm && typeof scorm.setScoreAndStatus === 'function') {
      scorm.setScoreAndStatus(rawScore, isPassed ? 'passed' : 'failed');
    } else if (scorm && typeof scorm.setValue === 'function') {
      scorm.setValue('cmi.core.score.raw', String(rawScore));
      scorm.setValue('cmi.core.lesson_status', isPassed ? 'passed' : 'failed');
    }

    // Persistir historial de intentos en cmi.suspend_data
    if (scorm && typeof scorm.getValue === 'function' && typeof scorm.setValue === 'function') {
      try {
        let existingData = {};
        const prevSuspend = scorm.getValue('cmi.suspend_data');
        if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
          existingData = JSON.parse(prevSuspend);
        }

        const updatedData = {
          ...existingData,
          quizAttempts: {
            ...(existingData.quizAttempts || {}),
            [assessmentId]: attemptsHistory
          }
        };

        scorm.setValue('cmi.suspend_data', JSON.stringify(updatedData));
        if (typeof scorm.commit === 'function') {
          scorm.commit();
        }
      } catch (e) {
        console.warn('[SCORM Adapter] No se pudo escribir suspend_data:', e);
      }
    }
  } catch (err) {
    console.warn('[SCORM Adapter] Ejecutando en modo standalone (sin LMS):', err.message);
  }

  // Guardado de respaldo en localStorage
  try {
    const localKey = `mooc_quiz_history_${assessmentId}`;
    localStorage.setItem(localKey, JSON.stringify(attemptsHistory));
  } catch (e) {}

  return {
    rawScore,
    status: isPassed ? 'passed' : 'failed'
  };
}

/**
 * Recupera el historial de intentos guardado previamente en SCORM o localStorage.
 */
export function loadQuizAttemptsFromSCORM(assessmentId) {
  let attempts = [];

  // Intentar cargar desde SCORM suspend_data
  try {
    const scorm = window.ScormWrapper;
    if (scorm && typeof scorm.getValue === 'function') {
      const prevSuspend = scorm.getValue('cmi.suspend_data');
      if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
        const parsed = JSON.parse(prevSuspend);
        if (parsed?.quizAttempts?.[assessmentId] && Array.isArray(parsed.quizAttempts[assessmentId])) {
          attempts = parsed.quizAttempts[assessmentId];
        }
      }
    }
  } catch (e) {}

  // Fallback a localStorage si SCORM no tiene datos
  if (attempts.length === 0) {
    try {
      const localKey = `mooc_quiz_history_${assessmentId}`;
      const savedStr = localStorage.getItem(localKey);
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        if (Array.isArray(parsed)) attempts = parsed;
      }
    } catch (e) {}
  }

  return attempts;
}

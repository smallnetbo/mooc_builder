import { getCurrentUserId } from './types';

/**
 * Retorna true si la API de SCORM en el LMS está activa y lista.
 */
export function isScormApiAvailable() {
  try {
    const scorm = typeof window !== 'undefined' ? window.ScormWrapper : null;
    if (scorm && typeof scorm.isAvailable === 'function') {
      return scorm.isAvailable();
    }
    return Boolean(scorm && scorm.API);
  } catch (e) {
    return false;
  }
}

/**
 * Guarda el progreso incompleto (borrador del intento activo) en cmi.suspend_data y fuerza commit.
 */
export function saveActiveQuizDraftToSCORM({ assessmentId, userAnswers, flaggedQuestions, timeRemaining, stage }) {
  const userId = getCurrentUserId();
  const draftData = {
    userId,
    userAnswers: userAnswers || {},
    flaggedQuestions: flaggedQuestions || {},
    timeRemaining: timeRemaining || 0,
    stage: stage || 'attempt',
    updatedAt: new Date().toISOString()
  };

  // 1. Guardar en SCORM suspend_data con commit inmediato si la API está disponible
  if (isScormApiAvailable()) {
    try {
      const scorm = window.ScormWrapper;
      let existingData = {};
      const prevSuspend = scorm.getValue('cmi.suspend_data');
      if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
        try { existingData = JSON.parse(prevSuspend); } catch (e) {}
      }

      const activeDrafts = existingData.activeQuizDrafts || {};
      activeDrafts[assessmentId] = draftData;

      const updatedSuspend = {
        ...existingData,
        activeQuizDrafts
      };

      scorm.setValue('cmi.suspend_data', JSON.stringify(updatedSuspend));
      if (typeof scorm.commit === 'function') scorm.commit();
    } catch (e) {
      console.warn('[SCORM Adapter] Error guardando borrador activo en suspend_data:', e);
    }
  }

  // 2. Respaldo local en localStorage
  try {
    const activeKey = `mooc_quiz_active_attempt_${assessmentId}_${userId}`;
    localStorage.setItem(activeKey, JSON.stringify(draftData));
  } catch (e) {}
}

/**
 * Recupera el borrador del intento activo guardado en SCORM suspend_data o localStorage.
 */
export function loadActiveQuizDraftFromSCORM(assessmentId) {
  const userId = getCurrentUserId();

  // 1. Prioridad: SCORM suspend_data si la API está disponible
  if (isScormApiAvailable()) {
    try {
      const scorm = window.ScormWrapper;
      const prevSuspend = scorm.getValue('cmi.suspend_data');
      if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
        const parsed = JSON.parse(prevSuspend);
        const draft = parsed?.activeQuizDrafts?.[assessmentId];
        if (draft && (!draft.userId || draft.userId === userId)) {
          return draft;
        }
      }
    } catch (e) {}
  }

  // 2. Fallback a localStorage solo si SCORM no tiene el borrador
  try {
    const activeKey = `mooc_quiz_active_attempt_${assessmentId}_${userId}`;
    const legacyKey = `mooc_quiz_active_attempt_${assessmentId}`;
    const savedUserStr = localStorage.getItem(activeKey) || localStorage.getItem(legacyKey);
    if (savedUserStr) {
      const parsed = JSON.parse(savedUserStr);
      if (parsed && (!parsed.userId || parsed.userId === userId)) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Elimina el borrador de intento activo al finalizar y enviar la evaluación.
 */
export function clearActiveQuizDraftInSCORM(assessmentId) {
  const userId = getCurrentUserId();

  if (isScormApiAvailable()) {
    try {
      const scorm = window.ScormWrapper;
      const prevSuspend = scorm.getValue('cmi.suspend_data');
      if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
        const parsed = JSON.parse(prevSuspend);
        if (parsed.activeQuizDrafts && parsed.activeQuizDrafts[assessmentId]) {
          delete parsed.activeQuizDrafts[assessmentId];
          scorm.setValue('cmi.suspend_data', JSON.stringify(parsed));
          if (typeof scorm.commit === 'function') scorm.commit();
        }
      }
    } catch (e) {}
  }

  try {
    const activeKey = `mooc_quiz_active_attempt_${assessmentId}_${userId}`;
    localStorage.removeItem(activeKey);
  } catch (e) {}
}

/**
 * Guarda los resultados del intento final y el historial en el API SCORM con PERSISTENCIA FORZADA INMEDIATA.
 */
export function saveQuizAttemptToSCORM({ assessmentId, attemptResult, attemptsHistory, quizConfig }) {
  const userId = getCurrentUserId();
  const settings = quizConfig?.settings || {};
  const maxGrade = Number(settings.max_grade) || 10.0;
  const grade = Number(attemptResult?.grade) || 0;
  const isPassed = Boolean(attemptResult?.isPassed);

  // Garantizar que todos los registros de intentos incluyan el userId del propietario
  const taggedHistory = (attemptsHistory || []).map((att) => ({
    ...att,
    userId: att.userId || userId
  }));

  // Escalar calificación a 0-100 para cmi.core.score.raw
  const rawScore = maxGrade > 0 ? Math.round((grade / maxGrade) * 100) : Math.round(grade);

  if (isScormApiAvailable()) {
    try {
      const scorm = window.ScormWrapper;

      // Asignar puntaje y estado
      if (typeof scorm.setScoreAndStatus === 'function') {
        scorm.setScoreAndStatus(rawScore, isPassed ? 'passed' : 'failed');
      } else if (typeof scorm.setValue === 'function') {
        scorm.setValue('cmi.core.score.raw', String(rawScore));
        scorm.setValue('cmi.core.lesson_status', isPassed ? 'passed' : 'failed');
        if (typeof scorm.commit === 'function') scorm.commit();
      }

      // Persistir historial de intentos y limpiar borrador en cmi.suspend_data
      let existingData = {};
      const prevSuspend = scorm.getValue('cmi.suspend_data');
      if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
        try { existingData = JSON.parse(prevSuspend); } catch (e) {}
      }

      const activeDrafts = existingData.activeQuizDrafts || {};
      delete activeDrafts[assessmentId];

      const updatedData = {
        ...existingData,
        activeQuizDrafts: activeDrafts,
        quizAttempts: {
          ...(existingData.quizAttempts || {}),
          [assessmentId]: taggedHistory
        }
      };

      scorm.setValue('cmi.suspend_data', JSON.stringify(updatedData));
      // FORZAR ESCRITURA INMEDIATA EN LA BASE DE DATOS DEL LMS (LMSCommit)
      if (typeof scorm.commit === 'function') {
        scorm.commit();
      }
    } catch (err) {
      console.warn('[SCORM Adapter] Error guardando intento en SCORM:', err.message);
    }
  }

  // Guardado de respaldo en localStorage con clave scoped por usuario
  try {
    const userLocalKey = `mooc_quiz_history_${assessmentId}_${userId}`;
    const legacyLocalKey = `mooc_quiz_history_${assessmentId}`;
    localStorage.setItem(userLocalKey, JSON.stringify(taggedHistory));
    localStorage.setItem(legacyLocalKey, JSON.stringify(taggedHistory));
  } catch (e) {}

  clearActiveQuizDraftInSCORM(assessmentId);

  return {
    rawScore,
    status: isPassed ? 'passed' : 'failed'
  };
}

/**
 * Recupera el historial de intentos guardado en SCORM suspend_data o localStorage.
 * Cuando la API de SCORM está activa, los datos de SCORM son la ÚNICA fuente primaria autoritativa
 * evitando que la memoria local de un dispositivo sobreescriba los datos del servidor.
 */
export function loadQuizAttemptsFromSCORM(assessmentId) {
  const userId = getCurrentUserId();
  const scormAvailable = isScormApiAvailable();
  let attempts = [];
  let foundInScorm = false;

  // 1. Cargar desde SCORM suspend_data (Servidor LMS Moodle)
  if (scormAvailable) {
    try {
      const scorm = window.ScormWrapper;
      const prevSuspend = scorm.getValue('cmi.suspend_data');
      if (prevSuspend && typeof prevSuspend === 'string' && prevSuspend.trim().startsWith('{')) {
        const parsed = JSON.parse(prevSuspend);
        if (parsed?.quizAttempts?.[assessmentId] && Array.isArray(parsed.quizAttempts[assessmentId])) {
          attempts = parsed.quizAttempts[assessmentId];
          foundInScorm = true;
        }
      }
    } catch (e) {}
  }

  if (foundInScorm) {
    return attempts;
  }

  // 2. Solo recurrir a localStorage si SCORM NO está disponible (Modo standalone sin LMS)
  if (!scormAvailable && attempts.length === 0) {
    try {
      const userLocalKey = `mooc_quiz_history_${assessmentId}_${userId}`;
      const legacyLocalKey = `mooc_quiz_history_${assessmentId}`;
      const savedUserStr = localStorage.getItem(userLocalKey);
      const savedLegacyStr = localStorage.getItem(legacyLocalKey);

      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (Array.isArray(parsed)) attempts = parsed;
      } else if (savedLegacyStr) {
        const parsed = JSON.parse(savedLegacyStr);
        if (Array.isArray(parsed)) attempts = parsed;
      }
    } catch (e) {}
  }

  // Filtrado estricto de pertenencia en modo local standalone
  return (attempts || []).filter((att) => !att.userId || att.userId === userId);
}


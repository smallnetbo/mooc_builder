/**
 * scorm-wrapper.js — API Wrapper SCORM 1.2
 * Se inyecta automáticamente en cada SCO exportado (<script src=".../scorm-wrapper.js">).
 * Responsabilidades: localizar la API del LMS en la ventana padre, inicializar sesión,
 * guardar ubicación/puntaje/estado, y cerrar sesión de forma segura (LMSFinish/LMSCommit).
 */
(function (window) {
  'use strict';

  const ScormWrapper = {
    API: null,
    initialized: false,
    autoSaveTimer: null,

    /**
     * Busca la API SCORM 1.2 subiendo por la cadena window.parent / window.opener,
     * hasta un máximo de 500 saltos (evita loops infinitos entre frames de Moodle).
     */
    _findAPI(win) {
      let attempts = 0;
      let target = win;
      while (target.API == null && target.parent != null && target.parent !== target && attempts < 500) {
        attempts++;
        target = target.parent;
      }
      if (target.API != null) return target.API;

      // Buscar en win.top
      try {
        if (win.top && win.top.API != null) return win.top.API;
      } catch (e) {}

      // Buscar en win.opener si es una ventana emergente
      try {
        if (win.opener) {
          if (win.opener.API != null) return win.opener.API;
          target = win.opener;
          attempts = 0;
          while (target.API == null && target.parent != null && target.parent !== target && attempts < 500) {
            attempts++;
            target = target.parent;
          }
          if (target.API != null) return target.API;
          if (win.opener.top && win.opener.top.API != null) return win.opener.top.API;
        }
      } catch (e) {}

      return null;
    },

    /** Debe llamarse en el onload del documento del SCO. */
    init() {
      this.API = this._findAPI(window);
      if (!this.API) {
        console.warn('[SCORM] API del LMS no encontrada. ¿Se está ejecutando fuera de Moodle?');
        return false;
      }
      const result = this.API.LMSInitialize('');
      this.initialized = result === 'true' || result === true;
      if (!this.initialized) {
        console.error('[SCORM] LMSInitialize falló:', this.API.LMSGetLastError?.());
        return false;
      }
      // Autoguardado periódico (cada 30s) para no perder progreso ante cierres abruptos.
      this.autoSaveTimer = setInterval(() => this.commit(), 30000);
      window.addEventListener('beforeunload', () => this.terminate());
      return true;
    },

    /** Obtención ultra-segura de propiedades SCORM (soporta Modo Revisión) */
    getValue(element) {
      if (!this.API) return null;
      try {
        const val = this.API.LMSGetValue(element);
        return val != null ? String(val) : null;
      } catch (e) {
        console.warn('[SCORM] LMSGetValue error en ' + element + ':', e);
        return null;
      }
    },

    /** Asignación ultra-segura de propiedades SCORM */
    setValue(element, value) {
      if (!this.API) return false;
      try {
        return this.API.LMSSetValue(element, String(value));
      } catch (e) {
        console.warn('[SCORM] LMSSetValue error en ' + element + ':', e);
        return false;
      }
    },

    /** Guarda el último punto visitado: cmi.core.lesson_location */
    setLocation(locationId) {
      this.setValue('cmi.core.lesson_location', locationId);
      this.commit();
    },

    /** Marca la lección como completada/aprobada sin puntaje (contenido informativo). */
    setStatus(status) {
      this.setValue('cmi.core.lesson_status', status);
      this.commit();
    },

    /** Envía el puntaje numérico de una evaluación y el estado resultante. */
    setScoreAndStatus(scoreRaw, status) {
      this.setValue('cmi.core.score.raw', scoreRaw);
      this.setValue('cmi.core.score.min', '0');
      this.setValue('cmi.core.score.max', '100');
      this.setValue('cmi.core.lesson_status', status);
      this.commit();
    },

    /** Fuerza la persistencia inmediata de los datos en el LMS. */
    commit() {
      if (!this.API) return;
      try {
        this.API.LMSCommit('');
      } catch (e) {}
    },

    /** Cierra la sesión de forma segura. Debe llamarse en onunload/beforeunload. */
    terminate() {
      if (!this.API) return;
      clearInterval(this.autoSaveTimer);
      this.commit();
      try {
        this.API.LMSFinish('');
      } catch (e) {}
      this.initialized = false;
    },

    _ready() {
      return !!this.API;
    },
  };

  window.ScormWrapper = ScormWrapper;
})(window);

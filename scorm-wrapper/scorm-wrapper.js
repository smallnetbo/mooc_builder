/**
 * scorm-wrapper.js — API Wrapper SCORM 1.2 & SCORM 2004 desacoplado
 * Se inyecta automáticamente en cada SCO exportado (<script src="shared/scorm-wrapper.js">).
 * Responsabilidades:
 * - Localizar la API del LMS (SCORM 1.2: API / SCORM 2004: API_1484_11) subiendo por window.parent, top, opener.
 * - Inicializar sesión (LMSInitialize / Initialize) de forma síncrona e inmediata.
 * - Mapeo transparente de elementos SCORM 1.2 y 2004 (lesson_status, score.raw, suspend_data, student_id).
 * - Persistencia forzada inmediata (LMSCommit / Commit) tras cada LMSSetValue sin depender del cierre de ventana.
 * - Guardado continuo de progreso e intentos incompletos en cmi.suspend_data.
 * - Cierre limpio y seguro (LMSFinish / Terminate) en beforeunload, unload y pagehide.
 */
(function (window) {
  'use strict';

  const ScormWrapper = {
    API: null,
    version: null, // '1.2' | '2004'
    initialized: false,
    autoSaveTimer: null,

    /**
     * Busca la API SCORM 1.2 o 2004 subiendo por la cadena window.parent / window.opener / window.top,
     * hasta un máximo de 500 saltos (evita loops infinitos entre frames de Moodle).
     */
    _findAPI(win) {
      let attempts = 0;
      let target = win;

      while (target && attempts < 500) {
        try {
          if (target.API != null) {
            this.version = '1.2';
            return target.API;
          }
          if (target.API_1484_11 != null) {
            this.version = '2004';
            return target.API_1484_11;
          }
        } catch (e) {}

        if (target.parent == null || target.parent === target) break;
        target = target.parent;
        attempts++;
      }

      // Buscar en win.top
      try {
        if (win.top) {
          if (win.top.API != null) {
            this.version = '1.2';
            return win.top.API;
          }
          if (win.top.API_1484_11 != null) {
            this.version = '2004';
            return win.top.API_1484_11;
          }
        }
      } catch (e) {}

      // Buscar en win.opener si es una ventana emergente
      try {
        if (win.opener) {
          if (win.opener.API != null) {
            this.version = '1.2';
            return win.opener.API;
          }
          if (win.opener.API_1484_11 != null) {
            this.version = '2004';
            return win.opener.API_1484_11;
          }
          target = win.opener;
          attempts = 0;
          while (target && attempts < 500) {
            try {
              if (target.API != null) {
                this.version = '1.2';
                return target.API;
              }
              if (target.API_1484_11 != null) {
                this.version = '2004';
                return target.API_1484_11;
              }
            } catch (e) {}
            if (target.parent == null || target.parent === target) break;
            target = target.parent;
            attempts++;
          }
          if (win.opener.top) {
            if (win.opener.top.API != null) {
              this.version = '1.2';
              return win.opener.top.API;
            }
            if (win.opener.top.API_1484_11 != null) {
              this.version = '2004';
              return win.opener.top.API_1484_11;
            }
          }
        }
      } catch (e) {}

      return null;
    },

    /**
     * Mapea transparentemente los nombres de elementos entre SCORM 1.2 y SCORM 2004.
     */
    _mapElement(element) {
      if (this.version !== '2004') return element;

      const mapping = {
        'cmi.core.lesson_location': 'cmi.location',
        'cmi.core.lesson_status': 'cmi.completion_status',
        'cmi.core.score.raw': 'cmi.score.raw',
        'cmi.core.score.min': 'cmi.score.min',
        'cmi.core.score.max': 'cmi.score.max',
        'cmi.core.student_id': 'cmi.learner_id',
        'cmi.core.student_name': 'cmi.learner_name',
        'cmi.suspend_data': 'cmi.suspend_data'
      };

      return mapping[element] || element;
    },

    /**
     * Retorna true si la API del LMS está disponible e inicializada.
     */
    isAvailable() {
      return Boolean(this.initialized && this.API);
    },

    /**
     * Inicializa la sesión de comunicación con la API del LMS (LMSInitialize / Initialize).
     */
    init() {
      if (this.initialized) return true;

      this.API = this._findAPI(window);
      if (!this.API) {
        console.warn('[SCORM] API del LMS no encontrada. Modo standalone activo (sin LMS).');
        return false;
      }

      let result = false;
      try {
        if (this.version === '2004') {
          result = this.API.Initialize('');
        } else {
          result = this.API.LMSInitialize('');
        }
      } catch (e) {
        console.error('[SCORM] Excepción al invocar inicialización LMS:', e);
      }

      this.initialized = result === 'true' || result === true;
      if (!this.initialized) {
        const errCode = this.version === '2004' ? this.API.GetLastError?.() : this.API.LMSGetLastError?.();
        console.error('[SCORM] LMSInitialize falló con código:', errCode);
        return false;
      }

      console.log(`[SCORM] Sesión inicializada exitosamente (SCORM ${this.version}).`);

      // Configurar autoguardado periódico cada 30 segundos
      if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = setInterval(() => this.commit(), 30000);

      // Registrar eventos para un cierre limpio y persistido al abandonar la lección
      const terminateHandler = () => this.terminate();
      window.addEventListener('beforeunload', terminateHandler);
      window.addEventListener('unload', terminateHandler);
      window.addEventListener('pagehide', terminateHandler);

      return true;
    },

    /**
     * Obtiene el valor de una variable SCORM desde el LMS.
     */
    getValue(element) {
      if (!this.isAvailable()) return null;

      const mappedElem = this._mapElement(element);
      try {
        const val = this.version === '2004'
          ? this.API.GetValue(mappedElem)
          : this.API.LMSGetValue(mappedElem);
        return val != null ? String(val) : null;
      } catch (e) {
        console.warn(`[SCORM] LMSGetValue error en ${mappedElem}:`, e);
        return null;
      }
    },

    /**
     * Asigna un valor a un elemento SCORM y ejecuta PERSISTENCIA FORZADA INMEDIATA (LMSCommit)
     * para asegurar la escritura instantánea en la base de datos del servidor LMS.
     */
    setValue(element, value) {
      if (!this.isAvailable()) return false;

      const mappedElem = this._mapElement(element);
      let res = false;
      try {
        const strVal = String(value);
        if (this.version === '2004') {
          res = this.API.SetValue(mappedElem, strVal);
        } else {
          res = this.API.LMSSetValue(mappedElem, strVal);
        }

        // CRÍTICO: Persistencia Forzada Inmediata (LMSCommit / Commit)
        this.commit();
      } catch (e) {
        console.warn(`[SCORM] LMSSetValue error en ${mappedElem}:`, e);
      }
      return res === 'true' || res === true;
    },

    /**
     * Guarda la lección o ubicación actual: cmi.core.lesson_location / cmi.location
     */
    setLocation(locationId) {
      this.setValue('cmi.core.lesson_location', locationId);
    },

    /**
     * Marca el estado de la lección (passed, completed, failed).
     */
    setStatus(status) {
      this.setValue('cmi.core.lesson_status', status);
      if (this.version === '2004') {
        try {
          if (status === 'passed' || status === 'completed') {
            this.API.SetValue('cmi.completion_status', 'completed');
            this.API.SetValue('cmi.success_status', status === 'passed' ? 'passed' : 'neutral');
          } else if (status === 'failed') {
            this.API.SetValue('cmi.completion_status', 'completed');
            this.API.SetValue('cmi.success_status', 'failed');
          }
          this.commit();
        } catch (e) {}
      }
    },

    /**
     * Asigna puntaje numérico (0-100) y estado de evaluación con COMMIT FORZADO INMEDIATO.
     */
    setScoreAndStatus(scoreRaw, status) {
      const numScore = String(scoreRaw);
      const isPassed = status === 'passed';

      this.setValue('cmi.core.score.raw', numScore);
      this.setValue('cmi.core.score.min', '0');
      this.setValue('cmi.core.score.max', '100');
      this.setValue('cmi.core.lesson_status', isPassed ? 'passed' : 'failed');

      if (this.version === '2004') {
        try {
          this.API.SetValue('cmi.score.raw', numScore);
          this.API.SetValue('cmi.score.scaled', String(Math.round((Number(numScore) / 100) * 100) / 100));
          this.API.SetValue('cmi.completion_status', 'completed');
          this.API.SetValue('cmi.success_status', isPassed ? 'passed' : 'failed');
        } catch (e) {}
      }

      this.commit();
    },

    /**
     * Fuerza la escritura inmediata de los datos en la base de datos del servidor LMS (LMSCommit / Commit).
     */
    commit() {
      if (!this.isAvailable()) return false;
      try {
        const res = this.version === '2004' ? this.API.Commit('') : this.API.LMSCommit('');
        return res === 'true' || res === true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Cierra la sesión de forma limpia invocando LMSFinish / Terminate.
     */
    terminate() {
      if (!this.isAvailable()) return;
      if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);

      this.commit();
      try {
        if (this.version === '2004') {
          this.API.Terminate('');
        } else {
          this.API.LMSFinish('');
        }
      } catch (e) {}
      this.initialized = false;
    }
  };

  if (typeof window !== 'undefined') {
    window.ScormWrapper = ScormWrapper;

    // Inicialización síncrona e inmediata al ejecutar el script para prevenir condiciones de carrera
    try {
      ScormWrapper.init();
    } catch (e) {}

    if (!ScormWrapper.initialized) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        try { ScormWrapper.init(); } catch (e) {}
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          try { ScormWrapper.init(); } catch (e) {}
        });
      }
    }
  }
})(window);

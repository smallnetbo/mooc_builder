import React, { useState, useEffect } from 'react';
import TreeEditor from './components/TreeEditor';
import Canvas from './components/Canvas';
import ModuleCoverView from './components/ModuleCoverView';
import ModulePlayerView from './components/ModulePlayerView';
import { useCourseStore } from './store/courseStore';
import {
  Edit3,
  Eye,
  Download,
  Image,
  Layers,
  Sparkles,
  ChevronDown,
  Package,
  FolderOpen,
  Plus,
  Save,
  Upload,
  Trash2,
  CheckCircle2,
  FileCode,
  HardDrive,
  RotateCcw,
  RotateCw,
  Loader2,
  Check
} from 'lucide-react';

import { DEFAULT_COVER_CONFIG, getFullCoverConfig, getOverlayStyle, CURVE_PATHS } from './utils/coverConfig';

export default function App() {
  const {
    course,
    history,
    future,
    saveStatus,
    undo,
    redo,
    setCourseTitle,
    viewMode,
    playerScreen,
    setViewMode,
    selectedModuleId,
    updateModuleMeta,
    exportCourse,
    createNewCourse,
    loadCourseData,
    saveCourseToServer,
    downloadCourseJson,
    fetchServerCourses,
    loadCourseFromServer,
    deleteCourseFromServer
  } = useCourseStore();

  const [showModuleMetaModal, setShowModuleMetaModal] = useState(false);
  const [coverTab, setCoverTab] = useState('panel1');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCourseManagerModal, setShowCourseManagerModal] = useState(false);
  const [serverCourses, setServerCourses] = useState([]);
  const [saveStatusMessage, setSaveStatusMessage] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');

  // Teclas rápidas (Ctrl+Z para Deshacer, Ctrl+Y / Ctrl+Shift+Z para Rehacer, Ctrl+S para Guardar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCourseToServer().catch((err) => alert('Error al guardar: ' + err.message));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveCourseToServer]);

  // Autoguardado diferido automático al servidor tras 2.5s de inactividad de cambios
  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(() => {
        saveCourseToServer().catch((err) => console.warn('Auto-save error:', err));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, course, saveCourseToServer]);

  const activeModule = course.modules.find((m) => m.id === selectedModuleId) || course.modules[0];

  const refreshServerCourses = async () => {
    try {
      const list = await fetchServerCourses();
      setServerCourses(list);
    } catch (e) {
      console.warn('No se pudieron obtener cursos del servidor:', e);
    }
  };

  const handleOpenCourseManager = () => {
    refreshServerCourses();
    setShowCourseManagerModal(true);
  };

  const handleCreateNew = () => {
    const title = newCourseTitle.trim() || 'Nuevo Curso SCORM';
    createNewCourse(title);
    setNewCourseTitle('');
    setSaveStatusMessage('Nuevo curso creado correctamente.');
    setTimeout(() => setSaveStatusMessage(''), 3000);
  };

  const handleSaveToServer = async () => {
    try {
      await saveCourseToServer();
      await refreshServerCourses();
      setSaveStatusMessage('✓ Curso guardado con éxito en el servidor.');
      setTimeout(() => setSaveStatusMessage(''), 3000);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        loadCourseData(parsed);
        setSaveStatusMessage('✓ Curso cargado desde archivo JSON.');
        setTimeout(() => setSaveStatusMessage(''), 3000);
      } catch (err) {
        alert('Archivo JSON inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadFromServer = async (id) => {
    try {
      await loadCourseFromServer(id);
      setSaveStatusMessage('✓ Curso cargado correctamente del servidor.');
      setTimeout(() => setSaveStatusMessage(''), 3000);
    } catch (err) {
      alert('Error al cargar: ' + err.message);
    }
  };

  const handleDeleteFromServer = async (id, title) => {
    if (!confirm(`¿Eliminar el curso "${title}" del servidor?`)) return;
    try {
      await deleteCourseFromServer(id);
      await refreshServerCourses();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-100 overflow-hidden">
      {/* BARRA SUPERIOR DE LA APLICACIÓN */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-white shrink-0 z-40 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#f58220] text-white flex items-center justify-center font-bold text-sm shadow-md">
            M
          </div>
          <input
            className="font-semibold text-base sm:text-lg bg-transparent text-white focus:outline-none focus:border-b focus:border-[#f58220] px-1 py-0.5"
            value={course.title || ''}
            onChange={(e) => setCourseTitle(e.target.value)}
          />
        </div>

        {/* CONMUTADOR DE MODO Y BOTONES DE ACCIÓN */}
        <div className="flex items-center space-x-2">
          {/* BOTONES DESHACER Y REHACER (UNDO / REDO) */}
          <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 space-x-0.5">
            <button
              onClick={undo}
              disabled={!history || history.length === 0}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                history && history.length > 0
                  ? 'text-slate-200 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Deshacer último cambio (Ctrl+Z)"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={redo}
              disabled={!future || future.length === 0}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                future && future.length > 0
                  ? 'text-slate-200 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Rehacer cambio (Ctrl+Y)"
            >
              <RotateCw size={14} />
            </button>
          </div>

          {/* BOTÓN GUARDAR Y ESTADO DE AUTOGUARDADO */}
          <button
            onClick={handleSaveToServer}
            disabled={saveStatus === 'saving'}
            className={`text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 font-bold transition-all cursor-pointer border shadow-xs ${
              saveStatus === 'saved'
                ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                : saveStatus === 'saving'
                ? 'bg-slate-800 text-amber-400 border-slate-700 cursor-wait'
                : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 shadow-sm animate-pulse'
            }`}
            title="Guardar cambios en el servidor (Ctrl+S)"
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={14} className="animate-spin text-amber-400" />
            ) : saveStatus === 'saved' ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Save size={14} />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Guardando...'
                : saveStatus === 'saved'
                ? '✓ Guardado'
                : 'Guardar'}
            </span>
          </button>

          {/* BOTÓN GESTIÓN DE CURSOS (CREAR, GUARDAR, CARGAR) */}
          <button
            onClick={handleOpenCourseManager}
            className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 cursor-pointer font-semibold transition-colors"
            title="Crear, guardar o cargar cursos"
          >
            <FolderOpen size={14} className="text-[#f58220]" />
            <span>Gestión de Cursos</span>
          </button>

          <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 size={14} />
              <span>Modo Editor</span>
            </button>

            <button
              onClick={() => setViewMode('player')}
              className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'player'
                  ? 'bg-[#f58220] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={14} />
              <span>Vista Previa Estudiante</span>
            </button>
          </div>

          {viewMode === 'editor' && activeModule && (
            <button
              onClick={() => setShowModuleMetaModal(true)}
              className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 cursor-pointer"
              title="Configurar carátula del módulo"
            >
              <Image size={13} />
              <span className="hidden sm:inline">Carátula Módulo</span>
            </button>
          )}

          {/* MENÚ DESPLEGABLE DE EXPORTACIÓN SCORM */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-xs px-3.5 py-1.5 rounded-md font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Exportar SCORM</span>
              <ChevronDown size={12} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 py-1 divide-y divide-slate-800 text-xs">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportCourse(null).catch((err) => alert(err.message));
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-white hover:bg-slate-800 flex items-center space-x-2.5 cursor-pointer font-semibold transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Layers size={15} />
                  </div>
                  <div>
                    <div className="font-bold">Exportar Curso Completo</div>
                    <div className="text-[10px] text-slate-400 font-normal">Todos los módulos en un solo paquete SCORM</div>
                  </div>
                </button>

                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Exportar Módulo Individual
                  </div>
                  {course.modules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setShowExportMenu(false);
                        exportCourse(mod.id).catch((err) => alert(err.message));
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center space-x-2.5 cursor-pointer transition-colors"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: mod.primaryColor || '#f58220' }}
                      />
                      <span className="truncate font-medium">
                        {mod.number ? `${mod.number}: ` : ''}{mod.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* RENDERIZADO PRINCIPAL SEGÚN EL MODO SELECCIONADO */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        {viewMode === 'editor' ? (
          <div className="flex flex-1 min-h-0">
            <TreeEditor />
            <Canvas />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
            <ModulePlayerView />
          </div>
        )}
      </div>

      {/* MODAL GESTIÓN DE CURSOS (CREAR, GUARDAR, CARGAR) */}
      {showCourseManagerModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <FolderOpen className="text-[#f58220]" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Gestión de Cursos (Crear, Guardar y Cargar)</h3>
              </div>
              <button
                onClick={() => setShowCourseManagerModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {saveStatusMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-md font-semibold flex items-center space-x-2 shrink-0">
                <CheckCircle2 size={16} />
                <span>{saveStatusMessage}</span>
              </div>
            )}

            <div className="overflow-y-auto space-y-6 flex-1 pr-1 text-xs">
              {/* SECCIÓN 1: CREAR Y GUARDAR CURSO ACTUAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bloque Crear Curso */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <Plus size={16} className="text-indigo-600" />
                    <span>Crear Nuevo Curso</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Título del nuevo curso..."
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleCreateNew}
                    className="w-full font-semibold px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Crear Curso Blanco</span>
                  </button>
                </div>

                {/* Bloque Guardar y Exportar JSON */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <Save size={16} className="text-emerald-600" />
                    <span>Guardar / Exportar JSON</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-tight">
                    Guarda los cambios en el servidor o descarga una copia local `.json` de respaldo.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveToServer}
                      className="flex-1 font-semibold px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <HardDrive size={13} />
                      <span>Guardar en Servidor</span>
                    </button>
                    <button
                      onClick={downloadCourseJson}
                      className="flex-1 font-semibold px-2.5 py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <FileCode size={13} />
                      <span>Descargar JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CARGAR CURSO (DESDE COMPUTADORA O SERVIDOR) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <Upload size={14} className="text-[#f58220]" />
                    <span>Cargar Curso desde Archivo Local (.json)</span>
                  </h4>
                </div>
                <label className="block w-full border-2 border-dashed border-slate-300 hover:border-[#f58220] rounded-lg p-3 text-center bg-slate-50 hover:bg-orange-50/50 cursor-pointer transition-colors">
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  <span className="font-semibold text-slate-700">Seleccionar archivo .json desde tu equipo</span>
                  <span className="block text-[10px] text-slate-400">Haz clic aquí para examinar</span>
                </label>
              </div>

              {/* SECCIÓN 3: CURSOS GUARDADOS EN EL SERVIDOR */}
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <HardDrive size={14} className="text-indigo-600" />
                  <span>Cursos Guardados en el Servidor</span>
                </h4>

                {serverCourses.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    No hay otros cursos guardados en el servidor por el momento.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
                    {serverCourses.map((c) => (
                      <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{c.title}</div>
                          <div className="text-[10px] text-slate-500">
                            {c.moduleCount} Módulo(s) • Actualizado: {new Date(c.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLoadFromServer(c.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold cursor-pointer"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => handleDeleteFromServer(c.id, c.title)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Eliminar curso"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end shrink-0">
              <button
                onClick={() => setShowCourseManagerModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs uppercase cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN DE CARÁTULA Y CITA HERO DEL MÓDULO */}
      {showModuleMetaModal && activeModule && (() => {
        const cfg = getFullCoverConfig(activeModule.coverConfig);
        const updateCoverConfig = (patch) => {
          updateModuleMeta(activeModule.id, {
            coverConfig: { ...cfg, ...patch }
          });
        };
        const overlayStyle = getOverlayStyle(cfg, activeModule.primaryColor || '#f58220');
        const curvePath = CURVE_PATHS[cfg.curveStyle] || CURVE_PATHS.smooth;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
                <span>Editar Carátula del Módulo ({activeModule.number || 'Módulo'})</span>
                <span className="text-xs font-mono text-slate-400 font-normal">ID: {activeModule.id}</span>
              </h3>

              {/* DATOS BÁSICOS DEL MÓDULO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Título del Módulo</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#f58220]"
                    value={activeModule.title}
                    onChange={(e) => updateModuleMeta(activeModule.id, { title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Color Tema del Módulo</label>
                  <div className="flex items-center space-x-2 pt-1">
                    {['#e11d48', '#f58220', '#2563eb', '#16a34a', '#7c3aed', '#0d9488', '#db2777'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateModuleMeta(activeModule.id, { primaryColor: c })}
                        className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                          (activeModule.primaryColor || '#f58220') === c ? 'scale-125 border-slate-900 shadow-md ring-2 ring-slate-300' : 'border-white hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                        title={`Seleccionar color ${c}`}
                      />
                    ))}
                    <input
                      type="color"
                      className="w-6 h-6 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
                      value={activeModule.primaryColor || '#f58220'}
                      onChange={(e) => updateModuleMeta(activeModule.id, { primaryColor: e.target.value })}
                      title="Color personalizado"
                    />
                  </div>
                </div>
              </div>

              {/* VISTA PREVIA EN TIEMPO REAL */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-xs block">Vista Previa de Carátula (Hero Banner)</label>
                <div
                  className="relative rounded-lg overflow-hidden border border-slate-300 h-36 flex items-center justify-center text-white transition-all shadow-inner"
                  style={{ backgroundColor: cfg.bgColor || '#0f172a' }}
                >
                  {/* Capa de Imagen Base */}
                  {activeModule.coverImage && (
                    <div
                      className="absolute inset-0 transition-all duration-200"
                      style={{
                        backgroundImage: `url('${activeModule.coverImage}')`,
                        backgroundPosition: `${cfg.bgPositionX}% ${cfg.bgPositionY}%`,
                        backgroundSize: cfg.bgSize || 'cover',
                        backgroundRepeat: cfg.bgRepeat || 'no-repeat',
                        opacity: 0.85,
                      }}
                    />
                  )}

                  {/* Capa de Superposición (Overlay) */}
                  {cfg.overlayEnabled && (
                    <div className="absolute inset-0 pointer-events-none transition-all duration-200" style={overlayStyle} />
                  )}

                  {/* Patrón Geométrico (Rombos / Puntos / Cuadrícula) */}
                  {cfg.patternStyle && cfg.patternStyle !== 'none' && (
                    <div
                      className="absolute top-0 left-0 w-32 h-32 pointer-events-none z-10"
                      style={{ opacity: (cfg.patternOpacity ?? 20) / 100 }}
                    >
                      <svg className="w-full h-full text-white" viewBox="0 0 100 100">
                        <defs>
                          {cfg.patternStyle === 'diamonds' && (
                            <pattern id="prev-diamonds" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
                            </pattern>
                          )}
                          {cfg.patternStyle === 'dots' && (
                            <pattern id="prev-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                              <circle cx="5" cy="5" r="2" fill="currentColor" fillOpacity="0.8" />
                            </pattern>
                          )}
                          {cfg.patternStyle === 'grid' && (
                            <pattern id="prev-grid" width="15" height="15" patternUnits="userSpaceOnUse">
                              <path d="M 15 0 L 0 0 0 15" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
                            </pattern>
                          )}
                        </defs>
                        <rect width="100" height="100" fill={`url(#prev-${cfg.patternStyle})`} />
                      </svg>
                    </div>
                  )}

                  {/* Texto Título */}
                  <div className="relative z-20 text-center px-4">
                    <span className="text-xs font-bold uppercase tracking-wider drop-shadow-md">
                      {activeModule.number ? `${activeModule.number}: ` : ''}{activeModule.title || 'Módulo'}
                    </span>
                  </div>

                  {/* Curva Inferior */}
                  <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
                    <svg className="relative block w-full h-8 text-white" viewBox="0 0 1440 120" preserveAspectRatio="none">
                      <path d={curvePath} fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* NAVEGACIÓN POR PESTAÑAS DE CONFIGURACIÓN */}
              <div className="border-b border-slate-200 flex space-x-1 pt-2">
                {[
                  { id: 'panel1', label: '🖼️ Capa Imagen Base' },
                  { id: 'panel2', label: '🎨 Superposición (Degradado)' },
                  { id: 'panel3', label: '🔷 Patrón Geométrico' },
                  { id: 'panel4', label: '🌊 Curva SVG' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCoverTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 cursor-pointer transition-colors ${
                      coverTab === tab.id
                        ? 'border-[#f58220] text-[#f58220] bg-orange-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* CONTENIDO DE PESTAÑAS DE CONFIGURACIÓN */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-3">
                {/* PANEL 1: CONFIGURACIÓN DE LA CAPA DE IMAGEN BASE */}
                {coverTab === 'panel1' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Choose color & file (Fondo e Imagen)</label>
                      <div className="flex items-center space-x-3 pt-1">
                        <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded px-2 py-1">
                          <input
                            type="color"
                            className="w-5 h-5 p-0 border-0 cursor-pointer shrink-0"
                            value={cfg.bgColor || '#0f172a'}
                            onChange={(e) => updateCoverConfig({ bgColor: e.target.value })}
                            title="Color de fondo base"
                          />
                          <span className="font-mono text-[11px] uppercase text-slate-600">{cfg.bgColor || '#0f172a'}</span>
                        </div>

                        <label className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-3 py-1 rounded cursor-pointer border border-slate-300 transition-colors">
                          <svg className="w-3.5 h-3.5 text-[#f58220]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
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
                                  updateModuleMeta(activeModule.id, { coverImage: event.target.result });
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {activeModule.coverImage && (
                          <button
                            type="button"
                            onClick={() => updateModuleMeta(activeModule.id, { coverImage: '' })}
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
                          value={activeModule.coverImage || ''}
                          onChange={(e) => updateModuleMeta(activeModule.id, { coverImage: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Background Position X e Y */}
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Background Position</label>
                      <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded border border-slate-200">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-600 font-medium">X: {cfg.bgPositionX}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              className="w-full accent-[#f58220]"
                              value={cfg.bgPositionX ?? 50}
                              onChange={(e) => updateCoverConfig({ bgPositionX: Number(e.target.value) })}
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-14 border border-slate-300 rounded px-1 py-0.5 text-center font-mono"
                              value={cfg.bgPositionX ?? 50}
                              onChange={(e) => updateCoverConfig({ bgPositionX: Math.min(100, Math.max(0, Number(e.target.value))) })}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-600 font-medium">Y: {cfg.bgPositionY}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              className="w-full accent-[#f58220]"
                              value={cfg.bgPositionY ?? 50}
                              onChange={(e) => updateCoverConfig({ bgPositionY: Number(e.target.value) })}
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-14 border border-slate-300 rounded px-1 py-0.5 text-center font-mono"
                              value={cfg.bgPositionY ?? 50}
                              onChange={(e) => updateCoverConfig({ bgPositionY: Math.min(100, Math.max(0, Number(e.target.value))) })}
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
                          value={cfg.bgSize || 'cover'}
                          onChange={(e) => updateCoverConfig({ bgSize: e.target.value })}
                        >
                          <option value="cover">cover (Cubrir pantalla)</option>
                          <option value="contain">contain (Contener completa)</option>
                          <option value="auto">auto (Tamaño original)</option>
                          <option value="100% 100%">100% 100% (Estirar exacta)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Background Repeat</label>
                        <select
                          className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#f58220]"
                          value={cfg.bgRepeat || 'no-repeat'}
                          onChange={(e) => updateCoverConfig({ bgRepeat: e.target.value })}
                        >
                          <option value="no-repeat">no-repeat (Sin repetición)</option>
                          <option value="repeat">repeat (Repetir ambos ejes)</option>
                          <option value="repeat-x">repeat-x (Repetir horizontal)</option>
                          <option value="repeat-y">repeat-y (Repetir vertical)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 2: CONFIGURACIÓN DE LA CAPA DE SUPERPOSICIÓN (OVERLAY) */}
                {coverTab === 'panel2' && (
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 font-semibold text-slate-800 cursor-pointer bg-white p-2 rounded border border-slate-200">
                      <input
                        type="checkbox"
                        className="accent-[#f58220] w-4 h-4"
                        checked={cfg.overlayEnabled ?? true}
                        onChange={(e) => updateCoverConfig({ overlayEnabled: e.target.checked })}
                      />
                      <span>Activar Capa de Superposición de Degradado (cover-hero-overlay)</span>
                    </label>

                    {cfg.overlayEnabled && (
                      <div className="space-y-3 pt-1 bg-white p-3 rounded border border-slate-200">
                        {/* Parada de Color Superior */}
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700 block">Parada de Color Superior (Top Color)</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              className="w-8 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
                              value={cfg.overlayTopColor || '#000000'}
                              onChange={(e) => updateCoverConfig({ overlayTopColor: e.target.value })}
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex justify-between text-slate-600 font-medium">
                                <span>Opacity</span>
                                <span>{cfg.overlayTopOpacity ?? 50}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                className="w-full accent-[#f58220]"
                                value={cfg.overlayTopOpacity ?? 50}
                                onChange={(e) => updateCoverConfig({ overlayTopOpacity: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Parada de Color Inferior */}
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-700 block">Parada de Color Inferior (Bottom Color)</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              className="w-8 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
                              value={cfg.overlayBottomColor || activeModule.primaryColor || '#0f172a'}
                              onChange={(e) => updateCoverConfig({ overlayBottomColor: e.target.value })}
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex justify-between text-slate-600 font-medium">
                                <span>Opacity</span>
                                <span>{cfg.overlayBottomOpacity ?? 70}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                className="w-full accent-[#f58220]"
                                value={cfg.overlayBottomOpacity ?? 70}
                                onChange={(e) => updateCoverConfig({ overlayBottomOpacity: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PANEL 3: CONFIGURACIÓN DE PATRÓN GEOMÉTRICO */}
                {coverTab === 'panel3' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Estilo de Patrón Geométrico</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { id: 'diamonds', label: '🔷 Rombos' },
                          { id: 'dots', label: '⚪ Puntos' },
                          { id: 'grid', label: '🏁 Cuadrícula' },
                          { id: 'none', label: '🚫 Ninguno' }
                        ].map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => updateCoverConfig({ patternStyle: pat.id })}
                            className={`p-2 rounded font-semibold border text-center transition-all cursor-pointer ${
                              (cfg.patternStyle || 'diamonds') === pat.id
                                ? 'border-[#f58220] bg-orange-50 text-[#f58220] shadow-xs'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {cfg.patternStyle !== 'none' && (
                      <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                        <div className="flex justify-between text-slate-700 font-semibold">
                          <span>Opacidad del Patrón</span>
                          <span>{cfg.patternOpacity ?? 20}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full accent-[#f58220]"
                          value={cfg.patternOpacity ?? 20}
                          onChange={(e) => updateCoverConfig({ patternOpacity: Number(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* PANEL 4: CONFIGURACIÓN DE CURVA SVG INFERIOR */}
                {coverTab === 'panel4' && (
                  <div className="space-y-3">
                    <label className="font-semibold text-slate-700 block mb-1">Estilo de Curva de Borde (Onda Inferior)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {[
                        { id: 'smooth', label: '🌊 Onda Cóncava Suave' },
                        { id: 'wave', label: '〰️ Doble Onda Senoidal' },
                        { id: 'slant', label: '📐 Diagonal en Ángulo' },
                        { id: 'straight', label: '➖ Línea Recta' },
                        { id: 'arch', label: '⭕ Arco Convexo' }
                      ].map((crv) => (
                        <button
                          key={crv.id}
                          type="button"
                          onClick={() => updateCoverConfig({ curveStyle: crv.id })}
                          className={`p-2.5 rounded font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                            (cfg.curveStyle || 'smooth') === crv.id
                              ? 'border-[#f58220] bg-orange-50 text-[#f58220] shadow-xs'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{crv.label}</span>
                          {(cfg.curveStyle || 'smooth') === crv.id && <span className="font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* OBJETIVO DEL MÓDULO */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs">Objetivo del Módulo</label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#f58220]"
                  value={activeModule.objective || ''}
                  onChange={(e) => updateModuleMeta(activeModule.id, { objective: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModuleMetaModal(false)}
                  className="text-white font-bold text-xs px-5 py-2 rounded uppercase shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: activeModule.primaryColor || '#f58220' }}
                >
                  Guardar y cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

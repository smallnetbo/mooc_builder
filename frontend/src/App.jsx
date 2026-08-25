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
      {showModuleMetaModal && activeModule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">
              Editar Carátula del Módulo ({activeModule.number || 'Módulo'})
            </h3>

            <div className="space-y-3 text-xs">
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
                      className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                        (activeModule.primaryColor || '#f58220') === c ? 'scale-125 border-slate-900 shadow-md ring-2 ring-slate-300' : 'border-white hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Seleccionar color ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
                    value={activeModule.primaryColor || '#f58220'}
                    onChange={(e) => updateModuleMeta(activeModule.id, { primaryColor: e.target.value })}
                    title="Color personalizado"
                  />
                  <span className="font-mono text-slate-500 uppercase">{activeModule.primaryColor || '#f58220'}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">URL Imagen de Fondo (Hero Banner)</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#f58220]"
                  value={activeModule.coverImage || ''}
                  onChange={(e) => updateModuleMeta(activeModule.id, { coverImage: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Objetivo del Módulo</label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#f58220]"
                  value={activeModule.objective || ''}
                  onChange={(e) => updateModuleMeta(activeModule.id, { objective: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModuleMetaModal(false)}
                className="text-white font-bold text-xs px-5 py-2 rounded uppercase shadow-sm cursor-pointer"
                style={{ backgroundColor: activeModule.primaryColor || '#f58220' }}
              >
                Guardar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

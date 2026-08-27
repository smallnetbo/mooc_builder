import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { Download, Trash2, FileText } from 'lucide-react';

export default function ResourceBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || {};

  const handleChange = (field, value) => {
    updateBlock(lessonId, block.id, { ...content, [field]: value });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Download size={14} className="text-[#f58220]" />
          <span>Objeto Didáctico: Recurso / Archivo Descargable</span>
        </div>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar bloque"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Título del Recurso</label>
            <input
              type="text"
              className="w-full text-xs font-bold p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
              placeholder="Ej: Plantilla de Flujo de Caja en Excel"
              value={content.fileTitle || ''}
              onChange={(e) => handleChange('fileTitle', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Formato</label>
              <input
                type="text"
                className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
                placeholder="PDF, XLSX, ZIP"
                value={content.fileType || ''}
                onChange={(e) => handleChange('fileType', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Tamaño</label>
              <input
                type="text"
                className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
                placeholder="1.2 MB"
                value={content.fileSize || ''}
                onChange={(e) => handleChange('fileSize', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">URL del Archivo / Enlace de Descarga</label>
          <input
            type="text"
            className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
            placeholder="https://ejemplo.com/archivo.pdf"
            value={content.fileUrl || ''}
            onChange={(e) => handleChange('fileUrl', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">Descripción o Instrucciones</label>
          <textarea
            rows={2}
            className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
            placeholder="Explicación breve sobre qué contiene el recurso..."
            value={content.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

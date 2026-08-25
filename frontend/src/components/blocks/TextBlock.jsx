// TextBlock.jsx — bloque de texto interactivo con opción de eliminación.
import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { Trash2 } from 'lucide-react';

export default function TextBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();

  return (
    <div className="relative group border border-slate-200 rounded p-3 bg-white hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span>Bloque de Texto</span>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          title="Eliminar bloque de texto"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div
        className="min-h-[50px] focus:outline-none focus:ring-1 focus:ring-indigo-400 p-1 rounded text-xs sm:text-sm text-slate-800 leading-relaxed"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateBlock(lessonId, block.id, e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: block.content || 'Escriba el texto de la lección aquí...' }}
      />
    </div>
  );
}

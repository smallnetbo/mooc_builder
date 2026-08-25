// VideoBlock.jsx — video embebido (YouTube/Vimeo/URL directa).
import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { Trash2, Video } from 'lucide-react';

export default function VideoBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const videoUrl = typeof block.content === 'object' ? block.content?.url || '' : block.content || '';

  return (
    <div className="relative group border border-slate-200 rounded p-3 space-y-2 bg-white hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span className="flex items-center space-x-1">
          <Video size={12} className="text-indigo-600" />
          <span>Bloque de Video</span>
        </span>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          title="Eliminar bloque de video"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <input
        type="text"
        placeholder="URL del video (YouTube embed, Vimeo o MP4 directo)"
        defaultValue={videoUrl}
        onBlur={(e) => updateBlock(lessonId, block.id, { url: e.target.value })}
        className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
      />
      {videoUrl && (
        <div className="aspect-video bg-black rounded overflow-hidden shadow-xs">
          <iframe src={videoUrl} className="w-full h-full border-0" allowFullScreen title="video-embebido" />
        </div>
      )}
    </div>
  );
}

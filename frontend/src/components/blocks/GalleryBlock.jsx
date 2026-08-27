import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function GalleryBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || { images: [] };
  const images = content.images || [];

  const handleUpdateImages = (newImages) => {
    updateBlock(lessonId, block.id, { ...content, images: newImages });
  };

  const handleAddImage = () => {
    const newImg = {
      id: nanoid(6),
      url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200',
      caption: `Imagen ${images.length + 1}: Leyenda explicativa`
    };
    handleUpdateImages([...images, newImg]);
  };

  const handleRemoveImage = (id) => {
    handleUpdateImages(images.filter((img) => img.id !== id));
  };

  const handleImageChange = (id, field, value) => {
    handleUpdateImages(
      images.map((img) => (img.id === id ? { ...img, [field]: value } : img))
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <ImageIcon size={14} className="text-[#f58220]" />
          <span>Objeto Didáctico: Galería de Imágenes / Carrusel</span>
        </div>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar bloque"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Imagen #{idx + 1}</span>
              <button
                onClick={() => handleRemoveImage(img.id)}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Eliminar imagen"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <input
              type="text"
              className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
              placeholder="URL de la imagen"
              value={img.url || ''}
              onChange={(e) => handleImageChange(img.id, 'url', e.target.value)}
            />

            <input
              type="text"
              className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
              placeholder="Leyenda o pie de imagen"
              value={img.caption || ''}
              onChange={(e) => handleImageChange(img.id, 'caption', e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAddImage}
        className="text-xs font-semibold text-[#f58220] hover:text-orange-600 flex items-center space-x-1 pt-1 cursor-pointer"
      >
        <Plus size={13} />
        <span>Añadir imagen a la galería</span>
      </button>
    </div>
  );
}

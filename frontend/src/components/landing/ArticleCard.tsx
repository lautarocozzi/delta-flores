import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ArticleCardProps {
    imagen: string;
    categoria: string;
    fecha: string;
    titulo: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ imagen, categoria, fecha, titulo }) => (
    <div className="bg-card rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-green-500">
        <div className="h-40 overflow-hidden" role="img" aria-label={titulo}>
            <img src={imagen} alt={titulo} className="w-full h-full object-cover" />
        </div>
        <div className="p-6">
            <div className="flex items-center justify-between mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">{categoria}</span>
                <span className="text-gray-500 text-xs">{fecha}</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{titulo}</h3>
            <button className="text-green-600 font-semibold hover:text-green-700 flex items-center space-x-1">
                <span>Leer más</span>
                <ChevronRight size={16} />
            </button>
        </div>
    </div>
);

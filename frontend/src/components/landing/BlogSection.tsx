import React from 'react';
import { SectionTitle } from './SectionTitle';
import { ArticleCard } from './ArticleCard';

const articulos = [
    { titulo: "Guía Completa de Iluminación LED", categoria: "Equipamiento", fecha: "15 Sep 2025", imagen: "/FONDO_BLOG_1.png" },
    { titulo: "Cómo Optimizar el PH en Hidroponia", categoria: "Técnicas", fecha: "10 Sep 2025", imagen: "/FONDO_BLOG_2.png" },
    { titulo: "Las Mejores Genéticas para Interior", categoria: "Genéticas", fecha: "05 Sep 2025", imagen: "/FONDO_BLOG_3.png" }
];

export const BlogSection: React.FC = () => (
    <section id="blog" className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
            <SectionTitle
                title="Blog y Recursos Educativos"
                subtitle="Aprende las mejores técnicas y mantente actualizado"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {articulos.map((articulo, index) => (
                    <ArticleCard key={index} {...articulo} />
                ))}
            </div>
            <div className="text-center mt-12">
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 inline-flex items-center justify-center space-x-2">
                    Ver Todos los Artículos
                </button>
            </div>
        </div>
    </section>
);

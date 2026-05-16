import React from 'react';
import { Calendar, MapPin, Camera, TrendingUp, Droplets, Activity } from 'lucide-react';
import { SectionTitle } from './SectionTitle';
import { FunctionalityCard } from './FunctionalityCard';
import { LogIn, ChevronRight } from 'lucide-react';

const funcionalidades = [
    { title: "Bitácora Digital", description: "Registra cada evento de tus plantas: riegos, podas, cambios de etapa con fotos, videos y notas de audio", icon: Calendar, color: "from-green-400 to-emerald-500" },
    { title: "Trazabilidad por Planta", description: "Seguimiento completo desde semilla hasta cosecha. Timeline histórico de cada planta individual", icon: Activity, color: "from-blue-400 to-cyan-500" },
    { title: "Gestión de Espacios", description: "Administra tus 3 salas de cultivo, visualiza ubicaciones en mapa y controla cada ambiente", icon: MapPin, color: "from-purple-400 to-indigo-500" },
    { title: "Registro Multimedia", description: "Captura fotos, videos y notas de audio directamente desde tu móvil en la sala de cultivo", icon: Camera, color: "from-orange-400 to-amber-500" },
    { title: "Métricas y Análisis", description: "Datos de PH, EC, rendimiento y costos. Optimiza tu cultivo con inteligencia de datos", icon: TrendingUp, color: "from-pink-400 to-rose-500" },
    { title: "Control de Riegos", description: "Registra riegos, nutrientes aplicados y parámetros de agua para cada etapa del cultivo", icon: Droplets, color: "from-teal-400 to-cyan-500" }
];

export const FeaturesSection: React.FC = () => (
    <section id="funciones" className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
            <SectionTitle
                title="Funciones de Gestión del Cultivo"
                subtitle="Herramientas profesionales para llevar tu cultivo al siguiente nivel. Control total desde la siembra hasta la cosecha."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {funcionalidades.map((func, index) => (
                    <FunctionalityCard key={index} {...func} />
                ))}
            </div>
            <div className="text-center mt-12">
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 inline-flex items-center space-x-2">
                    <LogIn size={20} />
                    <span>Comenzar a Gestionar mi Cultivo</span>
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    </section>
);

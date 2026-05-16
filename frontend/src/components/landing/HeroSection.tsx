import React from 'react';
import { useNavigate } from "react-router-dom";
import { Book, LogIn, Activity, Users } from 'lucide-react';
import { FeaturePill } from './FeaturePill';

interface HeroSectionProps {
    scrollToSection: (section: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ scrollToSection }) => {
    const navigate = useNavigate();

    return (
        <section id="inicio" className="relative overflow-hidden py-12 px-4">
            <img src="/LOGO_LANDING_3.png" alt="Flores Delta Background" className="absolute inset-0 w-full h-full object-cover object-top z-0 opacity-30" />
            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="text-left space-y-6">

                    <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                        Cultiva con <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">amor</span> y <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">enfoque</span>
                    </h1>

                    <p className="text-lg text-muted-foreground">
                        Gestión inteligente de tu cultivo. Optimiza cada etapa, sigue día a día la evolución de tus plantas.<br />Cosecha lo que siembras, al máximo rendimiento.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-start mt-40">
                        <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2">
                            <LogIn size={20} />
                            <span>Acceder a mi Bitácora</span>
                        </button>
                        <button onClick={() => scrollToSection('blog')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2">
                            <Book size={20} />
                            <span>Explorar el Blog</span>
                        </button>
                        <button onClick={() => scrollToSection('contacto')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2">
                            <Book size={20} />
                            <span>Contáctanos</span>
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap justify-start gap-4 mt-24">
                    <FeaturePill icon={Activity} title="Gestión Completa" description="Administra plantas, espacios y toda la trazabilidad de tu cultivo" colorClass="border-green-100" />
                    <FeaturePill icon={Book} title="Aprende Siempre" description="Accede a guías, técnicas y conocimiento de la comunidad" colorClass="border-blue-100" />
                    <FeaturePill icon={Users} title="Comunidad Activa" description="Comparte tus cultivos y aprende de otros cultivadores" colorClass="border-purple-100" />
                </div>
            </div>
        </section>
    );
};

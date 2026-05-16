import React from 'react';
import { useNavigate } from "react-router-dom";
import { Home, Calendar, Sprout, LineChart, Tractor, Activity, Book, Users, Mail, LogIn, X } from 'lucide-react';

const sidebarItems = [
    { name: 'Dashboard / Inicio', icon: Home, section: 'inicio', category: 'General' },
    { name: 'Mi Bitácora de Cultivo', icon: Calendar, section: 'bitacora-app', category: 'App' },
    { name: 'Gestión de Genéticas', icon: Sprout, section: 'genetics-app', category: 'App' },
    { name: 'Métricas de Cosecha', icon: LineChart, section: 'metrics-app', category: 'App' },
    { name: 'Equipamiento', icon: Tractor, section: 'equipment-app', category: 'App' },
    { name: 'Funciones de Delta Grow', icon: Activity, section: 'funciones', category: 'Info' },
    { name: 'Blog y Guías', icon: Book, section: 'blog', category: 'Info' },
    { name: 'Comunidad', icon: Users, section: 'comunidad', category: 'Info' },
    { name: 'Soporte y Contacto', icon: Mail, section: 'contacto', category: 'Info' },
];

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeSection: string;
    scrollToSection: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, activeSection, scrollToSection }) => {
    const navigate = useNavigate();
    const appItems = sidebarItems.filter(item => item.category === 'App');
    const infoItems = sidebarItems.filter(item => item.category === 'Info' || item.category === 'General');

    return (
        <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out bg-card w-64 shadow-2xl z-[90] md:hidden overflow-y-auto`}>
            <div className="p-4 flex items-center justify-between border-b border-border h-16 sticky top-0 bg-card z-10">
                <span className="text-xl font-bold text-foreground">Menú Principal</span>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-primary">
                    <X size={24} />
                </button>
            </div>
            <nav className="p-4 space-y-4">
                <div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 pl-3">Plataforma de Cultivo</h3>
                    {appItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => scrollToSection(item.section)}
                                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-colors ${activeSection === item.section ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-card-hover hover:text-primary'}`}
                            >
                                <Icon size={20} className="text-primary" />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </div>

                <hr className="border-t border-border my-4" />

                <div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 pl-3">Información y Comunidad</h3>
                    {infoItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => scrollToSection(item.section)}
                                className={`w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-colors ${activeSection === item.section ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-card-hover hover:text-primary'}`}
                            >
                                <Icon size={20} className="text-muted-foreground" />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 p-3">
                    <button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
                        <LogIn size={18} />
                        <span>Ingresar</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

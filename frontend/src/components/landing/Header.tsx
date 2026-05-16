import React from 'react';
import { useNavigate } from "react-router-dom";
import { Leaf, LogIn, Menu, Sprout, Activity, Book, Users, Mail } from 'lucide-react';

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeSection: string;
    scrollToSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, activeSection, scrollToSection }) => {
    const navigate = useNavigate();

    return (
        <nav className="bg-card border-b border-border shadow-lg sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden text-foreground hover:text-primary p-2 rounded-lg -ml-2">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="bg-gradient-to-br from-primary to-emerald-600 p-2 rounded-lg">
                            <Leaf className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold text-foreground">Flores <span className="text-primary">Delta</span></span>
                    </div>
                </div>

                <div className="hidden md:flex space-x-8">
                    <button onClick={() => scrollToSection('inicio')} className={`${activeSection === 'inicio' ? 'text-primary font-semibold' : 'text-muted-foreground'} hover:text-primary transition-colors flex items-center space-x-1`}>
                        <Sprout size={18} />
                        <span>Inicio</span>
                    </button>
                    <button onClick={() => scrollToSection('funciones')} className={`${activeSection === 'funciones' ? 'text-primary font-semibold' : 'text-muted-foreground'} hover:text-primary transition-colors flex items-center space-x-1`}>
                        <Activity size={18} />
                        <span>Funciones</span>
                    </button>
                    <button onClick={() => scrollToSection('blog')} className={`${activeSection === 'blog' ? 'text-primary font-semibold' : 'text-muted-foreground'} hover:text-primary transition-colors flex items-center space-x-1`}>
                        <Book size={18} />
                        <span>Blog</span>
                    </button>
                    <button onClick={() => scrollToSection('comunidad')} className={`${activeSection === 'comunidad' ? 'text-primary font-semibold' : 'text-muted-foreground'} hover:text-primary transition-colors flex items-center space-x-1`}>
                        <Users size={18} />
                        <span>Comunidad</span>
                    </button>
                    <button onClick={() => scrollToSection('contacto')} className={`${activeSection === 'contacto' ? 'text-primary font-semibold' : 'text-muted-foreground'} hover:text-primary transition-colors flex items-center space-x-1`}>
                        <Mail size={18} />
                        <span>Contacto</span>
                    </button>
                </div>

                <div className="hidden md:block">
                    <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-primary to-emerald-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 flex items-center space-x-2">
                        <LogIn size={18} />
                        <span>Ingresar</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

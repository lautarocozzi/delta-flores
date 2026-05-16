import React from 'react';
import { Leaf } from 'lucide-react';

interface FooterProps {
    scrollToSection: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ scrollToSection }) => (
    <footer className="bg-card text-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Leaf className="text-green-500" size={32} />
                        <span className="text-2xl font-bold">Flores <span className="text-green-500">Delta</span></span>
                    </div>
                    <p className="text-muted-foreground text-sm">Cultivando confianza, cosechando resultados</p>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Plataforma</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><button onClick={() => scrollToSection('funciones')} className="hover:text-primary transition">Funciones</button></li>
                        <li><button onClick={() => scrollToSection('blog')} className="hover:text-primary transition">Blog</button></li>
                        <li><button onClick={() => scrollToSection('comunidad')} className="hover:text-primary transition">Comunidad</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Recursos</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition">Guías de Cultivo</a></li>
                        <li><a href="#" className="hover:text-primary transition">Documentación</a></li>
                        <li><a href="#" className="hover:text-primary transition">Soporte</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition">Términos de Uso</a></li>
                        <li><a href="#" className="hover:text-primary transition">Privacidad</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-muted-foreground text-sm">
                <p>&copy; 2025 Flores del Delta. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>
);

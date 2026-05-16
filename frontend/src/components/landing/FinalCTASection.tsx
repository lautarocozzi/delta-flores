import React from 'react';
import { useNavigate } from "react-router-dom";
import { LogIn } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="py-28 px-4 relative overflow-hidden bg-background" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/END.png')", backgroundSize: "cover", backgroundPosition: "center 10%" }}>
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-4xl font-bold text-white mb-6">¿Listo para transformar tu cultivo?</h2>
                <div className="h-8"></div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => navigate('/login')} className="border-2 border-green-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-green-500/10 transition-all duration-300 inline-flex items-center justify-center space-x-2">
                        <LogIn size={24} />
                        <span>Ingresar a mi Cuenta</span>
                    </button>
                    <button onClick={() => navigate('/login')} className="border-2 border-green-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-green-500/10 transition-all duration-300">
                        Crear Cuenta Gratis
                    </button>
                </div>
            </div>
        </section>
    );
};

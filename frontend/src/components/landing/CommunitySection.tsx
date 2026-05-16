import React from 'react';
import { Award, MessageSquare, Users } from 'lucide-react';
import { StatCard } from './StatCard';

export const CommunitySection: React.FC = () => (
    <section id="comunidad" className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold mb-6">Únete a Nuestra Comunidad</h2>
                        <p className="text-xl mb-8 text-green-50">
                            Comparte tus cultivos, aprende de otros cultivadores y recibe feedback de la comunidad. Juntos crecemos mejor.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3"><Award className="text-amber-300" size={28} /> <span className="text-lg">Comparte tus mejores cosechas</span></div>
                            <div className="flex items-center space-x-3"><MessageSquare className="text-blue-300" size={28} /> <span className="text-lg">Consulta y aprende de expertos</span></div>
                            <div className="flex items-center space-x-3"><Users className="text-purple-300" size={28} /> <span className="text-lg">Conecta con cultivadores de todo el país</span></div>
                        </div>
                        <button className="mt-8 bg-white text-green-600 px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all duration-300 inline-flex items-center space-x-2">
                            <Users size={20} />
                            <span>Explorar la Comunidad</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard value="500+" label="Cultivadores activos" />
                        <StatCard value="1.2K" label="Cultivos registrados" />
                        <StatCard value="250+" label="Artículos publicados" />
                        <StatCard value="3.5K" label="Comentarios y tips" />
                    </div>
                </div>
            </div>
        </div>
    </section>
);

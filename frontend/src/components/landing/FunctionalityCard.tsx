import React from 'react';

interface FunctionalityCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
}

export const FunctionalityCard: React.FC<FunctionalityCardProps> = ({ icon: Icon, title, description, color }) => (
    <div className="bg-card rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-green-500" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('/FONDO_CARDS.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className={`bg-gradient-to-br ${color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
            <Icon className="text-white" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white leading-relaxed">{description}</p>
    </div>
);

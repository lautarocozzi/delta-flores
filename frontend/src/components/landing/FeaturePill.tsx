import React from 'react';

interface FeaturePillProps {
    icon: React.ElementType;
    title: string;
    description: string;
    colorClass: string;
}

export const FeaturePill: React.FC<FeaturePillProps> = ({ icon: Icon, title, description, colorClass }) => (
    <div className={`bg-white/5 rounded-2xl p-2 shadow-lg border border-green-500 hover:shadow-xl transition-shadow max-w-[18rem]`}>
        <div className={`bg-gradient-to-br ${colorClass.replace('border-', 'from-').replace('-100', '-400')} to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
            <Icon className="text-white" size={24} />
        </div>
        <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
        <p className="text-foreground text-sm">{description}</p>
    </div>
);

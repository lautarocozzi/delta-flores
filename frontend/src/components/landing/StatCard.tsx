import React from 'react';

interface StatCardProps {
    value: string;
    label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <p className="text-4xl font-bold mb-2">{value}</p>
        <p className="text-green-100">{label}</p>
    </div>
);

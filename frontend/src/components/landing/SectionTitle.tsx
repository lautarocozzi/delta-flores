import React from 'react';

interface SectionTitleProps {
    title: string;
    subtitle: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle }) => (
    <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-foreground mb-4">{title}</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{subtitle}</p>
    </div>
);

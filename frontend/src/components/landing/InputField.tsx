import React from 'react';

interface InputFieldProps {
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    rows?: number;
}

export const InputField: React.FC<InputFieldProps> = ({ id, label, type = "text", placeholder, rows }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">{label}</label>
        {type === 'textarea' ? (
            <textarea id={id} name={id} rows={rows} placeholder={placeholder} className="w-full px-4 py-3 border border-green-500 rounded-xl focus:ring-green-500 focus:border-green-500 transition duration-150 bg-green-50 text-gray-900 placeholder-gray-500" />
        ) : (
            <input type={type} id={id} name={id} placeholder={placeholder} className="w-full px-4 py-3 border border-green-500 rounded-xl focus:ring-green-500 focus:border-green-500 transition duration-150 bg-green-50 text-gray-900 placeholder-gray-500" />
        )}
    </div>
);

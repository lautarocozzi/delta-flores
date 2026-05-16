import React from 'react';
import { Mail } from 'lucide-react';
import { SectionTitle } from './SectionTitle';
import { InputField } from './InputField';

export const ContactSection: React.FC = () => (
    <section id="contacto" className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
            <SectionTitle title="Contáctanos" subtitle="¿Tienes alguna duda o quieres saber más? Escríbenos." />
            <div className="bg-card p-8 md:p-12 rounded-3xl shadow-2xl border border-green-500">
                <form className="space-y-6">
                    <InputField id="name" label="Nombre Completo" placeholder="Tu nombre y apellido" />
                    <InputField id="email" label="Email" type="email" placeholder="tu.correo@ejemplo.com" />
                    <InputField id="message" label="Mensaje" type="textarea" rows={4} placeholder="Escribe tu consulta aquí..." />
                    <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 inline-flex items-center justify-center space-x-2">
                        <Mail size={20} />
                        <span>Enviar Mensaje</span>
                    </button>
                </form>
            </div>
        </div>
    </section>
);

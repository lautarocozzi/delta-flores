import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface FormSectionProps {
  /** Título de la sección */
  title: string;
  /** Icono opcional para el encabezado */
  icon?: LucideIcon;
  /** Color del icono (clase Tailwind) */
  iconColor?: string;
  /** Contenido (inputs, selects, etc.) */
  children: ReactNode;
  /** Clase adicional para el contenedor */
  className?: string;
}

/**
 * Sección visual para agrupar campos relacionados en un formulario.
 * Renderiza un contenedor con borde, fondo suave y título.
 *
 * @example
 * <FormSection icon={MapPin} title="Información General">
 *   <FormInputField control={form.control} name="nombre" label="Nombre" />
 *   <FormInputField control={form.control} name="descripcion" label="Descripción" />
 * </FormSection>
 */
export const FormSection = ({
  title,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  children,
  className = '',
}: FormSectionProps) => (
  <div className={`space-y-4 p-4 border rounded-lg bg-muted/10 ${className}`}>
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
    </div>
    {children}
  </div>
);

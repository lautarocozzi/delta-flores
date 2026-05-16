import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { type LucideIcon } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
  value: string;
  label: string;
  /** Icono opcional — se renderiza SOLO en el dropdown, no en el trigger */
  icon?: LucideIcon;
  /** Color del icono (clase Tailwind) */
  iconColor?: string;
}

interface FormSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Select de formulario con tipado genérico y soporte de iconos en dropdown.
 *
 * ⚠️ Los iconos se renderizan SOLO en las opciones del dropdown.
 * El trigger muestra solo el label (limitación de shadcn/ui Radix Select).
 *
 * @example
 * <FormSelectField
 *   control={form.control}
 *   name="tipoAmbiente"
 *   label="Tipo de Ambiente"
 *   options={[
 *     { value: "INTERIOR", label: "Interior", icon: Home, iconColor: "text-blue-400" },
 *     { value: "EXTERIOR", label: "Exterior", icon: Sun, iconColor: "text-orange-400" },
 *   ]}
 *   placeholder="Seleccionar..."
 * />
 */
export const FormSelectField = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Seleccionar...',
  emptyMessage = 'No hay opciones disponibles',
  description,
  required,
  disabled,
}: FormSelectFieldProps<T>) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        <Select
          onValueChange={field.onChange}
          value={field.value ?? ''}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.length > 0 ? (
              options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.icon ? (
                    <span className="flex items-center gap-2">
                      <option.icon
                        className={`w-4 h-4 ${option.iconColor ?? ''}`}
                      />
                      <span>{option.label}</span>
                    </span>
                  ) : (
                    option.label
                  )}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__empty__" disabled>
                {emptyMessage}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

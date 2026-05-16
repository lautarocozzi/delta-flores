import { type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface FormInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: string;
  /** Marca visual "requerido" en el label */
  required?: boolean;
  /** Muestra "(Opcional)" en el label */
  optional?: boolean;
  /** Texto de ayuda debajo del campo */
  description?: string;
  /** Deshabilitar el input */
  disabled?: boolean;
}

/**
 * Input de formulario con tipado genérico react-hook-form.
 *
 * @example
 * <FormInputField
 *   control={form.control}
 *   name="nombre"
 *   label="Nombre"
 *   placeholder="Ej: Sala principal"
 *   required
 * />
 */
export const FormInputField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  required,
  optional,
  description,
  disabled,
}: FormInputFieldProps<T>) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
          {optional && (
            <span className="text-muted-foreground font-normal ml-1">
              (Opcional)
            </span>
          )}
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            value={field.value ?? ''}
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

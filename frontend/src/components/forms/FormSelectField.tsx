import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

interface SelectOption {
    value: string;
    label: string;
}

interface FormSelectFieldProps {
    control: any;
    name: string;
    label: string;
    options: SelectOption[];
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
}

export const FormSelectField = ({
    control,
    name,
    label,
    options,
    placeholder = "Seleccionar...",
    emptyMessage = "No hay opciones disponibles",
    disabled = false,
}: FormSelectFieldProps) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {options.length > 0 ? (
                            options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="none" disabled>
                                {emptyMessage}
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )}
    />
);

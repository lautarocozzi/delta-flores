import { Input } from "@/components/ui/input";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

interface FormInputFieldProps {
    control: any;
    name: string;
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    optional?: boolean;
    disabled?: boolean;
}

export const FormInputField = ({
    control,
    name,
    label,
    placeholder,
    type = "text",
    optional = false,
    disabled = false,
}: FormInputFieldProps) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>
                    {label} {optional && <span className="text-muted-foreground">(Opcional)</span>}
                </FormLabel>
                <FormControl>
                    <Input {...field} type={type} placeholder={placeholder} disabled={disabled} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

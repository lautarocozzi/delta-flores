import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";

interface FormCheckboxFieldProps {
    control: any;
    name: string;
    label: string;
    description?: string;
}

export const FormCheckboxField = ({
    control,
    name,
    label,
    description
}: FormCheckboxFieldProps) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <FormLabel>{label}</FormLabel>
                    {description && (
                        <div className="text-sm text-muted-foreground">{description}</div>
                    )}
                </div>
                <FormControl>
                    <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value}
                        onChange={field.onChange}
                    />
                </FormControl>
            </FormItem>
        )}
    />
);

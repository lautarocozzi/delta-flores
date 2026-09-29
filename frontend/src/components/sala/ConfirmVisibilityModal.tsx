import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Pin } from "lucide-react";

interface ConfirmVisibilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaName: string;
  makingPublic: boolean;
  onConfirm: (propagate: boolean, pin: boolean) => void;
}

export function ConfirmVisibilityModal({ open, onOpenChange, salaName, makingPublic, onConfirm }: ConfirmVisibilityModalProps) {
  const [pinOnProfile, setPinOnProfile] = useState(false);

  const handleConfirm = (propagate: boolean) => {
    onConfirm(propagate, makingPublic && pinOnProfile);
    setPinOnProfile(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPinOnProfile(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {makingPublic
              ? `Hacer pública la sala "${salaName}"`
              : `Hacer privada la sala "${salaName}"`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {makingPublic
              ? "¿Querés que todas las plantas de esta sala también sean públicas?"
              : "¿Querés que todas las plantas de esta sala también sean privadas?"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Pin option — only when making public */}
        {makingPublic && (
          <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Fijar en el perfil</p>
                <p className="text-xs text-muted-foreground">
                  Aparece primero en tu perfil
                </p>
              </div>
            </div>
            <Switch checked={pinOnProfile} onCheckedChange={setPinOnProfile} />
          </div>
        )}

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleConfirm(false)}
            className="bg-muted text-muted-foreground hover:bg-muted/80"
          >
            {makingPublic ? "No, solo la sala" : "No, mantener plantas"}
          </AlertDialogAction>
          <AlertDialogAction onClick={() => handleConfirm(true)}>
            {makingPublic ? "Sí, hacer plantas públicas" : "Sí, hacer plantas privadas"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

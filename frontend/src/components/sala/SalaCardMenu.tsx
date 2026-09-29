import { MoreVertical, Info, Grid3x3, Trash2, Eye, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface SalaCardMenuProps {
  isOwner: boolean;
  tipoColaborador?: string | null;  // "EDITOR" | "LECTURA" | null (null = owner)
  isPublic?: boolean;
  onInfo: () => void;
  onZonas: () => void;
  onDelete: () => void;
  onTogglePublic?: (makePublic: boolean) => void;
  onColaboradores?: () => void;
}

export function SalaCardMenu({ isOwner, tipoColaborador, isPublic, onInfo, onZonas, onDelete, onTogglePublic, onColaboradores }: SalaCardMenuProps) {
  const canEdit = isOwner || tipoColaborador === "EDITOR";
  const canManageCollabs = isOwner;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        aria-label="Acciones de sala"
        className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onInfo(); }}>
          <Info className="h-4 w-4 mr-2" />
          Información
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onZonas(); }}>
            <Grid3x3 className="h-4 w-4 mr-2" />
            Zonas
          </DropdownMenuItem>
        )}
        {canManageCollabs && onColaboradores && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onColaboradores(); }}>
            <Users className="h-4 w-4 mr-2" />
            Colaboradores
          </DropdownMenuItem>
        )}
        {isOwner && onTogglePublic && (
          <div className="flex items-center justify-between px-2 py-1.5 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Visibilidad</span>
            </div>
            <Switch
              checked={isPublic ?? false}
              onCheckedChange={onTogglePublic}
            />
          </div>
        )}
        {isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Sala
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

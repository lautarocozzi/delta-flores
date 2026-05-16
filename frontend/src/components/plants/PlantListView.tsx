import { type PlantaDto } from "@/interfaces/Planta";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Leaf, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface PlantListViewProps {
  plantas: PlantaDto[];
}

const ETAPA_COLORS: Record<string, string> = {
  GERMINACION: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PLANTIN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  VEGETACION: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  FLORACION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  COSECHADA: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

function getDaysOld(fechaCreacion: string): number {
  return Math.floor((new Date().getTime() - new Date(fechaCreacion).getTime()) / (1000 * 3600 * 24));
}

export function PlantListView({ plantas }: PlantListViewProps) {
  const navigate = useNavigate();
  if (plantas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Leaf className="mx-auto mb-2" size={32} />
        <p>No se encontraron plantas</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Nombre</TableHead>
            <TableHead>Genética</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Sala</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="text-right">Edad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plantas.map((plant) => (
            <TableRow
              key={plant.id}
              className="group cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/plant/${plant.id}`)}
            >
              <TableCell className="font-medium">
                <Link to={`/plant/${plant.id}`} className="hover:text-primary transition-colors">
                  {plant.nombre}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground italic">
                {plant.cepaDto?.geneticaParental || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`font-normal ${ETAPA_COLORS[plant.etapa] || ""}`}
                >
                  <Leaf size={12} className="mr-1" />
                  {plant.etapa}
                </Badge>
              </TableCell>
              <TableCell>{plant.sala?.nombre || "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {plant.ubicacion || "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {getDaysOld(plant.fechaCreacion)} días
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

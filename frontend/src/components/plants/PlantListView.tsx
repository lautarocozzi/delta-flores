import { type PlantaDto } from "@/interfaces/Planta";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Leaf, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getEtapaColor } from "@/lib/etapas";

interface PlantListViewProps {
  plantas: PlantaDto[];
}

function getDaysOld(desde: string): number {
  return Math.floor((new Date().getTime() - new Date(desde).getTime()) / (1000 * 3600 * 24));
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
                  className={`font-normal ${getEtapaColor(plant.etapa)}`}
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
                  {getDaysOld(plant.fecha_siembra ?? plant.fechaCreacion)} días
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

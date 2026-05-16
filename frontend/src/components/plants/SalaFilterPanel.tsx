import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlidersHorizontal, Search, X } from "lucide-react";
import type { SalaDto } from "@/interfaces/Planta";

const ETAPAS = ["GERMINACION", "PLANTIN", "VEGETACION", "FLORACION", "COSECHADA"] as const;

interface SalaFilterPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterEtapa: string;
  onEtapaChange: (value: string) => void;
  selectedSalas: string[];
  onSalasChange: (salas: string[]) => void;
  salas: SalaDto[];
}

export function SalaFilterPanel({
  searchQuery,
  onSearchChange,
  filterEtapa,
  onEtapaChange,
  selectedSalas,
  onSalasChange,
  salas,
}: SalaFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (filterEtapa !== "Todas" ? 1 : 0) +
    (selectedSalas.length > 0 && selectedSalas.length < salas.length ? 1 : 0);

  const toggleSala = (salaName: string) => {
    if (selectedSalas.includes(salaName)) {
      onSalasChange(selectedSalas.filter((s) => s !== salaName));
    } else {
      onSalasChange([...selectedSalas, salaName]);
    }
  };

  const clearAll = () => {
    onSearchChange("");
    onEtapaChange("Todas");
    onSalasChange([]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative gap-2 border-primary/30 hover:border-primary/60"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Filtros
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6" style={{ height: "calc(100vh - 80px)" }}>
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Nombre o genética..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <Separator />

            {/* Etapa filter */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Etapa
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filterEtapa === "Todas" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onEtapaChange("Todas")}
                >
                  Todas
                </Badge>
                {ETAPAS.map((etapa) => (
                  <Badge
                    key={etapa}
                    variant={filterEtapa === etapa ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => onEtapaChange(filterEtapa === etapa ? "Todas" : etapa)}
                  >
                    {etapa.charAt(0) + etapa.slice(1).toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Sala filter */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Salas
              </label>
              <div className="space-y-1">
                {salas.map((sala) => {
                  const isSelected = selectedSalas.length === 0 || selectedSalas.includes(sala.nombre);
                  return (
                    <button
                      key={sala.id}
                      onClick={() => toggleSala(sala.nombre)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {sala.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="w-full text-muted-foreground"
                >
                  <X size={14} className="mr-2" />
                  Limpiar filtros
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Scissors,
  Thermometer,
  Leaf,
  Camera,
  FileText,
  MapPin,
  Plus,
  ArrowLeft,
  X,
  Sprout,
  FlaskConical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRegistroEventoFormStore } from "@/stores/useRegistroEventoFormStore";
// Forms
import { WateringForm } from "@/components/forms/WateringForm";
import { MassNutrientForm } from "@/components/forms/MassNutrientForm";
import { DefoliationForm } from "@/components/forms/DefoliationForm";
import { PruningForm } from "@/components/forms/PruningForm";
import { MeasurementForm } from "@/components/forms/MeasurementForm";
import { StageChangeForm } from "@/components/forms/StageChangeForm";
import { PhotoForm } from "@/components/forms/PhotoForm";
import { NoteForm } from "@/components/forms/NoteForm";
import { NewSalaForm } from "@/components/forms/NewSalaForm";
import { NewPlantForm } from "@/components/forms/NewPlantForm";
import { NewCepaForm } from "@/components/forms/NewCepaForm";
import { PlantSelectorInline } from "@/components/shared/PlantSelectorInline";

// ─── Action definitions ──────────────────────────────────────

type ActionDef = {
  icon: React.ElementType;
  label: string;
  name: string;
};

type ActionGroup = {
  actions: ActionDef[];
};

type CategoryDef = {
  icon: React.ElementType;
  label: string;
  name: string;
  subActions: ActionDef[];
};

// Riego is a category with sub-actions
const riegoCategory: CategoryDef = {
  icon: Droplets,
  label: "Riego",
  name: "riego",
  subActions: [
    { icon: Droplets, label: "Simple", name: "riego-simple" },
    { icon: FlaskConical, label: "Con nutrientes", name: "riego-con-nutrientes" },
  ],
};

// Other action groups (no sub-levels)
const actionGroups: ActionGroup[] = [
  {
    actions: [
      { icon: Scissors, label: "Defoliación", name: "defoliacion" },
      { icon: Scissors, label: "Poda", name: "poda" },
      { icon: Thermometer, label: "Datos del Ambiente", name: "datos-ambiente" },
    ],
  },
  {
    actions: [
      { icon: Leaf, label: "Nueva Etapa", name: "nueva-etapa" },
      { icon: Camera, label: "Nueva Foto", name: "tomar-foto" },
      { icon: FileText, label: "Nueva Nota", name: "nueva-nota" },
    ],
  },
  {
    actions: [
      { icon: MapPin, label: "Nueva Sala", name: "nueva-sala" },
      { icon: Sprout, label: "Nueva Planta", name: "nueva-planta" },
      { icon: FlaskConical, label: "Nueva Cepa", name: "nueva-cepa" },
    ],
  },
];

// ─── Tools that require plant selection ────────────────────────
const TOOLS_WITH_PLANT_SELECT = new Set([
  "riego-simple", "defoliacion", "poda",
  "datos-ambiente", "nueva-etapa", "tomar-foto", "nueva-nota",
]);

// ─── Component ────────────────────────────────────────────────
export const RegistroEventoForm = () => {
  const { isOpen, closeMenu, contextPlantaId } = useRegistroEventoFormStore();
  const navigate = useNavigate();

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showSubCategory, setShowSubCategory] = useState<string | null>(null);
  const [showPlantSelector, setShowPlantSelector] = useState(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);

  // Reset state when menu opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTool(null);
      setShowSubCategory(null);
      setShowPlantSelector(false);
      setSelectedPlantIds([]);
    }
  }, [isOpen]);

  // When menu opens with a pre-selected tool + plant, skip plant selector
  useEffect(() => {
    if (isOpen && contextPlantaId && selectedTool && TOOLS_WITH_PLANT_SELECT.has(selectedTool)) {
      setSelectedPlantIds([contextPlantaId]);
    }
  }, [isOpen, contextPlantaId, selectedTool]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleBack();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, selectedTool, showSubCategory, showPlantSelector, selectedPlantIds]);

  const handleClose = () => {
    setSelectedTool(null);
    setShowSubCategory(null);
    setShowPlantSelector(false);
    setSelectedPlantIds([]);
    closeMenu();
  };

  const handleFormComplete = () => {
    handleClose();
    navigate("/dashboard");
  };

  const handleBack = () => {
    // En un form → volver al grid
    if (selectedTool && !showPlantSelector) {
      setSelectedTool(null);
      setSelectedPlantIds([]);
    } else if (showPlantSelector) {
      // En el selector de plantas → volver al grid
      setShowPlantSelector(false);
      setSelectedTool(null);
    } else if (showSubCategory) {
      setShowSubCategory(null);
    } else {
      handleClose();
    }
  };

  // When tool is selected, check if it needs plant selection
  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    if (TOOLS_WITH_PLANT_SELECT.has(toolName)) {
      if (contextPlantaId) {
        // Skip plant selector — we already know which plant
        setSelectedPlantIds([contextPlantaId]);
      } else {
        setShowPlantSelector(true);
      }
    }
  };

  // Plant selector complete → go to form
  const handlePlantsSelected = (plantIds: number[]) => {
    setShowPlantSelector(false);
    setSelectedPlantIds(plantIds);
  };

  // ── Render chosen form ──────────────────────────────────────
  const renderFormContent = () => {
    const shared = { onBack: handleBack, onClose: handleFormComplete };
    const plantProps = selectedPlantIds.length > 0 ? { selectedPlantIds } : {};
    switch (selectedTool) {
      case "riego-simple":
        return <WateringForm {...shared} {...plantProps} />;
      case "riego-con-nutrientes":
        return <MassNutrientForm onComplete={handleFormComplete} />;
      case "defoliacion":
        return <DefoliationForm {...shared} {...plantProps} />;
      case "poda":
        return <PruningForm {...shared} {...plantProps} />;
      case "datos-ambiente":
        return <MeasurementForm {...shared} {...plantProps} />;
      case "nueva-etapa":
        return <StageChangeForm {...shared} {...plantProps} />;
      case "tomar-foto":
        return <PhotoForm {...shared} {...plantProps} />;
      case "nueva-nota":
        return <NoteForm {...shared} {...plantProps} />;
      case "nueva-sala":
        return <NewSalaForm {...shared} />;
      case "nueva-planta":
        return <NewPlantForm {...shared} contextSalaId={undefined} />;
      case "nueva-cepa":
        return <NewCepaForm {...shared} />;
      default:
        return null;
    }
  };

  // ── Render action button ────────────────────────────────────
  const renderAction = (action: ActionDef, index: number, variant?: "default" | "secondary" | "ghost") => {
    const Icon = action.icon;
    return (
      <motion.div
        key={action.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Button
          variant={variant ?? "default"}
          onClick={() => handleToolSelect(action.name)}
          className="w-full h-auto flex-col gap-1.5 py-3"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="font-medium text-sm leading-tight">{action.label}</span>
        </Button>
      </motion.div>
    );
  };

  // ── Actions sub-grid ────────────────────────────────────────
  const renderGridView = () => (
    <div className="flex flex-col gap-3">
      {/* Riego — full width as category opener */}
      <motion.div
        key="riego"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Button
          variant="default"
          onClick={() => setShowSubCategory("riego")}
          className="w-full h-auto flex-col gap-1.5 py-4 shadow-lg shadow-primary/20"
        >
          <Droplets className="h-6 w-6 shrink-0" />
          <span className="font-medium text-base leading-tight">Riego</span>
        </Button>
      </motion.div>

      {/* Separator */}
      <div className="h-px bg-border" />

      {/* Other actions in compact 3-col grid */}
      {actionGroups.map((group, gi) => (
        <motion.div
          key={gi}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 + gi * 0.05 }}
        >
          <div className="grid grid-cols-3 gap-2">
            {group.actions.map((action, idx) =>
              renderAction(action, idx, gi === 2 ? "ghost" : "secondary")
            )}
          </div>

          {/* Separator between groups (except last) */}
          {gi < actionGroups.length - 1 && (
            <div className="h-px bg-border my-3" />
          )}
        </motion.div>
      ))}
    </div>
  );

  // ── Sub-category view (Riego options) ───────────────────────
  const renderSubCategoryView = () => {
    if (showSubCategory === "riego") {
      return (
        <div className="flex flex-col gap-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSubCategory(null)}
            className="self-start gap-1.5 h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Volver</span>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            {riegoCategory.subActions.map((action, idx) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Button
                  variant="default"
                  onClick={() => handleToolSelect(action.name)}
                  className="w-full h-auto flex-col gap-1.5 py-6"
                >
                  <action.icon className="h-6 w-6 shrink-0" />
                  <span className="font-medium text-sm leading-tight">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // ── Form view ───────────────────────────────────────────────
  const renderFormView = () => (
    <div className="py-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTool}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
        >
          {renderFormContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // ── Plant selector view ──
  const renderPlantSelector = () => (
    <div className="py-2">
      <AnimatePresence mode="wait">
        <motion.div
          key="plant-selector"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
        >
          <PlantSelectorInline
            onComplete={handlePlantsSelected}
            onBack={handleBack}
            onClose={handleFormComplete}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────
  const showContent = () => {
    if (selectedTool && showPlantSelector) return renderPlantSelector();
    if (selectedTool) return renderFormView();
    if (showSubCategory) return renderSubCategoryView();
    return renderGridView();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col gap-5">
          {showContent()}

          {/* Close X button at the bottom */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import os

# Path del archivo
file_path = r"c:\Users\gabyb\Desktop\FLORES DELTA\FLORES DELTA MVP\FLORES-DELTA-FRONTEND\src\Components\forms\NewPlantForm.tsx"

# Leer archivo
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Código a insertar (después de línea 162, que es índice 161)
validation_code = """
  // Validación: Si no hay salas o genéticas, mostrar advertencia
  if (salas.length === 0 || cepas.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-xl font-bold text-foreground">Nueva Planta</h3>
          </div>
        </div>

        <div className="p-4 border border-yellow-500 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Datos Faltantes
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Para crear una planta necesitas:
          </p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mb-3">
            {salas.length === 0 && <li>Al menos 1 Sala creada</li>}
            {cepas.length === 0 && <li>Al menos 1 Genética creada</li>}
          </ul>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
            Ve al Panel de Control para crear estos elementos primero.
          </p>
          <Button onClick={onClose} className="w-full">
            Ir al Panel de Control
          </Button>
        </div>
      </div>
    );
  }

"""

# Insertar después de línea 162 (índice 161)
lines.insert(162, validation_code)

# Escribir archivo
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Validación agregada a NewPlantForm.tsx")

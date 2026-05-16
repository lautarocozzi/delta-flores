export interface BackendEvent {
  id: number;
  eventType: 'WATERING' | 'PRUNING' | 'NOTE' | 'NUTRIENT' | 'PHOTO' | 'STAGE_CHANGE' | 'DEFOLIATION' | 'MEASUREMENT';
  fecha: string;
  plantaIds: number[];
  phAgua?: number;
  ecAgua?: number;
  tipoPoda?: string;
  observacion?: string;
  nuevaEtapa?: string;
  description?: string;
  mediaUrls?: string[];
  nutriente?: { id: number; titulo: string };
  /** Defoliation */
  gradoDefoliacion?: string;
  /** Measurement */
  horasLuz?: string;
  humedad?: number;
  temperaturaAmbiente?: number;
  alturaPlanta?: number;
  distanciaLuz?: number;
}

export interface WateringEventPayload {
  plantaIds: number[];
  fecha: string;
  phAgua?: number;
  ecAgua?: number;
}

export interface PruningEventPayload {
  plantaIds: number[];
  fecha: string;
  tipoPoda: string;
}

export interface NoteEventPayload {
  plantaIds: number[];
  fecha: string;
  observacion: string;
}

export interface StageChangeEventPayload {
  plantaIds: number[];
  fecha: string;
  nuevaEtapa: string;
}

export interface DefoliationEventPayload {
  plantaIds: number[];
  fecha: string;
  gradoDefoliacion: string;
}

export interface MeasurementEventPayload {
  plantaIds: number[];
  fecha: string;
  horasLuz?: string;
  humedad?: number;
  temperaturaAmbiente?: number;
  alturaPlanta?: number;
  distanciaLuz?: number;
}

// Photo events use FormData, so no JSON interface is strictly needed for the payload,
// but we can define the expected fields for documentation.
export interface PhotoEventFormData {
  plantaIds: number[];
  fecha: string;
  description?: string;
  file: File;
}

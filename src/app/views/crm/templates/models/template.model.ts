export interface Plantilla {
  id: number;
  empresaId: number;
  tipo: 'WHATSAPP' | 'GENERAL';
  nombre: string;
  contenido: string | null;
  archivoAdjuntoUrl: string | null;
  estado: 'ACTIVA' | 'BORRADOR' | 'PENDIENTE_APROBACION' | 'RECHAZADA';
  botones: PlantillaBoton[];
  createdAt: string;
  createdBy: number | null;
  updatedAt: string | null;
  updatedBy: number | null;
}

export interface PlantillaBoton {
  id: number | null;
  texto: string;
  orden: number;
}

export interface PlantillaRequest {
  empresaId: number;
  nombre: string;
  contenido: string | null;
  archivoAdjuntoUrl: string | null;
  botones: PlantillaBotonRequest[];
}

export interface PlantillaBotonRequest {
  texto: string;
  orden: number;
}

export interface PlantillaVariable {
  key: string;
  label: string;
  entidad: 'CLIENTE' | 'OPORTUNIDAD';
  campo: string;
}

export interface InventarioRow {
  id: string;
  producto: string;
  categoria: string;
  cantidad_actual: number;
  cantidad_minima: number;
  meta_campana: number;
}

export interface EntregasMapaRow {
  id: string;
  lugar_comunidad: string;
  latitud: number;
  longitud: number;
  detalles_entrega: string;
  fecha_entrega: string;
}

export interface ConfiguracionHomeRow {
  id_tipo: string;
  tarea_del_dia: string;
  meta_termometro_global: number;
  recaudado_termometro_global: number;
}

export interface InventarioHistorialRow {
  id: string;
  inventario_id: string | null;
  producto: string;
  categoria: string;
  cantidad_antes: number;
  cantidad_despues: number;
  operacion: string;
  nota: string;
  creado_en: string;
}

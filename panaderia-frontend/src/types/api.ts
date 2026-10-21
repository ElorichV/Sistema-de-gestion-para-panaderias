export interface Producto {
  productoId: number;
  nombre: string;
  descripcion?: string | null;
  tipoProductoId: number;
  tipoProductoNombre: string;
  unidadMedidaId: number;
  unidadMedidaNombre: string;
  unidadMedidaAbreviatura: string;
  precioVenta: number;
  costoPromedio: number;
  esVendible: boolean;
  esInsumo: boolean;
  stockTotal: number;
}

export interface InventarioItem {
  inventarioId: number;
  sucursalId: number;
  sucursalNombre: string;
  productoId: number;
  productoNombre: string;
  descripcion?: string | null;
  tipoProductoNombre: string;
  unidadMedida: string;
  cantidadStock: number;
  precioVenta: number;
  esVendible: boolean;
  esInsumo: boolean;
}

export interface Cliente {
  clienteId: number;
  nombre: string;
  rfc?: string | null;
  email?: string | null;
  tipoClienteId: number;
  tipoClienteNombre: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
}

export interface CreateVentaDetalleDto {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface CreateVentaDto {
  sucursalId: number;
  empleadoId: number;
  clienteId?: number | null;
  tipoImpuestoId: number;
  detalles: CreateVentaDetalleDto[];
}

export interface VentaDetalleResponseDto {
  ventaDetalleId: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface VentaResponseDto {
  ventaId: number;
  sucursalId: number;
  sucursalNombre: string;
  empleadoId: number;
  empleadoNombre: string;
  clienteId?: number | null;
  clienteNombre?: string;
  tipoImpuestoId: number;
  tipoImpuestoDescripcion: string;
  tipoImpuestoPorcentaje: number;
  fechaHora: string;
  subtotal: number;
  totalImpuestos: number;
  total: number;
  estatus: string;
  detalles: VentaDetalleResponseDto[];
}

export interface ActualizarStockDto {
  sucursalId: number;
  productoId: number;
  cantidad: number;
  operacion: 'reabastecer' | 'fijar';
}

export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
}

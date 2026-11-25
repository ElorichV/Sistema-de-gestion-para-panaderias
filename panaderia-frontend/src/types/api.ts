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

export interface CreateCompraDto {
  proveedorId: number;
  sucursalId: number;
  empleadoId: number;
  fechaRecepcion?: string;
  detalles: {
    productoId: number;
    cantidad: number;
    costoUnitario: number;
  }[];
}

export interface CompraResponseDto {
  compraId: number;
  proveedorId: number;
  proveedorNombre: string;
  proveedorRfc: string;
  sucursalId: number;
  sucursalNombre: string;
  empleadoId: number;
  empleadoNombre: string;
  fechaRecepcion: string;
  total: number;
  detalles: {
    compraDetalleId: number;
    productoId: number;
    productoNombre: string;
    unidadMedida: string;
    cantidad: number;
    costoUnitario: number;
    subtotal: number;
  }[];
}

export interface ActualizarStockDto {
  sucursalId: number;
  productoId: number;
  cantidad: number;
  operacion: 'reabastecer' | 'fijar';
}

export interface SucursalDto {
  sucursalId: number;
  nombre: string;
  direccion?: string | null;
  totalEmpleados: number;
  skusEnInventario: number;
}

export interface EmpleadoDto {
  empleadoId: number;
  nombreCompleto: string;
  puestoId: number;
  puestoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  fechaContratacion: string;
}

export interface ProveedorDto {
  proveedorId: number;
  nombreFiscal: string;
  rfc: string;
  nombreContacto?: string | null;
  totalComprasHistoricas: number;
}

export interface LookupItemDto {
  id: number;
  nombre: string;
  extra?: string | null;
  valorNumerico?: number | null;
}

export interface CatalogosBundleDto {
  sucursales: SucursalDto[];
  empleados: EmpleadoDto[];
  proveedores: ProveedorDto[];
  puestos: LookupItemDto[];
  tiposCliente: LookupItemDto[];
  tiposProducto: LookupItemDto[];
  unidadesMedida: LookupItemDto[];
  tiposImpuesto: LookupItemDto[];
}

export interface TableMetricDto {
  tableName: string;
  domainGroup: string;
  rowCount: number;
  primaryKey: string;
  indexesAndConstraints: string[];
  description: string;
}

export interface DatabaseTelemetryDto {
  databaseName: string;
  engine: string;
  totalTables: number;
  totalRowsGlobal: number;
  primeraOperacion?: string | null;
  ultimaOperacion?: string | null;
  mesesOperacion: number;
  totalVentasHistoricas: number;
  totalLineasDetalleVenta: number;
  totalOrdenesCompra: number;
  ingresosBrutosHistoricos: number;
  comprasAcumuladas: number;
  valorInventarioActual: number;
  tables: TableMetricDto[];
}

export interface MonthlyMetricDto {
  periodo: string;
  anio: number;
  mes: number;
  ingresos: number;
  compras: number;
  margenBruto: number;
  tickets: number;
}

export interface BranchMetricDto {
  sucursalId: number;
  sucursalNombre: string;
  ingresos: number;
  tickets: number;
  ticketPromedio: number;
  unidadesEnStock: number;
}

export interface TopProductoMetricDto {
  productoId: number;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresos: number;
  margenPorcentaje: number;
}

export interface CategoryMetricDto {
  categoria: string;
  ingresos: number;
  unidades: number;
}

export interface DatabaseAnalyticsDto {
  serieMensual: MonthlyMetricDto[];
  rendimientoSucursales: BranchMetricDto[];
  topProductos: TopProductoMetricDto[];
  distribucionCategorias: CategoryMetricDto[];
}

export interface EndpointExecutionResult {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number;
  latencyMs: number;
  source: 'live-sql' | 'portfolio-snapshot';
  requestBody?: unknown;
  responseBody: unknown;
  timestamp: string;
  sqlTrace: string[];
}

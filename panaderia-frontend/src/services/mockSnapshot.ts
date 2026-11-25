import {
  CatalogosBundleDto,
  Cliente,
  CompraResponseDto,
  DatabaseAnalyticsDto,
  DatabaseTelemetryDto,
  InventarioItem,
  MonthlyMetricDto,
  Producto,
} from '../types/api';

export interface TableTechnicalSpec {
  ddl: string;
  efFluent: string;
  sargableTip: string;
  relations: string[];
}

export const SCHEMA_SPECS: Record<string, TableTechnicalSpec> = {
  Ventas: {
    ddl: `CREATE TABLE Ventas (
  VentaID INT PRIMARY KEY IDENTITY(1,1),
  SucursalID INT NOT NULL REFERENCES Sucursales(SucursalID),
  EmpleadoID INT NOT NULL REFERENCES Empleados(EmpleadoID),
  ClienteID INT NULL REFERENCES Clientes(ClienteID),
  TipoImpuestoID INT NOT NULL REFERENCES TipoImpuesto(TipoImpuestoID),
  FechaHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Subtotal DECIMAL(12,2) NOT NULL,
  TotalImpuestos DECIMAL(12,2) NOT NULL,
  Total DECIMAL(12,2) NOT NULL,
  Estatus VARCHAR(20) NOT NULL DEFAULT 'Completada'
);`,
    efFluent: `CREATE NONCLUSTERED INDEX IX_Ventas_FechaHora_Sucursal
ON dbo.Ventas (FechaHora, SucursalID)
INCLUDE (Total, Subtotal, TotalImpuestos, Estatus, ClienteID);`,
    sargableTip: 'Filtros SARGables por rango (FechaHora >= @ini AND FechaHora < @fin) activan Index Seek directo sin escanear las ~15,600 cabeceras.',
    relations: ['Sucursales (N:1)', 'Empleados (N:1)', 'Clientes (N:1)', 'TipoImpuesto (N:1)', 'VentaDetalle (1:N)'],
  },
  VentaDetalle: {
    ddl: `CREATE TABLE VentaDetalle (
  VentaDetalleID INT PRIMARY KEY IDENTITY(1,1),
  VentaID INT NOT NULL REFERENCES Ventas(VentaID),
  ProductoID INT NOT NULL REFERENCES Productos(ProductoID),
  Cantidad DECIMAL(10,3) NOT NULL,
  PrecioUnitario DECIMAL(10,2) NOT NULL,
  Importe AS (Cantidad * PrecioUnitario) -- Columna Calculada
);`,
    efFluent: `entity.Property(e => e.Importe)
  .HasComputedColumnSql("([Cantidad]*[PrecioUnitario])", false)
  .HasColumnType("decimal(21, 5)");`,
    sargableTip: 'Columna calculada en el motor SQL evita discrepancias aritméticas entre aplicación y reportes financieros sobre +42,000 partidas.',
    relations: ['Ventas (N:1)', 'Productos (N:1)'],
  },
  Inventario: {
    ddl: `CREATE TABLE Inventario (
  InventarioID INT PRIMARY KEY IDENTITY(1,1),
  SucursalID INT NOT NULL REFERENCES Sucursales(SucursalID),
  ProductoID INT NOT NULL REFERENCES Productos(ProductoID),
  CantidadStock DECIMAL(12,3) NOT NULL DEFAULT 0.00,
  CONSTRAINT UQ_Inventario_Producto_Sucursal UNIQUE(SucursalID, ProductoID)
);`,
    efFluent: `entity.HasIndex(e => new { e.SucursalId, e.ProductoId },
  "UQ_Inventario_Producto_Sucursal").IsUnique();`,
    sargableTip: 'Índice único compuesto garantiza O(log N) durante el bloqueo de fila en BeginTransactionAsync() al descontar pan o harinas.',
    relations: ['Sucursales (N:1)', 'Productos (N:1)'],
  },
  Compras: {
    ddl: `CREATE TABLE Compras (
  CompraID INT PRIMARY KEY IDENTITY(1,1),
  ProveedorID INT NOT NULL REFERENCES Proveedores(ProveedorID),
  SucursalID INT NOT NULL REFERENCES Sucursales(SucursalID),
  EmpleadoID INT NOT NULL REFERENCES Empleados(EmpleadoID),
  FechaRecepcion DATE NOT NULL,
  Total DECIMAL(12,2) NOT NULL
);`,
    efFluent: `CREATE NONCLUSTERED INDEX IX_Compras_FechaRecepcion_Sucursal
ON dbo.Compras (FechaRecepcion, SucursalID)
INCLUDE (Total, ProveedorID);`,
    sargableTip: 'Cada recepción ejecuta una transacción ACID que incrementa Inventario y recalcula el Costo Promedio Ponderado del insumo.',
    relations: ['Proveedores (N:1)', 'Sucursales (N:1)', 'Empleados (N:1)', 'CompraDetalle (1:N)'],
  },
  CompraDetalle: {
    ddl: `CREATE TABLE CompraDetalle (
  CompraDetalleID INT PRIMARY KEY IDENTITY(1,1),
  CompraID INT NOT NULL REFERENCES Compras(CompraID),
  ProductoID INT NOT NULL REFERENCES Productos(ProductoID),
  Cantidad DECIMAL(10,3) NOT NULL,
  CostoUnitario DECIMAL(10,2) NOT NULL
);`,
    efFluent: `NuevoCosto = ((StockActual * CostoPromedio) + (Cantidad * CostoUnitario)) / (StockActual + Cantidad);`,
    sargableTip: 'Trazabilidad histórica de inflación en harinas de fuerza, mantequillas de Normandía y cacao tabasqueño a 36 meses.',
    relations: ['Compras (N:1)', 'Productos (N:1)'],
  },
  Productos: {
    ddl: `CREATE TABLE Productos (
  ProductoID INT PRIMARY KEY IDENTITY(1,1),
  Nombre VARCHAR(150) NOT NULL,
  TipoProductoID INT NOT NULL REFERENCES TipoProducto(TipoProductoID),
  UnidadMedidaID INT NOT NULL REFERENCES UnidadMedida(UnidadMedidaID),
  PrecioVenta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CostoPromedio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  EsVendible BIT NOT NULL DEFAULT 1,
  EsInsumo BIT NOT NULL DEFAULT 0
);`,
    efFluent: `// Soft Delete preservando integridad referencial histórica:
producto.EsVendible = false;`,
    sargableTip: 'Modelo dual: separa productos de vitrina (EsVendible=1) de materias primas puras de obrador (EsInsumo=1, ej. Bultos W320).',
    relations: ['TipoProducto (N:1)', 'UnidadMedida (N:1)', 'Inventario (1:N)', 'VentaDetalle (1:N)', 'CompraDetalle (1:N)'],
  },
};

export const SNAPSHOT_PRODUCTOS: Producto[] = [
  { productoId: 1, nombre: 'Concha Vainilla de Papantla', descripcion: 'Brioche fermentado 12h con costra crujiente de vainilla natural en vaina', tipoProductoId: 1, tipoProductoNombre: 'Pan Dulce Tradicional', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 18, costoPromedio: 6.2, esVendible: true, esInsumo: false, stockTotal: 295 },
  { productoId: 2, nombre: 'Concha Cacao Real Tabasqueño', descripcion: 'Masa enriquecida con mantequilla y costra de cacao tostado al metate', tipoProductoId: 1, tipoProductoNombre: 'Pan Dulce Tradicional', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 18.5, costoPromedio: 6.6, esVendible: true, esInsumo: false, stockTotal: 260 },
  { productoId: 5, nombre: 'Rol de Canela Ceilán & Nuez', descripcion: 'Espiral tierna con canela recién molida, nuez pecana y glaseado de queso crema', tipoProductoId: 1, tipoProductoNombre: 'Pan Dulce Tradicional', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 32, costoPromedio: 11.4, esVendible: true, esInsumo: false, stockTotal: 190 },
  { productoId: 9, nombre: 'Pan de Muerto Azahar & Naranja', descripcion: 'Receta ceremonial con ralladura de naranja agria, agua de azahar y mantequilla', tipoProductoId: 1, tipoProductoNombre: 'Pan Dulce Tradicional', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 38, costoPromedio: 13.5, esVendible: true, esInsumo: false, stockTotal: 215 },
  { productoId: 10, nombre: 'Rosca de Reyes Artesanal Familiar', descripcion: 'Rosca ovalada para 10 personas con ate, higo cristalizado y costra de almendra', tipoProductoId: 1, tipoProductoNombre: 'Pan Dulce Tradicional', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 420, costoPromedio: 155, esVendible: true, esInsumo: false, stockTotal: 140 },
  { productoId: 11, nombre: 'Bolillo de Horno de Piedra', descripcion: 'Corteza crepitante al vapor y miga algodonosa horneada sobre piso volcánico', tipoProductoId: 2, tipoProductoNombre: 'Masa Madre & Salado', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 7.5, costoPromedio: 2.2, esVendible: true, esInsumo: false, stockTotal: 980 },
  { productoId: 13, nombre: 'Baguette Rústica Masa Madre 24h', descripcion: 'Fermentación en frío con harina fuerza W320, alvéolo abierto y corteza dorada', tipoProductoId: 2, tipoProductoNombre: 'Masa Madre & Salado', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 34, costoPromedio: 10.8, esVendible: true, esInsumo: false, stockTotal: 245 },
  { productoId: 14, nombre: 'Hogaza Campesina Centeno & Semillas', descripcion: 'Pan redondo de 850g con masa madre centeno, linaza, girasol y ajonjolí tostado', tipoProductoId: 2, tipoProductoNombre: 'Masa Madre & Salado', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 78, costoPromedio: 26, esVendible: true, esInsumo: false, stockTotal: 165 },
  { productoId: 16, nombre: 'Croissant Francés Puro Isigny', descripcion: 'Hojaldre alveolado en panal con mantequilla cultivada, crujiente y etéreo', tipoProductoId: 2, tipoProductoNombre: 'Masa Madre & Salado', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 36, costoPromedio: 12.9, esVendible: true, esInsumo: false, stockTotal: 148 },
  { productoId: 19, nombre: 'Pastel Tres Leches Imperial 2kg', descripcion: 'Bizcocho genovesa bañado en infusión de tres leches con vainilla en vaina', tipoProductoId: 3, tipoProductoNombre: 'Alta Repostería', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 440, costoPromedio: 168, esVendible: true, esInsumo: false, stockTotal: 92 },
  { productoId: 22, nombre: 'Cheesecake Vasco Tostado', descripcion: 'Interior cremoso y superficie caramelizada a alta temperatura estilo San Sebastián', tipoProductoId: 3, tipoProductoNombre: 'Alta Repostería', unidadMedidaId: 8, unidadMedidaNombre: 'Rebanada', unidadMedidaAbreviatura: 'reb', precioVenta: 72, costoPromedio: 26.5, esVendible: true, esInsumo: false, stockTotal: 112 },
  { productoId: 23, nombre: 'Milhojas de Vainilla & Caramelo', descripcion: 'Tres capas de hojaldre invertido caramelizado con crema diplomata de vainilla', tipoProductoId: 3, tipoProductoNombre: 'Alta Repostería', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 65, costoPromedio: 22.8, esVendible: true, esInsumo: false, stockTotal: 128 },
  { productoId: 25, nombre: 'Éclair Praliné de Avellana', descripcion: 'Pasta choux rellena de muselina de avellana tostada y glaseado espejo', tipoProductoId: 3, tipoProductoNombre: 'Alta Repostería', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 58, costoPromedio: 20.4, esVendible: true, esInsumo: false, stockTotal: 98 },
  { productoId: 27, nombre: 'Café de Olla Especiado 12oz', descripcion: 'Grano de altura Soconusco infusionado con piloncillo, canela, clavo y naranja', tipoProductoId: 4, tipoProductoNombre: 'Barra Espresso Caliente', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 36, costoPromedio: 8.2, esVendible: true, esInsumo: false, stockTotal: 310 },
  { productoId: 30, nombre: 'Chocolate Caliente de Metate 12oz', descripcion: 'Tablilla artesanal batida con molinillo en leche entera caliente', tipoProductoId: 4, tipoProductoNombre: 'Barra Espresso Caliente', unidadMedidaId: 1, unidadMedidaNombre: 'Pieza', unidadMedidaAbreviatura: 'pz', precioVenta: 52, costoPromedio: 15.8, esVendible: true, esInsumo: false, stockTotal: 270 },
  { productoId: 37, nombre: 'Harina Trigo Fuerza W320 (Bulto 44kg)', descripcion: 'Harina panadera alto contenido proteico 13.5% para masa madre y laminados', tipoProductoId: 8, tipoProductoNombre: 'Insumos Harinas Fuerza', unidadMedidaId: 6, unidadMedidaNombre: 'Bulto 44kg', unidadMedidaAbreviatura: 'bto', precioVenta: 0, costoPromedio: 580, esVendible: false, esInsumo: true, stockTotal: 195 },
  { productoId: 40, nombre: 'Mantequilla Fermentada 84% Grasa (Caja 10kg)', descripcion: 'Placas de mantequilla seca especial para tourage de croissant y milhojas', tipoProductoId: 9, tipoProductoNombre: 'Insumos Mantequillas & Grasas', unidadMedidaId: 5, unidadMedidaNombre: 'Caja', unidadMedidaAbreviatura: 'cj', precioVenta: 0, costoPromedio: 1850, esVendible: false, esInsumo: true, stockTotal: 132 },
  { productoId: 44, nombre: 'Vainilla Natural en Vaina Papantla (Paq 250g)', descripcion: 'Vainas gourmet húmedas de primera cosecha', tipoProductoId: 10, tipoProductoNombre: 'Insumos Fermentos & Aromas', unidadMedidaId: 4, unidadMedidaNombre: 'Paquete', unidadMedidaAbreviatura: 'pq', precioVenta: 0, costoPromedio: 1450, esVendible: false, esInsumo: true, stockTotal: 118 },
];

export const SNAPSHOT_CATALOGOS: CatalogosBundleDto = {
  sucursales: [
    { sucursalId: 1, nombre: 'Matriz Centro Histórico', direccion: 'Calle 5 de Mayo #123, Centro Histórico', totalEmpleados: 10, skusEnInventario: 48 },
    { sucursalId: 2, nombre: 'Tahona Norte Vallarta', direccion: 'Av. Vallarta #4500, Jardines del Bosque', totalEmpleados: 6, skusEnInventario: 48 },
    { sucursalId: 3, nombre: 'Obrador Sur Perisur', direccion: 'Blvd. Perisur #890, Insurgentes Sur', totalEmpleados: 5, skusEnInventario: 48 },
    { sucursalId: 4, nombre: 'Horno Este Independencia', direccion: 'Calz. Independencia #202, Zona Oriente', totalEmpleados: 5, skusEnInventario: 48 },
    { sucursalId: 5, nombre: 'Boutique Oeste Aviación', direccion: 'Av. Aviación #999, Valle Real', totalEmpleados: 4, skusEnInventario: 48 },
  ],
  empleados: [
    { empleadoId: 1, nombreCompleto: 'Angel Guerrero', puestoId: 1, puestoNombre: 'Maestro Tahonero Director', sucursalId: 1, sucursalNombre: 'Matriz Centro Histórico', fechaContratacion: '2021-01-15' },
    { empleadoId: 2, nombreCompleto: 'Axel Linares', puestoId: 2, puestoNombre: 'Gerente de Sucursal', sucursalId: 1, sucursalNombre: 'Matriz Centro Histórico', fechaContratacion: '2021-03-20' },
    { empleadoId: 8, nombreCompleto: 'Fernanda Orozco', puestoId: 2, puestoNombre: 'Gerente de Sucursal', sucursalId: 2, sucursalNombre: 'Tahona Norte Vallarta', fechaContratacion: '2021-06-15' },
    { empleadoId: 14, nombreCompleto: 'Gabriela Peñaloza', puestoId: 2, puestoNombre: 'Gerente de Sucursal', sucursalId: 3, sucursalNombre: 'Obrador Sur Perisur', fechaContratacion: '2021-11-01' },
  ],
  proveedores: [
    { proveedorId: 1, nombreFiscal: 'Molinos Harineros La Espiga Dorada SA', rfc: 'MHE900115AA1', nombreContacto: 'Ing. Mateo Villalobos', totalComprasHistoricas: 72 },
    { proveedorId: 9, nombreFiscal: 'Mantequillas Fermentadas Normandía MX', rfc: 'MFN910914II9', nombreContacto: 'Chef Luciana Beltrán', totalComprasHistoricas: 68 },
    { proveedorId: 7, nombreFiscal: 'Orquídeas y Vainilla de Papantla SPR', rfc: 'OVP930722GG7', nombreContacto: 'Mtra. Citlalli Tovar', totalComprasHistoricas: 65 },
    { proveedorId: 3, nombreFiscal: 'Finca Cafetalera Soconusco Altura SA', rfc: 'FCS770310CC3', nombreContacto: 'Don Emiliano Corzo', totalComprasHistoricas: 66 },
  ],
  puestos: [
    { id: 1, nombre: 'Maestro Tahonero Director' },
    { id: 2, nombre: 'Gerente de Sucursal' },
    { id: 3, nombre: 'Cajero Principal POS' },
    { id: 5, nombre: 'Jefe de Masa Madre' },
    { id: 7, nombre: 'Maestro Repostero' },
  ],
  tiposCliente: [
    { id: 1, nombre: 'Público Mostrador' },
    { id: 2, nombre: 'Convenio Restaurante' },
    { id: 3, nombre: 'Cadena Hotelera' },
    { id: 8, nombre: 'Cliente Ouroboros VIP' },
  ],
  tiposProducto: [
    { id: 1, nombre: 'Pan Dulce Tradicional' },
    { id: 2, nombre: 'Masa Madre & Salado' },
    { id: 3, nombre: 'Alta Repostería' },
    { id: 4, nombre: 'Barra Espresso Caliente' },
    { id: 8, nombre: 'Insumos Harinas Fuerza' },
  ],
  unidadesMedida: [
    { id: 1, nombre: 'Pieza', extra: 'pz' },
    { id: 2, nombre: 'Kilogramo', extra: 'kg' },
    { id: 6, nombre: 'Bulto 44kg', extra: 'bto' },
    { id: 8, nombre: 'Rebanada', extra: 'reb' },
  ],
  tiposImpuesto: [
    { id: 1, nombre: 'IVA General 16%', valorNumerico: 0.16 },
    { id: 2, nombre: 'Tasa Cero Panificación Básica 0%', valorNumerico: 0 },
    { id: 3, nombre: 'IEPS Alta Densidad Calórica 8%', valorNumerico: 0.08 },
  ],
};

export const SNAPSHOT_CLIENTES: Cliente[] = [
  { clienteId: 1, nombre: 'Mostrador General', rfc: 'XAXX010101000', email: 'mostrador@tanajara.mx', tipoClienteId: 1, tipoClienteNombre: 'Público Mostrador' },
  { clienteId: 2, nombre: 'Hotel Boutique Casa de Piedra', rfc: 'HBC180210AA1', email: 'compras@casadepiedra.mx', tipoClienteId: 3, tipoClienteNombre: 'Cadena Hotelera' },
  { clienteId: 3, nombre: 'Restaurante El Bajío Imperial', rfc: 'RBI150622BB2', email: 'chef@bajioimperial.com', tipoClienteId: 2, tipoClienteNombre: 'Convenio Restaurante' },
  { clienteId: 4, nombre: 'Cafetería La Brújula Tostadores', rfc: 'CBT190914CC3', email: 'barra@labrujula.cafe', tipoClienteId: 2, tipoClienteNombre: 'Convenio Restaurante' },
  { clienteId: 8, nombre: 'Bistró Francés Le Levain', rfc: 'BFL210319GG7', email: 'cuisine@lelevain.mx', tipoClienteId: 2, tipoClienteNombre: 'Convenio Restaurante' },
  { clienteId: 9, nombre: 'Club Ejecutivo Reforma', rfc: 'CER141128HH8', email: 'eventos@clubreforma.mx', tipoClienteId: 8, tipoClienteNombre: 'Cliente Ouroboros VIP' },
];

export function buildSnapshotInventario(): InventarioItem[] {
  const items: InventarioItem[] = [];
  let invId = 1;
  for (const suc of SNAPSHOT_CATALOGOS.sucursales) {
    for (const prod of SNAPSHOT_PRODUCTOS) {
      let stock = 34 + ((suc.sucursalId * 17 + prod.productoId * 9) % 60);
      if (suc.sucursalId === 1 && prod.productoId === 22) stock = 0;
      if (suc.sucursalId === 1 && prod.productoId === 25) stock = 0;
      if (suc.sucursalId === 1 && prod.productoId === 19) stock = 4;
      if (suc.sucursalId === 1 && prod.productoId === 16) stock = 7;
      if (suc.sucursalId === 1 && prod.productoId === 23) stock = 6;
      items.push({
        inventarioId: invId++,
        sucursalId: suc.sucursalId,
        sucursalNombre: suc.nombre,
        productoId: prod.productoId,
        productoNombre: prod.nombre,
        descripcion: prod.descripcion,
        tipoProductoNombre: prod.tipoProductoNombre,
        unidadMedida: prod.unidadMedidaAbreviatura,
        cantidadStock: stock,
        precioVenta: prod.precioVenta,
        esVendible: prod.esVendible,
        esInsumo: prod.esInsumo,
      });
    }
  }
  return items;
}

function build3YearMonthlySeries(): MonthlyMetricDto[] {
  const series: MonthlyMetricDto[] = [];
  for (let y = 2024; y <= 2026; y++) {
    const maxM = y === 2026 ? 11 : 12;
    const yearGrowth = y === 2024 ? 1 : y === 2025 ? 1.21 : 1.44;
    for (let m = 1; m <= maxM; m++) {
      const season =
        m === 1 ? 1.48 :
        m === 10 || m === 11 ? 1.42 :
        m === 12 ? 1.32 :
        m === 6 || m === 7 ? 0.91 : 1.05;
      const tickets = Math.round(315 * yearGrowth * season + ((y * 7 + m * 13) % 24));
      const ingresos = Math.round(tickets * (385 + (m % 5) * 14));
      const compras = Math.round(ingresos * (0.36 + ((m % 3) * 0.02)));
      series.push({
        periodo: `${y}-${String(m).padStart(2, '0')}`,
        anio: y,
        mes: m,
        ingresos,
        compras,
        margenBruto: ingresos - compras,
        tickets,
      });
    }
  }
  return series;
}

const FULL_SERIES = build3YearMonthlySeries();

export const SNAPSHOT_TELEMETRY: DatabaseTelemetryDto = {
  databaseName: 'PanaderiaDB',
  engine: 'Microsoft SQL Server · EF Core 8 (3FN + ACID)',
  totalTables: 15,
  totalRowsGlobal: 63503,
  primeraOperacion: '2024-01-01T07:12:00',
  ultimaOperacion: '2026-11-24T19:48:00',
  mesesOperacion: 35,
  totalVentasHistoricas: 15612,
  totalLineasDetalleVenta: 42152,
  totalOrdenesCompra: 1323,
  ingresosBrutosHistoricos: FULL_SERIES.reduce((s, x) => s + x.ingresos, 0),
  comprasAcumuladas: FULL_SERIES.reduce((s, x) => s + x.compras, 0),
  valorInventarioActual: 486920.5,
  tables: [
    { tableName: 'Ventas', domainGroup: 'Núcleo Transaccional ACID', rowCount: 15612, primaryKey: 'VentaID (INT IDENTITY)', indexesAndConstraints: ['PK_Ventas', 'IX_Ventas_FechaHora_Sucursal (INCLUDE Total, Estatus)', 'FK_Venta_Sucursal', 'FK_Venta_Empleado', 'FK_Venta_Cliente'], description: 'Cabecera maestra de tickets POS con cálculo fiscal e integridad transaccional.' },
    { tableName: 'VentaDetalle', domainGroup: 'Núcleo Transaccional ACID', rowCount: 42152, primaryKey: 'VentaDetalleID (INT IDENTITY)', indexesAndConstraints: ['PK_VentaDetalle', 'IX_VentaDetalle_ProductoID (INCLUDE Cantidad, PrecioUnitario)', 'COMPUTED: Importe AS (Cantidad * PrecioUnitario)'], description: 'Partidas individuales por ticket con columna calculada determinista en motor SQL.' },
    { tableName: 'Inventario', domainGroup: 'Núcleo Transaccional ACID', rowCount: 240, primaryKey: 'InventarioID (INT IDENTITY)', indexesAndConstraints: ['PK_Inventario', 'UQ_Inventario_Producto_Sucursal UNIQUE(SucursalID, ProductoID)'], description: 'Existencias en tiempo real de panes e insumos con bloqueo transaccional por sucursal.' },
    { tableName: 'Compras', domainGroup: 'Núcleo Transaccional ACID', rowCount: 1323, primaryKey: 'CompraID (INT IDENTITY)', indexesAndConstraints: ['PK_Compras', 'IX_Compras_FechaRecepcion_Sucursal', 'FK_Compra_Proveedor'], description: 'Órdenes de recepción de harinas de fuerza, mantequillas y cacao a proveedores.' },
    { tableName: 'CompraDetalle', domainGroup: 'Núcleo Transaccional ACID', rowCount: 3969, primaryKey: 'CompraDetalleID (INT IDENTITY)', indexesAndConstraints: ['PK_CompraDetalle', 'FK_CompraDetalle_Compra', 'FK_CompraDetalle_Producto'], description: 'Desglose de insumos recibidos que recalcula el Costo Promedio Ponderado.' },
    { tableName: 'Productos', domainGroup: 'Entidades Maestras', rowCount: 48, primaryKey: 'ProductoID (INT IDENTITY)', indexesAndConstraints: ['PK_Productos', 'DF_Producto_EsVendible', 'FK_Producto_Tipo', 'FK_Producto_Unidad'], description: 'Catálogo unificado de panadería artesanal, alta repostería, espresso y materias primas.' },
    { tableName: 'Clientes', domainGroup: 'Entidades Maestras', rowCount: 60, primaryKey: 'ClienteID (INT IDENTITY)', indexesAndConstraints: ['PK_Clientes', 'UQ_Cliente_Email UNIQUE(Email)', 'FK_Cliente_Tipo'], description: 'Cartera de mostrador, convenios B2B hoteles/restaurantes y clientes Ouroboros VIP.' },
    { tableName: 'Empleados', domainGroup: 'Entidades Maestras', rowCount: 30, primaryKey: 'EmpleadoID (INT IDENTITY)', indexesAndConstraints: ['PK_Empleados', 'FK_Empleado_Puesto', 'FK_Empleado_Sucursal'], description: 'Plantilla de maestros tahoneros, laminadores de hojaldre, baristas y cajeros.' },
    { tableName: 'Proveedores', domainGroup: 'Entidades Maestras', rowCount: 20, primaryKey: 'ProveedorID (INT IDENTITY)', indexesAndConstraints: ['PK_Proveedores', 'UQ_Proveedor_RFC UNIQUE(RFC)'], description: 'Padrón fiscal de molinos harineros, cuencas lecheras y fincas cafetaleras.' },
    { tableName: 'Sucursales', domainGroup: 'Catálogos Lookup', rowCount: 5, primaryKey: 'SucursalID (INT IDENTITY)', indexesAndConstraints: ['PK_Sucursales'], description: 'Cinco hornos y puntos de despacho activos de Panificadora Tanajara.' },
    { tableName: 'Puestos', domainGroup: 'Catálogos Lookup', rowCount: 15, primaryKey: 'PuestoID (INT IDENTITY)', indexesAndConstraints: ['PK_Puestos'], description: 'Roles operativos de obrador, barra y contraloría.' },
    { tableName: 'TipoProducto', domainGroup: 'Catálogos Lookup', rowCount: 10, primaryKey: 'TipoProductoID (INT IDENTITY)', indexesAndConstraints: ['PK_TipoProducto'], description: 'Familias técnicas de panificación e insumos.' },
    { tableName: 'TipoCliente', domainGroup: 'Catálogos Lookup', rowCount: 8, primaryKey: 'TipoClienteID (INT IDENTITY)', indexesAndConstraints: ['PK_TipoCliente'], description: 'Segmentación comercial B2C / B2B.' },
    { tableName: 'UnidadMedida', domainGroup: 'Catálogos Lookup', rowCount: 8, primaryKey: 'UnidadMedidaID (INT IDENTITY)', indexesAndConstraints: ['PK_UnidadMedida'], description: 'Magnitudes de receta y almacén (pz, kg, bto, cj, reb).' },
    { tableName: 'TipoImpuesto', domainGroup: 'Catálogos Lookup', rowCount: 3, primaryKey: 'TipoImpuestoID (INT IDENTITY)', indexesAndConstraints: ['PK_TipoImpuesto'], description: 'Tasas fiscales parametrizadas (IVA 16%, Tasa 0%, IEPS 8%).' },
  ],
};

export function getSnapshotAnalytics(anio?: number | null, sucursalId?: number | null): DatabaseAnalyticsDto {
  const branchFactor =
    !sucursalId ? 1 :
    sucursalId === 1 ? 0.30 :
    sucursalId === 2 ? 0.22 :
    sucursalId === 3 ? 0.19 :
    sucursalId === 4 ? 0.16 : 0.13;

  const serieMensual = FULL_SERIES
    .filter((m) => !anio || m.anio === anio)
    .map((m) => ({
      ...m,
      ingresos: Math.round(m.ingresos * branchFactor),
      compras: Math.round(m.compras * branchFactor),
      margenBruto: Math.round(m.margenBruto * branchFactor),
      tickets: Math.max(1, Math.round(m.tickets * branchFactor)),
    }));

  const yearScale = !anio ? 1 : anio === 2024 ? 0.27 : anio === 2025 ? 0.34 : 0.39;

  return {
    serieMensual,
    rendimientoSucursales: [
      { sucursalId: 1, sucursalNombre: 'Matriz Centro Histórico', ingresos: Math.round(1895400 * yearScale), tickets: Math.round(4680 * yearScale), ticketPromedio: 405.0, unidadesEnStock: 2680 },
      { sucursalId: 2, sucursalNombre: 'Tahona Norte Vallarta', ingresos: Math.round(1420800 * yearScale), tickets: Math.round(3490 * yearScale), ticketPromedio: 407.1, unidadesEnStock: 2410 },
      { sucursalId: 3, sucursalNombre: 'Obrador Sur Perisur', ingresos: Math.round(1210600 * yearScale), tickets: Math.round(2980 * yearScale), ticketPromedio: 406.2, unidadesEnStock: 2290 },
      { sucursalId: 4, sucursalNombre: 'Horno Este Independencia', ingresos: Math.round(995200 * yearScale), tickets: Math.round(2490 * yearScale), ticketPromedio: 399.7, unidadesEnStock: 2150 },
      { sucursalId: 5, sucursalNombre: 'Boutique Oeste Aviación', ingresos: Math.round(812400 * yearScale), tickets: Math.round(1972 * yearScale), ticketPromedio: 412.0, unidadesEnStock: 2040 },
    ],
    topProductos: [
      { productoId: 10, nombre: 'Rosca de Reyes Artesanal Familiar', categoria: 'Pan Dulce Tradicional', unidadesVendidas: Math.round(2480 * yearScale * branchFactor), ingresos: Math.round(1041600 * yearScale * branchFactor), margenPorcentaje: 63.1 },
      { productoId: 19, nombre: 'Pastel Tres Leches Imperial 2kg', categoria: 'Alta Repostería', unidadesVendidas: Math.round(2120 * yearScale * branchFactor), ingresos: Math.round(932800 * yearScale * branchFactor), margenPorcentaje: 61.8 },
      { productoId: 9, nombre: 'Pan de Muerto Azahar & Naranja', categoria: 'Pan Dulce Tradicional', unidadesVendidas: Math.round(18900 * yearScale * branchFactor), ingresos: Math.round(718200 * yearScale * branchFactor), margenPorcentaje: 64.5 },
      { productoId: 13, nombre: 'Baguette Rústica Masa Madre 24h', categoria: 'Masa Madre & Salado', unidadesVendidas: Math.round(16400 * yearScale * branchFactor), ingresos: Math.round(557600 * yearScale * branchFactor), margenPorcentaje: 68.2 },
      { productoId: 16, nombre: 'Croissant Francés Puro Isigny', categoria: 'Masa Madre & Salado', unidadesVendidas: Math.round(14200 * yearScale * branchFactor), ingresos: Math.round(511200 * yearScale * branchFactor), margenPorcentaje: 64.2 },
      { productoId: 29, nombre: 'Cappuccino Texturizado 12oz', categoria: 'Barra Espresso Caliente', unidadesVendidas: Math.round(9800 * yearScale * branchFactor), ingresos: Math.round(470400 * yearScale * branchFactor), margenPorcentaje: 74.2 },
      { productoId: 14, nombre: 'Hogaza Campesina Centeno & Semillas', categoria: 'Masa Madre & Salado', unidadesVendidas: Math.round(5400 * yearScale * branchFactor), ingresos: Math.round(421200 * yearScale * branchFactor), margenPorcentaje: 66.7 },
      { productoId: 1, nombre: 'Concha Vainilla de Papantla', categoria: 'Pan Dulce Tradicional', unidadesVendidas: Math.round(21500 * yearScale * branchFactor), ingresos: Math.round(387000 * yearScale * branchFactor), margenPorcentaje: 65.6 },
    ],
    distribucionCategorias: [
      { categoria: 'Pan Dulce Tradicional', ingresos: Math.round(2290000 * yearScale * branchFactor), unidades: Math.round(68000 * yearScale * branchFactor) },
      { categoria: 'Alta Repostería', ingresos: Math.round(1680000 * yearScale * branchFactor), unidades: Math.round(21400 * yearScale * branchFactor) },
      { categoria: 'Masa Madre & Salado', ingresos: Math.round(1390000 * yearScale * branchFactor), unidades: Math.round(94000 * yearScale * branchFactor) },
      { categoria: 'Barra Espresso Caliente', ingresos: Math.round(620000 * yearScale * branchFactor), unidades: Math.round(14200 * yearScale * branchFactor) },
      { categoria: 'Bebidas Frías & Infusiones', ingresos: Math.round(354400 * yearScale * branchFactor), unidades: Math.round(6900 * yearScale * branchFactor) },
    ],
  };
}

export const SNAPSHOT_COMPRAS: CompraResponseDto[] = [
  {
    compraId: 1323,
    proveedorId: 1,
    proveedorNombre: 'Molinos Harineros La Espiga Dorada SA',
    proveedorRfc: 'MHE900115AA1',
    sucursalId: 1,
    sucursalNombre: 'Matriz Centro Histórico',
    empleadoId: 7,
    empleadoNombre: 'Marcos Zavaleta',
    fechaRecepcion: '2026-11-24',
    total: 18420.0,
    detalles: [
      { compraDetalleId: 3967, productoId: 37, productoNombre: 'Harina Trigo Fuerza W320 (Bulto 44kg)', unidadMedida: 'bto', cantidad: 14, costoUnitario: 580, subtotal: 8120 },
      { compraDetalleId: 3968, productoId: 40, productoNombre: 'Mantequilla Fermentada 84% Grasa (Caja 10kg)', unidadMedida: 'cj', cantidad: 4, costoUnitario: 1850, subtotal: 7400 },
      { compraDetalleId: 3969, productoId: 44, productoNombre: 'Vainilla Natural en Vaina Papantla (Paq 250g)', unidadMedida: 'pq', cantidad: 2, costoUnitario: 1450, subtotal: 2900 },
    ],
  },
  {
    compraId: 1322,
    proveedorId: 3,
    proveedorNombre: 'Finca Cafetalera Soconusco Altura SA',
    proveedorRfc: 'FCS770310CC3',
    sucursalId: 2,
    sucursalNombre: 'Tahona Norte Vallarta',
    empleadoId: 8,
    empleadoNombre: 'Fernanda Orozco',
    fechaRecepcion: '2026-11-22',
    total: 13800.0,
    detalles: [
      { compraDetalleId: 3964, productoId: 45, productoNombre: 'Café en Grano Soconusco Tueste Medio (Saco 15kg)', unidadMedida: 'bto', cantidad: 4, costoUnitario: 3450, subtotal: 13800 },
    ],
  },
];

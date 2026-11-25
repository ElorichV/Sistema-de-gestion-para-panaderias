using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Infrastructure.Persistence.Contexts;

namespace Panaderia.Infrastructure.Persistence.Repositories
{
    public class DatabaseInsightService : IDatabaseInsightService
    {
        private readonly PanaderiaDbContext _context;

        public DatabaseInsightService(PanaderiaDbContext context)
        {
            _context = context;
        }

        public async Task<DatabaseTelemetryDto> ObtenerTelemetriaEsquemaAsync()
        {
            var cntSucursales = await _context.Sucursales.CountAsync();
            var cntPuestos = await _context.Puestos.CountAsync();
            var cntTipoCliente = await _context.TipoClientes.CountAsync();
            var cntTipoProducto = await _context.TipoProductos.CountAsync();
            var cntUnidadMedida = await _context.UnidadMedida.CountAsync();
            var cntTipoImpuesto = await _context.TipoImpuestos.CountAsync();
            var cntProveedores = await _context.Proveedores.CountAsync();
            var cntEmpleados = await _context.Empleados.CountAsync();
            var cntClientes = await _context.Clientes.CountAsync();
            var cntProductos = await _context.Productos.CountAsync();
            var cntInventario = await _context.Inventarios.CountAsync();
            var cntVentas = await _context.Ventas.CountAsync();
            var cntVentaDetalle = await _context.VentaDetalles.CountAsync();
            var cntCompras = await _context.Compras.CountAsync();
            var cntCompraDetalle = await _context.CompraDetalles.CountAsync();

            var primeraVenta = await _context.Ventas.AsNoTracking().MinAsync(v => (DateTime?)v.FechaHora);
            var ultimaVenta = await _context.Ventas.AsNoTracking().MaxAsync(v => (DateTime?)v.FechaHora);

            var ingresosBrutos = await _context.Ventas
                .AsNoTracking()
                .Where(v => v.Estatus == "Completada")
                .SumAsync(v => (decimal?)v.Total) ?? 0m;

            var comprasTotales = await _context.Compras
                .AsNoTracking()
                .SumAsync(c => (decimal?)c.Total) ?? 0m;

            var valorInventario = await _context.Inventarios
                .AsNoTracking()
                .SumAsync(i => (decimal?)(i.CantidadStock * i.Producto.CostoPromedio)) ?? 0m;

            var tables = new List<TableMetricDto>
            {
                new() { TableName = "Ventas", DomainGroup = "Núcleo Transaccional ACID", RowCount = cntVentas, PrimaryKey = "VentaID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Ventas", "IX_Ventas_FechaHora_Sucursal (INCLUDE Total, Estatus)", "FK_Venta_Sucursal", "FK_Venta_Empleado", "FK_Venta_Cliente", "FK_Venta_Impuesto" }, Description = "Cabecera maestra de tickets POS con cálculo fiscal e integridad transaccional." },
                new() { TableName = "VentaDetalle", DomainGroup = "Núcleo Transaccional ACID", RowCount = cntVentaDetalle, PrimaryKey = "VentaDetalleID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_VentaDetalle", "IX_VentaDetalle_ProductoID (INCLUDE Cantidad, PrecioUnitario)", "COMPUTED: Importe AS (Cantidad * PrecioUnitario)", "FK_VentaDetalle_Venta", "FK_VentaDetalle_Producto" }, Description = "Partidas individuales por ticket con columna calculada determinista en motor SQL." },
                new() { TableName = "Inventario", DomainGroup = "Núcleo Transaccional ACID", RowCount = cntInventario, PrimaryKey = "InventarioID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Inventario", "UQ_Inventario_Producto_Sucursal UNIQUE(SucursalID, ProductoID)", "FK_Inventario_Sucursal", "FK_Inventario_Producto" }, Description = "Existencias en tiempo real de panes e insumos con bloqueo optimista/transaccional por sucursal." },
                new() { TableName = "Compras", DomainGroup = "Núcleo Transaccional ACID", RowCount = cntCompras, PrimaryKey = "CompraID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Compras", "IX_Compras_FechaRecepcion_Sucursal", "FK_Compra_Proveedor", "FK_Compra_Sucursal", "FK_Compra_Empleado" }, Description = "Órdenes de recepción de harinas, mantequillas, lácteos y empaques a proveedores." },
                new() { TableName = "CompraDetalle", DomainGroup = "Núcleo Transaccional ACID", RowCount = cntCompraDetalle, PrimaryKey = "CompraDetalleID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_CompraDetalle", "FK_CompraDetalle_Compra", "FK_CompraDetalle_Producto" }, Description = "Desglose de insumos recibidos que recalcula el Costo Promedio Ponderado." },
                new() { TableName = "Productos", DomainGroup = "Entidades Maestras", RowCount = cntProductos, PrimaryKey = "ProductoID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Productos", "DF_Producto_EsVendible", "FK_Producto_Tipo", "FK_Producto_Unidad" }, Description = "Catálogo unificado de panadería artesanal, repostería, cafetería y materias primas." },
                new() { TableName = "Clientes", DomainGroup = "Entidades Maestras", RowCount = cntClientes, PrimaryKey = "ClienteID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Clientes", "UQ_Cliente_Email UNIQUE(Email)", "FK_Cliente_Tipo" }, Description = "Cartera de clientes de mostrador, convenios B2B, hoteles, cafeterías y VIP." },
                new() { TableName = "Empleados", DomainGroup = "Entidades Maestras", RowCount = cntEmpleados, PrimaryKey = "EmpleadoID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Empleados", "FK_Empleado_Puesto", "FK_Empleado_Sucursal" }, Description = "Plantilla de maestros tahoneros, reposteros, baristas, cajeros y encargados." },
                new() { TableName = "Proveedores", DomainGroup = "Entidades Maestras", RowCount = cntProveedores, PrimaryKey = "ProveedorID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Proveedores", "UQ_Proveedor_RFC UNIQUE(RFC)" }, Description = "Padrón fiscal de molinos harineros, cuencas lecheras y tostadores de café." },
                new() { TableName = "Sucursales", DomainGroup = "Catálogos Lookup", RowCount = cntSucursales, PrimaryKey = "SucursalID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Sucursales" }, Description = "Puntos de horneado y venta activa de la cadena Panificadora Tanajara." },
                new() { TableName = "Puestos", DomainGroup = "Catálogos Lookup", RowCount = cntPuestos, PrimaryKey = "PuestoID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_Puestos" }, Description = "Roles operativos y administrativos de panadería." },
                new() { TableName = "TipoProducto", DomainGroup = "Catálogos Lookup", RowCount = cntTipoProducto, PrimaryKey = "TipoProductoID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_TipoProducto" }, Description = "Familias de panificación (Pan Dulce, Masa Madre, Repostería, Insumos)." },
                new() { TableName = "TipoCliente", DomainGroup = "Catálogos Lookup", RowCount = cntTipoCliente, PrimaryKey = "TipoClienteID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_TipoCliente" }, Description = "Segmentación comercial y convenios corporativos." },
                new() { TableName = "UnidadMedida", DomainGroup = "Catálogos Lookup", RowCount = cntUnidadMedida, PrimaryKey = "UnidadMedidaID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_UnidadMedida" }, Description = "Magnitudes físicas de receta y despacho (pz, kg, bto, lt, reb)." },
                new() { TableName = "TipoImpuesto", DomainGroup = "Catálogos Lookup", RowCount = cntTipoImpuesto, PrimaryKey = "TipoImpuestoID (INT IDENTITY)", IndexesAndConstraints = new() { "PK_TipoImpuesto" }, Description = "Tasas fiscales parametrizadas (IVA 16%, Tasa 0% alimentos básicos, IEPS 8%)." }
            };

            var mesesOperacion = 0;
            if (primeraVenta.HasValue && ultimaVenta.HasValue)
            {
                mesesOperacion = ((ultimaVenta.Value.Year - primeraVenta.Value.Year) * 12) + ultimaVenta.Value.Month - primeraVenta.Value.Month + 1;
            }

            return new DatabaseTelemetryDto
            {
                DatabaseName = _context.Database.GetDbConnection().Database,
                Engine = "Microsoft SQL Server · EF Core 8 (3FN + ACID)",
                TotalTables = tables.Count,
                TotalRowsGlobal = tables.Sum(t => (long)t.RowCount),
                PrimeraOperacion = primeraVenta,
                UltimaOperacion = ultimaVenta,
                MesesOperacion = mesesOperacion,
                TotalVentasHistoricas = cntVentas,
                TotalLineasDetalleVenta = cntVentaDetalle,
                TotalOrdenesCompra = cntCompras,
                IngresosBrutosHistoricos = Math.Round(ingresosBrutos, 2),
                ComprasAcumuladas = Math.Round(comprasTotales, 2),
                ValorInventarioActual = Math.Round(valorInventario, 2),
                Tables = tables
            };
        }

        public async Task<DatabaseAnalyticsDto> ObtenerAnaliticaHistoricaAsync(int? anio = null, int? sucursalId = null)
        {
            var ventasQuery = _context.Ventas
                .AsNoTracking()
                .Where(v => v.Estatus == "Completada");

            var comprasQuery = _context.Compras.AsNoTracking();

            // SARGable date filters (evita YEAR() en WHERE para aprovechar índices)
            if (anio.HasValue && anio.Value >= 2000)
            {
                var inicioDt = new DateTime(anio.Value, 1, 1);
                var finDt = new DateTime(anio.Value + 1, 1, 1);
                ventasQuery = ventasQuery.Where(v => v.FechaHora >= inicioDt && v.FechaHora < finDt);

                var inicioDate = new DateOnly(anio.Value, 1, 1);
                var finDate = new DateOnly(anio.Value + 1, 1, 1);
                comprasQuery = comprasQuery.Where(c => c.FechaRecepcion >= inicioDate && c.FechaRecepcion < finDate);
            }

            if (sucursalId.HasValue && sucursalId.Value > 0)
            {
                ventasQuery = ventasQuery.Where(v => v.SucursalId == sucursalId.Value);
                comprasQuery = comprasQuery.Where(c => c.SucursalId == sucursalId.Value);
            }

            var ventasPorMes = await ventasQuery
                .GroupBy(v => new { v.FechaHora.Year, v.FechaHora.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Ingresos = g.Sum(x => x.Total),
                    Tickets = g.Count()
                })
                .ToListAsync();

            var comprasPorMes = await comprasQuery
                .GroupBy(c => new { c.FechaRecepcion.Year, c.FechaRecepcion.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Compras = g.Sum(x => x.Total)
                })
                .ToListAsync();

            var periodos = ventasPorMes.Select(x => (x.Year, x.Month))
                .Union(comprasPorMes.Select(x => (x.Year, x.Month)))
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            var serieMensual = periodos.Select(p =>
            {
                var v = ventasPorMes.FirstOrDefault(x => x.Year == p.Year && x.Month == p.Month);
                var c = comprasPorMes.FirstOrDefault(x => x.Year == p.Year && x.Month == p.Month);
                var ingresos = Math.Round(v?.Ingresos ?? 0m, 2);
                var compras = Math.Round(c?.Compras ?? 0m, 2);

                return new MonthlyMetricDto
                {
                    Periodo = $"{p.Year}-{p.Month:D2}",
                    Anio = p.Year,
                    Mes = p.Month,
                    Ingresos = ingresos,
                    Compras = compras,
                    MargenBruto = Math.Round(ingresos - compras, 2),
                    Tickets = v?.Tickets ?? 0
                };
            }).ToList();

            var sucursalesDict = await _context.Sucursales
                .AsNoTracking()
                .ToDictionaryAsync(s => s.SucursalId, s => s.Nombre);

            var stockPorSucursal = await _context.Inventarios
                .AsNoTracking()
                .GroupBy(i => i.SucursalId)
                .Select(g => new { SucursalId = g.Key, Stock = g.Sum(x => x.CantidadStock) })
                .ToDictionaryAsync(x => x.SucursalId, x => x.Stock);

            var ventasSucursalRaw = await ventasQuery
                .GroupBy(v => v.SucursalId)
                .Select(g => new
                {
                    SucursalId = g.Key,
                    Ingresos = g.Sum(x => x.Total),
                    Tickets = g.Count()
                })
                .ToListAsync();

            var rendimientoSucursales = sucursalesDict.Select(kvp =>
            {
                var vs = ventasSucursalRaw.FirstOrDefault(x => x.SucursalId == kvp.Key);
                var ing = Math.Round(vs?.Ingresos ?? 0m, 2);
                var tks = vs?.Tickets ?? 0;
                return new BranchMetricDto
                {
                    SucursalId = kvp.Key,
                    SucursalNombre = kvp.Value,
                    Ingresos = ing,
                    Tickets = tks,
                    TicketPromedio = tks > 0 ? Math.Round(ing / tks, 2) : 0m,
                    UnidadesEnStock = Math.Round(stockPorSucursal.GetValueOrDefault(kvp.Key, 0m), 2)
                };
            }).OrderByDescending(x => x.Ingresos).ToList();

            var detallesFiltrados = _context.VentaDetalles
                .AsNoTracking()
                .Where(vd => vd.Venta.Estatus == "Completada");

            if (anio.HasValue && anio.Value >= 2000)
            {
                var inicioDt = new DateTime(anio.Value, 1, 1);
                var finDt = new DateTime(anio.Value + 1, 1, 1);
                detallesFiltrados = detallesFiltrados.Where(vd => vd.Venta.FechaHora >= inicioDt && vd.Venta.FechaHora < finDt);
            }

            if (sucursalId.HasValue && sucursalId.Value > 0)
            {
                detallesFiltrados = detallesFiltrados.Where(vd => vd.Venta.SucursalId == sucursalId.Value);
            }

            var topRaw = await detallesFiltrados
                .GroupBy(vd => new
                {
                    vd.ProductoId,
                    vd.Producto.Nombre,
                    Categoria = vd.Producto.TipoProducto.Nombre,
                    vd.Producto.PrecioVenta,
                    vd.Producto.CostoPromedio
                })
                .Select(g => new
                {
                    g.Key.ProductoId,
                    g.Key.Nombre,
                    g.Key.Categoria,
                    g.Key.PrecioVenta,
                    g.Key.CostoPromedio,
                    Unidades = g.Sum(x => x.Cantidad),
                    Ingresos = g.Sum(x => x.Cantidad * x.PrecioUnitario)
                })
                .OrderByDescending(x => x.Ingresos)
                .Take(12)
                .ToListAsync();

            var topProductos = topRaw.Select(x => new TopProductoMetricDto
            {
                ProductoId = x.ProductoId,
                Nombre = x.Nombre,
                Categoria = x.Categoria,
                UnidadesVendidas = Math.Round(x.Unidades, 0),
                Ingresos = Math.Round(x.Ingresos, 2),
                MargenPorcentaje = x.PrecioVenta > 0
                    ? Math.Round(((x.PrecioVenta - x.CostoPromedio) / x.PrecioVenta) * 100m, 1)
                    : 0m
            }).ToList();

            var categoriasRaw = await detallesFiltrados
                .GroupBy(vd => vd.Producto.TipoProducto.Nombre)
                .Select(g => new CategoryMetricDto
                {
                    Categoria = g.Key,
                    Ingresos = Math.Round(g.Sum(x => x.Cantidad * x.PrecioUnitario), 2),
                    Unidades = Math.Round(g.Sum(x => x.Cantidad), 0)
                })
                .OrderByDescending(x => x.Ingresos)
                .ToListAsync();

            return new DatabaseAnalyticsDto
            {
                SerieMensual = serieMensual,
                RendimientoSucursales = rendimientoSucursales,
                TopProductos = topProductos,
                DistribucionCategorias = categoriasRaw
            };
        }

        public async Task<CatalogosBundleDto> ObtenerCatalogosMaestrosAsync()
        {
            var sucursales = await _context.Sucursales
                .AsNoTracking()
                .Select(s => new SucursalDto
                {
                    SucursalId = s.SucursalId,
                    Nombre = s.Nombre,
                    Direccion = s.Direccion,
                    TotalEmpleados = s.Empleados.Count,
                    SkusEnInventario = s.Inventarios.Count
                })
                .OrderBy(s => s.SucursalId)
                .ToListAsync();

            var empleados = await _context.Empleados
                .AsNoTracking()
                .Select(e => new EmpleadoDto
                {
                    EmpleadoId = e.EmpleadoId,
                    NombreCompleto = e.Nombre + " " + e.Apellido,
                    PuestoId = e.PuestoId,
                    PuestoNombre = e.Puesto.Nombre,
                    SucursalId = e.SucursalId,
                    SucursalNombre = e.Sucursal.Nombre,
                    FechaContratacion = e.FechaContratacion
                })
                .OrderBy(e => e.SucursalId)
                .ThenBy(e => e.NombreCompleto)
                .ToListAsync();

            var proveedores = await _context.Proveedores
                .AsNoTracking()
                .Select(p => new ProveedorDto
                {
                    ProveedorId = p.ProveedorId,
                    NombreFiscal = p.NombreFiscal,
                    Rfc = p.Rfc,
                    NombreContacto = p.NombreContacto,
                    TotalComprasHistoricas = p.Compras.Count
                })
                .OrderByDescending(p => p.TotalComprasHistoricas)
                .ToListAsync();

            var puestos = await _context.Puestos.AsNoTracking()
                .Select(x => new LookupItemDto { Id = x.PuestoId, Nombre = x.Nombre })
                .ToListAsync();

            var tiposCliente = await _context.TipoClientes.AsNoTracking()
                .Select(x => new LookupItemDto { Id = x.TipoClienteId, Nombre = x.Nombre })
                .ToListAsync();

            var tiposProducto = await _context.TipoProductos.AsNoTracking()
                .Select(x => new LookupItemDto { Id = x.TipoProductoId, Nombre = x.Nombre })
                .ToListAsync();

            var unidades = await _context.UnidadMedida.AsNoTracking()
                .Select(x => new LookupItemDto { Id = x.UnidadMedidaId, Nombre = x.Nombre, Extra = x.Abreviatura })
                .ToListAsync();

            var impuestos = await _context.TipoImpuestos.AsNoTracking()
                .Select(x => new LookupItemDto { Id = x.TipoImpuestoId, Nombre = x.Descripcion, ValorNumerico = x.Porcentaje })
                .ToListAsync();

            return new CatalogosBundleDto
            {
                Sucursales = sucursales,
                Empleados = empleados,
                Proveedores = proveedores,
                Puestos = puestos,
                TiposCliente = tiposCliente,
                TiposProducto = tiposProducto,
                UnidadesMedida = unidades,
                TiposImpuesto = impuestos
            };
        }
    }
}

using System;
using System.Collections.Generic;

namespace Panaderia.Application.DTOs
{
    public class TableMetricDto
    {
        public string TableName { get; set; } = string.Empty;
        public string DomainGroup { get; set; } = string.Empty;
        public int RowCount { get; set; }
        public string PrimaryKey { get; set; } = string.Empty;
        public List<string> IndexesAndConstraints { get; set; } = new();
        public string Description { get; set; } = string.Empty;
    }

    public class DatabaseTelemetryDto
    {
        public string DatabaseName { get; set; } = "PanaderiaDB";
        public string Engine { get; set; } = "Microsoft SQL Server · EF Core 8";
        public int TotalTables { get; set; }
        public long TotalRowsGlobal { get; set; }
        public DateTime? PrimeraOperacion { get; set; }
        public DateTime? UltimaOperacion { get; set; }
        public int MesesOperacion { get; set; }
        public int TotalVentasHistoricas { get; set; }
        public int TotalLineasDetalleVenta { get; set; }
        public int TotalOrdenesCompra { get; set; }
        public decimal IngresosBrutosHistoricos { get; set; }
        public decimal ComprasAcumuladas { get; set; }
        public decimal ValorInventarioActual { get; set; }
        public List<TableMetricDto> Tables { get; set; } = new();
    }

    public class MonthlyMetricDto
    {
        public string Periodo { get; set; } = string.Empty; // YYYY-MM
        public int Anio { get; set; }
        public int Mes { get; set; }
        public decimal Ingresos { get; set; }
        public decimal Compras { get; set; }
        public decimal MargenBruto { get; set; }
        public int Tickets { get; set; }
    }

    public class BranchMetricDto
    {
        public int SucursalId { get; set; }
        public string SucursalNombre { get; set; } = string.Empty;
        public decimal Ingresos { get; set; }
        public int Tickets { get; set; }
        public decimal TicketPromedio { get; set; }
        public decimal UnidadesEnStock { get; set; }
    }

    public class TopProductoMetricDto
    {
        public int ProductoId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public decimal UnidadesVendidas { get; set; }
        public decimal Ingresos { get; set; }
        public decimal MargenPorcentaje { get; set; }
    }

    public class CategoryMetricDto
    {
        public string Categoria { get; set; } = string.Empty;
        public decimal Ingresos { get; set; }
        public decimal Unidades { get; set; }
    }

    public class DatabaseAnalyticsDto
    {
        public List<MonthlyMetricDto> SerieMensual { get; set; } = new();
        public List<BranchMetricDto> RendimientoSucursales { get; set; } = new();
        public List<TopProductoMetricDto> TopProductos { get; set; } = new();
        public List<CategoryMetricDto> DistribucionCategorias { get; set; } = new();
    }
}

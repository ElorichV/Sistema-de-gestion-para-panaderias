using System;
using System.Collections.Generic;

namespace Panaderia.Application.DTOs
{
    public class SucursalDto
    {
        public int SucursalId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Direccion { get; set; }
        public int TotalEmpleados { get; set; }
        public int SkusEnInventario { get; set; }
    }

    public class EmpleadoDto
    {
        public int EmpleadoId { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public int PuestoId { get; set; }
        public string PuestoNombre { get; set; } = string.Empty;
        public int SucursalId { get; set; }
        public string SucursalNombre { get; set; } = string.Empty;
        public DateOnly FechaContratacion { get; set; }
    }

    public class ProveedorDto
    {
        public int ProveedorId { get; set; }
        public string NombreFiscal { get; set; } = string.Empty;
        public string Rfc { get; set; } = string.Empty;
        public string? NombreContacto { get; set; }
        public int TotalComprasHistoricas { get; set; }
    }

    public class LookupItemDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Extra { get; set; }
        public decimal? ValorNumerico { get; set; }
    }

    public class CatalogosBundleDto
    {
        public List<SucursalDto> Sucursales { get; set; } = new();
        public List<EmpleadoDto> Empleados { get; set; } = new();
        public List<ProveedorDto> Proveedores { get; set; } = new();
        public List<LookupItemDto> Puestos { get; set; } = new();
        public List<LookupItemDto> TiposCliente { get; set; } = new();
        public List<LookupItemDto> TiposProducto { get; set; } = new();
        public List<LookupItemDto> UnidadesMedida { get; set; } = new();
        public List<LookupItemDto> TiposImpuesto { get; set; } = new();
    }
}

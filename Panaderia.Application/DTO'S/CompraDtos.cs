using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Panaderia.Application.DTOs
{
    public class CreateCompraDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int ProveedorId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int SucursalId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int EmpleadoId { get; set; }

        public DateOnly? FechaRecepcion { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "La compra debe incluir al menos un insumo o producto.")]
        public List<CreateCompraDetalleDto> Detalles { get; set; } = new();
    }

    public class CreateCompraDetalleDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int ProductoId { get; set; }

        [Required]
        [Range(0.001, 1000000)]
        public decimal Cantidad { get; set; }

        [Required]
        [Range(0.01, 1000000)]
        public decimal CostoUnitario { get; set; }
    }

    public class CompraResponseDto
    {
        public int CompraId { get; set; }
        public int ProveedorId { get; set; }
        public string ProveedorNombre { get; set; } = string.Empty;
        public string ProveedorRfc { get; set; } = string.Empty;
        public int SucursalId { get; set; }
        public string SucursalNombre { get; set; } = string.Empty;
        public int EmpleadoId { get; set; }
        public string EmpleadoNombre { get; set; } = string.Empty;
        public DateOnly FechaRecepcion { get; set; }
        public decimal Total { get; set; }
        public List<CompraDetalleResponseDto> Detalles { get; set; } = new();
    }

    public class CompraDetalleResponseDto
    {
        public int CompraDetalleId { get; set; }
        public int ProductoId { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public string UnidadMedida { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}

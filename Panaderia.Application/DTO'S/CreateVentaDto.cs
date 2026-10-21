using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Panaderia.Application.DTOs
{
    public class CreateVentaDto
    {
        [Required(ErrorMessage = "Debe especificar la sucursal de la venta.")]
        [Range(1, int.MaxValue, ErrorMessage = "Sucursal ID inválido.")]
        public int SucursalId { get; set; }

        [Required(ErrorMessage = "Debe especificar el empleado cajero.")]
        [Range(1, int.MaxValue, ErrorMessage = "Empleado ID inválido.")]
        public int EmpleadoId { get; set; }

        public int? ClienteId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Tipo de impuesto inválido.")]
        public int TipoImpuestoId { get; set; } = 1;

        [Required(ErrorMessage = "La venta debe contener al menos un producto.")]
        [MinLength(1, ErrorMessage = "Debe incluir al menos un producto en los detalles.")]
        public List<CreateVentaDetalleDto> Detalles { get; set; } = new List<CreateVentaDetalleDto>();
    }

    public class CreateVentaDetalleDto
    {
        [Required(ErrorMessage = "El identificador del producto es obligatorio.")]
        [Range(1, int.MaxValue, ErrorMessage = "Producto ID inválido.")]
        public int ProductoId { get; set; }

        [Required(ErrorMessage = "La cantidad es obligatoria.")]
        [Range(0.001, 100000.00, ErrorMessage = "La cantidad vendida debe ser mayor a 0.")]
        public decimal Cantidad { get; set; }

        [Range(0, 100000.00, ErrorMessage = "El precio unitario no puede ser negativo.")]
        public decimal PrecioUnitario { get; set; }
    }

    public class VentaResponseDto
    {
        public int VentaId { get; set; }
        public int SucursalId { get; set; }
        public string SucursalNombre { get; set; } = string.Empty;
        public int EmpleadoId { get; set; }
        public string EmpleadoNombre { get; set; } = string.Empty;
        public int? ClienteId { get; set; }
        public string? ClienteNombre { get; set; }
        public int TipoImpuestoId { get; set; }
        public string TipoImpuestoDescripcion { get; set; } = string.Empty;
        public decimal TipoImpuestoPorcentaje { get; set; }
        public DateTime FechaHora { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TotalImpuestos { get; set; }
        public decimal Total { get; set; }
        public string Estatus { get; set; } = string.Empty;
        public List<VentaDetalleResponseDto> Detalles { get; set; } = new List<VentaDetalleResponseDto>();
    }

    public class VentaDetalleResponseDto
    {
        public int VentaDetalleId { get; set; }
        public int ProductoId { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Importe { get; set; }
    }
}

namespace Panaderia.Application.DTO_S
{
    public class CreateVentaDto : Panaderia.Application.DTOs.CreateVentaDto { }
    public class CreateVentaDetalleDto : Panaderia.Application.DTOs.CreateVentaDetalleDto { }
    public class VentaResponseDto : Panaderia.Application.DTOs.VentaResponseDto { }
    public class VentaDetalleResponseDto : Panaderia.Application.DTOs.VentaDetalleResponseDto { }
}

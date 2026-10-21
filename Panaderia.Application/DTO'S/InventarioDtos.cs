using System.ComponentModel.DataAnnotations;

namespace Panaderia.Application.DTOs
{
    public class InventarioResponseDto
    {
        public int InventarioId { get; set; }
        public int SucursalId { get; set; }
        public string SucursalNombre { get; set; } = string.Empty;
        public int ProductoId { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string TipoProductoNombre { get; set; } = string.Empty;
        public string UnidadMedida { get; set; } = string.Empty;
        public decimal CantidadStock { get; set; }
        public decimal PrecioVenta { get; set; }
        public bool EsVendible { get; set; }
        public bool EsInsumo { get; set; }
    }

    public class ActualizarStockDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Sucursal ID inválido.")]
        public int SucursalId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Producto ID inválido.")]
        public int ProductoId { get; set; }

        [Required]
        [Range(0, 1000000.00, ErrorMessage = "La cantidad debe ser mayor o igual a 0.")]
        public decimal Cantidad { get; set; }

        /// <summary>
        /// "fijar" para establecer el valor directo, o "reabastecer" para sumar al stock existente.
        /// </summary>
        public string Operacion { get; set; } = "reabastecer";
    }
}

namespace Panaderia.Application.DTO_S
{
    public class InventarioResponseDto : Panaderia.Application.DTOs.InventarioResponseDto { }
    public class ActualizarStockDto : Panaderia.Application.DTOs.ActualizarStockDto { }
}

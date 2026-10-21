using System.ComponentModel.DataAnnotations;

namespace Panaderia.Application.DTOs
{
    public class CreateProductoDto
    {
        [Required(ErrorMessage = "El nombre del pan o producto es obligatorio.")]
        [StringLength(150)]
        public string Nombre { get; set; } = null!;

        public string? Descripcion { get; set; }

        [Required]
        [Range(0.01, 10000.00, ErrorMessage = "El precio de venta debe ser mayor a cero.")]
        public decimal PrecioVenta { get; set; }

        [Required(ErrorMessage = "Debe asignar un tipo de producto.")]
        public int TipoProductoId { get; set; }

        [Required(ErrorMessage = "Debe asignar una unidad de medida.")]
        public int UnidadMedidaId { get; set; }

        public bool EsInsumo { get; set; }
        public bool EsVendible { get; set; } = true;
    }

    public class ProductoResponseDto
    {
        public int ProductoId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int TipoProductoId { get; set; }
        public string TipoProductoNombre { get; set; } = string.Empty;
        public int UnidadMedidaId { get; set; }
        public string UnidadMedidaNombre { get; set; } = string.Empty;
        public string UnidadMedidaAbreviatura { get; set; } = string.Empty;
        public decimal PrecioVenta { get; set; }
        public decimal CostoPromedio { get; set; }
        public bool EsVendible { get; set; }
        public bool EsInsumo { get; set; }
        public decimal StockTotal { get; set; }
    }
}

namespace Panaderia.Application.DTO_S
{
    public class CreateProductoDto : Panaderia.Application.DTOs.CreateProductoDto { }
    public class ProductoResponseDto : Panaderia.Application.DTOs.ProductoResponseDto { }
}

using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Producto
{
    public int ProductoId { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public int TipoProductoId { get; set; }

    public int UnidadMedidaId { get; set; }

    public decimal PrecioVenta { get; set; }

    public decimal CostoPromedio { get; set; }

    public bool EsVendible { get; set; }

    public bool EsInsumo { get; set; }

    public virtual ICollection<CompraDetalle> CompraDetalles { get; set; } = new List<CompraDetalle>();

    public virtual ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();

    public virtual TipoProducto TipoProducto { get; set; } = null!;

    public virtual UnidadMedidum UnidadMedida { get; set; } = null!;

    public virtual ICollection<VentaDetalle> VentaDetalles { get; set; } = new List<VentaDetalle>();
}

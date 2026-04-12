using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class CompraDetalle
{
    public int CompraDetalleId { get; set; }

    public int CompraId { get; set; }

    public int ProductoId { get; set; }

    public decimal Cantidad { get; set; }

    public decimal CostoUnitario { get; set; }

    public virtual Compra Compra { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;
}

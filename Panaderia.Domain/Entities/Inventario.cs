using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Inventario
{
    public int InventarioId { get; set; }

    public int SucursalId { get; set; }

    public int ProductoId { get; set; }

    public decimal CantidadStock { get; set; }

    public virtual Producto Producto { get; set; } = null!;

    public virtual Sucursale Sucursal { get; set; } = null!;
}

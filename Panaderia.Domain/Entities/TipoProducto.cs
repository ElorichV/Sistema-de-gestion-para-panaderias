using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class TipoProducto
{
    public int TipoProductoId { get; set; }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}

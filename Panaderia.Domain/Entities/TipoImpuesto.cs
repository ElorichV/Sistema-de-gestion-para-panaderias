using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class TipoImpuesto
{
    public int TipoImpuestoId { get; set; }

    public string Descripcion { get; set; } = null!;

    public decimal Porcentaje { get; set; }

    public virtual ICollection<Venta> Venta { get; set; } = new List<Venta>();
}

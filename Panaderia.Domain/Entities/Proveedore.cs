using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Proveedore
{
    public int ProveedorId { get; set; }

    public string NombreFiscal { get; set; } = null!;

    public string Rfc { get; set; } = null!;

    public string? NombreContacto { get; set; }

    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();
}

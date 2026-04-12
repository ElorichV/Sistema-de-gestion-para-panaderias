using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Cliente
{
    public int ClienteId { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Rfc { get; set; }

    public string? Email { get; set; }

    public int TipoClienteId { get; set; }

    public virtual TipoCliente TipoCliente { get; set; } = null!;

    public virtual ICollection<Venta> Venta { get; set; } = new List<Venta>();
}

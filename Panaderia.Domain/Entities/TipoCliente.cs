using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class TipoCliente
{
    public int TipoClienteId { get; set; }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<Cliente> Clientes { get; set; } = new List<Cliente>();
}

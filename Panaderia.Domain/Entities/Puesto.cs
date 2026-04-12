using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Puesto
{
    public int PuestoId { get; set; }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<Empleado> Empleados { get; set; } = new List<Empleado>();
}

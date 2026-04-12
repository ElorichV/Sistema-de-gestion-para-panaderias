using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Empleado
{
    public int EmpleadoId { get; set; }

    public string Nombre { get; set; } = null!;

    public string Apellido { get; set; } = null!;

    public int PuestoId { get; set; }

    public int SucursalId { get; set; }

    public DateOnly FechaContratacion { get; set; }

    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();

    public virtual Puesto Puesto { get; set; } = null!;

    public virtual Sucursale Sucursal { get; set; } = null!;

    public virtual ICollection<Venta> Venta { get; set; } = new List<Venta>();
}

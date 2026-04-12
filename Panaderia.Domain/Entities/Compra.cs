using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Compra
{
    public int CompraId { get; set; }

    public int ProveedorId { get; set; }

    public int SucursalId { get; set; }

    public int EmpleadoId { get; set; }

    public DateOnly FechaRecepcion { get; set; }

    public decimal Total { get; set; }

    public virtual ICollection<CompraDetalle> CompraDetalles { get; set; } = new List<CompraDetalle>();

    public virtual Empleado Empleado { get; set; } = null!;

    public virtual Proveedore Proveedor { get; set; } = null!;

    public virtual Sucursale Sucursal { get; set; } = null!;
}

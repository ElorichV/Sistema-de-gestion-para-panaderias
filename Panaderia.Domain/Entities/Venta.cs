using System;
using System.Collections.Generic;

namespace Panaderia.Domain.Entities;

public partial class Venta
{
    public int VentaId { get; set; }

    public int SucursalId { get; set; }

    public int EmpleadoId { get; set; }

    public int? ClienteId { get; set; }

    public int TipoImpuestoId { get; set; }

    public DateTime FechaHora { get; set; }

    public decimal Subtotal { get; set; }

    public decimal TotalImpuestos { get; set; }

    public decimal Total { get; set; }

    public string Estatus { get; set; } = null!;

    public virtual Cliente? Cliente { get; set; }

    public virtual Empleado Empleado { get; set; } = null!;

    public virtual Sucursale Sucursal { get; set; } = null!;

    public virtual TipoImpuesto TipoImpuesto { get; set; } = null!;

    public virtual ICollection<VentaDetalle> VentaDetalles { get; set; } = new List<VentaDetalle>();
}

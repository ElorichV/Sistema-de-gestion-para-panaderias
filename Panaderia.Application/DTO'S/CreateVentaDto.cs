namespace Panaderia.Application.DTO_S
{
    public class CreateVentaDto
    {
        public int SucursalId { get; set; }
        public int EmpleadoId { get; set; }
        public int? ClienteId { get; set; }
        public int TipoImpuestoId { get; set; }
        public List<CreateVentaDetalleDto> Detalles { get; set; } = new List<CreateVentaDetalleDto>();
    }

    public class CreateVentaDetalleDto
    {
        public int ProductoId { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}

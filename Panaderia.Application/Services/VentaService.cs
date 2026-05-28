using Panaderia.Application.DTO_S;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Services
{
    public class VentaService : IVentaService
    {
        private readonly IVentaRepository _repository;

        public VentaService(IVentaRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Venta>> ObtenerTodosAsync()
        {
            return await _repository.ObtenerTodosAsync();
        }

        public async Task<Venta?> ObtenerPorIdAsync(int id)
        {
            return await _repository.ObtenerPorIdAsync(id);
        }

        public async Task<bool> CrearAsync(CreateVentaDto dto)
        {
            var subtotal = dto.Detalles.Sum(d => d.Cantidad * d.PrecioUnitario);
            var totalImpuestos = subtotal * 0.16m; // Asumiendo 16% de impuesto
            var total = subtotal + totalImpuestos;

            var venta = new Venta
            {
                SucursalId = dto.SucursalId,
                EmpleadoId = dto.EmpleadoId,
                ClienteId = dto.ClienteId,
                TipoImpuestoId = dto.TipoImpuestoId,
                FechaHora = DateTime.Now,
                Subtotal = subtotal,
                TotalImpuestos = totalImpuestos,
                Total = total,
                Estatus = "Completada",
                VentaDetalles = dto.Detalles.Select(d => new VentaDetalle
                {
                    ProductoId = d.ProductoId,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario
                }).ToList()
            };

            return await _repository.CrearAsync(venta);
        }
    }
}

using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IVentaRepository
    {
        Task<List<Venta>> ObtenerTodosAsync();
        Task<Venta?> ObtenerPorIdAsync(int id);
        Task<bool> CrearAsync(Venta venta);
    }
}

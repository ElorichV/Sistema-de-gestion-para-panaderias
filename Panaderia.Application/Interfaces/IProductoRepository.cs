using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IProductoRepository
    {
        Task<List<Producto>> ObtenerTodosAsync();
        Task<Producto?> ObtenerPorIdAsync(int id);
        Task<Producto> CrearAsync(Producto producto);
        Task<bool> ActualizarAsync(Producto producto);
    }
}
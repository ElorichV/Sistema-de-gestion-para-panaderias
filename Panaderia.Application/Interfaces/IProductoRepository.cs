using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IProductoRepository
    {
        Task<List<Producto>> ObtenerTodosAsync();
        Task<Producto> CrearAsync(Producto producto);
    }
}
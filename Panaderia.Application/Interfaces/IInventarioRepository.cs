using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IInventarioRepository
    {
        Task<List<Inventario>> ObtenerTodosAsync();
        Task<List<Inventario>> ObtenerPorSucursalAsync(int sucursalId);
        Task<Inventario?> ObtenerPorSucursalYProductoAsync(int sucursalId, int productoId);
        Task<bool> ActualizarStockAsync(int sucursalId, int productoId, decimal nuevaCantidad);
        Task<bool> ReabastecerStockAsync(int sucursalId, int productoId, decimal cantidadAgregar);
    }
}

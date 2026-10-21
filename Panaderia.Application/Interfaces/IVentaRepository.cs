using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IVentaRepository
    {
        Task<List<Venta>> ObtenerTodosAsync();
        Task<Venta?> ObtenerPorIdAsync(int id);
        Task<Venta> RegistrarVentaTransaccionalAsync(Venta venta, List<(int ProductoId, decimal Cantidad)> itemsADescontar);
        Task<bool> CrearAsync(Venta venta);
    }
}

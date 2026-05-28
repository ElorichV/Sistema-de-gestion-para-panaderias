using Panaderia.Application.DTO_S;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IVentaService
    {
        Task<List<Venta>> ObtenerTodosAsync();
        Task<Venta?> ObtenerPorIdAsync(int id);
        Task<bool> CrearAsync(CreateVentaDto dto);
    }
}

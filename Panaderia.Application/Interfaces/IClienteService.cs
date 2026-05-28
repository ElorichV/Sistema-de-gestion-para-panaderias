using Panaderia.Application.DTO_S;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IClienteService
    {
        Task<List<Cliente>> ObtenerTodosAsync();
        Task<Cliente?> ObtenerPorIdAsync(int id);
        Task<bool> CrearAsync(CreateClienteDto dto);
        Task<bool> ActualizarAsync(int id, CreateClienteDto dto);
        Task<bool> EliminarAsync(int id);
    }
}

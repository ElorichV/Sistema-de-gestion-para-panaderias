using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;

namespace Panaderia.Application.Interfaces
{
    public interface IClienteService
    {
        Task<List<ClienteResponseDto>> ObtenerTodosAsync();
        Task<ClienteResponseDto?> ObtenerPorIdAsync(int id);
        Task<ClienteResponseDto> CrearAsync(CreateClienteDto dto);
        Task<bool> ActualizarAsync(int id, CreateClienteDto dto);
        Task<bool> EliminarAsync(int id);
    }
}

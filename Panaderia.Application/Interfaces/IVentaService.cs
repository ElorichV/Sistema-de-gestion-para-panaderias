using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;

namespace Panaderia.Application.Interfaces
{
    public interface IVentaService
    {
        Task<List<VentaResponseDto>> ObtenerTodosAsync(int limit = 100, int? sucursalId = null);
        Task<VentaResponseDto?> ObtenerPorIdAsync(int id);
        Task<VentaResponseDto> ProcesarVentaAsync(CreateVentaDto dto);
        Task<bool> CrearAsync(CreateVentaDto dto);
    }
}

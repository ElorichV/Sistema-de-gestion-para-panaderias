using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;

namespace Panaderia.Application.Interfaces
{
    public interface ICompraService
    {
        Task<List<CompraResponseDto>> ObtenerRecientesAsync(int limit = 60, int? sucursalId = null);
        Task<CompraResponseDto?> ObtenerPorIdAsync(int id);
        Task<CompraResponseDto> ProcesarCompraAsync(CreateCompraDto dto);
    }
}

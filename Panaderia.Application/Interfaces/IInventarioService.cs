using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;

namespace Panaderia.Application.Interfaces
{
    public interface IInventarioService
    {
        Task<List<InventarioResponseDto>> ObtenerTodosAsync();
        Task<List<InventarioResponseDto>> ObtenerPorSucursalAsync(int sucursalId);
        Task<bool> ActualizarStockAsync(ActualizarStockDto dto);
    }
}

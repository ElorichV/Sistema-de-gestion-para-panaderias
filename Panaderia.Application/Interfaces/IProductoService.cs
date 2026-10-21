using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;

namespace Panaderia.Application.Interfaces
{
    public interface IProductoService
    {
        Task<List<ProductoResponseDto>> ObtenerTodosAsync();
        Task<ProductoResponseDto?> ObtenerPorIdAsync(int id);
        Task<ProductoResponseDto> CrearAsync(CreateProductoDto dto);
        Task<bool> ActualizarAsync(int id, CreateProductoDto dto);
        Task<bool> DesactivarProductoAsync(int id);
    }
}

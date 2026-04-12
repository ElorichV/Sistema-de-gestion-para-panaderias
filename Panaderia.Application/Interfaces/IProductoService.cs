using Panaderia.Application.DTOs;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface IProductoService
    {
        // Usamos Task porque es asíncrono (buenas prácticas de rendimiento)
        Task<bool> CrearAsync(CreateProductoDto dto);
        Task<List<Producto>> ObtenerTodosAsync();
    }
}
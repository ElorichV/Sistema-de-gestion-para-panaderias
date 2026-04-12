using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Services
{
    public class ProductoService : IProductoService
    {
        // Ya no usamos DbContext, usamos el Repositorio
        private readonly IProductoRepository _repository;

        public ProductoService(IProductoRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> CrearAsync(CreateProductoDto dto)
        {
            try
            {
                var producto = new Producto
                {
                    Nombre = dto.Nombre,
                    Descripcion = dto.Descripcion,
                    PrecioVenta = dto.PrecioVenta,
                    EsVendible = true
                };

                await _repository.CrearAsync(producto);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<Producto>> ObtenerTodosAsync()
        {
            // Delegamos la tarea al repositorio
            return await _repository.ObtenerTodosAsync();
        }
    }
}
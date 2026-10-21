using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Services
{
    public class ProductoService : IProductoService
    {
        private readonly IProductoRepository _repository;

        public ProductoService(IProductoRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ProductoResponseDto>> ObtenerTodosAsync()
        {
            var productos = await _repository.ObtenerTodosAsync();
            return productos.Select(MapToResponseDto).ToList();
        }

        public async Task<ProductoResponseDto?> ObtenerPorIdAsync(int id)
        {
            var producto = await _repository.ObtenerPorIdAsync(id);
            return producto == null ? null : MapToResponseDto(producto);
        }

        public async Task<ProductoResponseDto> CrearAsync(CreateProductoDto dto)
        {
            var producto = new Producto
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                PrecioVenta = dto.PrecioVenta,
                TipoProductoId = dto.TipoProductoId,
                UnidadMedidaId = dto.UnidadMedidaId,
                EsInsumo = dto.EsInsumo,
                EsVendible = dto.EsVendible,
                CostoPromedio = 0.00m
            };

            var creado = await _repository.CrearAsync(producto);
            return MapToResponseDto(creado);
        }

        public async Task<bool> ActualizarAsync(int id, CreateProductoDto dto)
        {
            var producto = await _repository.ObtenerPorIdAsync(id);
            if (producto == null) return false;

            producto.Nombre = dto.Nombre;
            producto.Descripcion = dto.Descripcion;
            producto.PrecioVenta = dto.PrecioVenta;
            producto.TipoProductoId = dto.TipoProductoId;
            producto.UnidadMedidaId = dto.UnidadMedidaId;
            producto.EsInsumo = dto.EsInsumo;
            producto.EsVendible = dto.EsVendible;

            return await _repository.ActualizarAsync(producto);
        }

        public async Task<bool> DesactivarProductoAsync(int id)
        {
            var producto = await _repository.ObtenerPorIdAsync(id);
            if (producto == null) return false;

            // REGLA DE NEGOCIO: Borrado lógico protegiendo integridad referencial
            producto.EsVendible = false;
            return await _repository.ActualizarAsync(producto);
        }

        private static ProductoResponseDto MapToResponseDto(Producto p)
        {
            return new ProductoResponseDto
            {
                ProductoId = p.ProductoId,
                Nombre = p.Nombre,
                Descripcion = p.Descripcion,
                TipoProductoId = p.TipoProductoId,
                TipoProductoNombre = p.TipoProducto?.Nombre ?? "Sin categoría",
                UnidadMedidaId = p.UnidadMedidaId,
                UnidadMedidaNombre = p.UnidadMedida?.Nombre ?? "Pieza",
                UnidadMedidaAbreviatura = p.UnidadMedida?.Abreviatura ?? "pza",
                PrecioVenta = p.PrecioVenta,
                CostoPromedio = p.CostoPromedio,
                EsVendible = p.EsVendible,
                EsInsumo = p.EsInsumo,
                StockTotal = p.Inventarios?.Sum(i => i.CantidadStock) ?? 0m
            };
        }
    }
}

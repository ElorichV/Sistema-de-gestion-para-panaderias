using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Services
{
    public class InventarioService : IInventarioService
    {
        private readonly IInventarioRepository _repository;

        public InventarioService(IInventarioRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<InventarioResponseDto>> ObtenerTodosAsync()
        {
            var inventarios = await _repository.ObtenerTodosAsync();
            return inventarios.Select(MapToResponseDto).ToList();
        }

        public async Task<List<InventarioResponseDto>> ObtenerPorSucursalAsync(int sucursalId)
        {
            var inventarios = await _repository.ObtenerPorSucursalAsync(sucursalId);
            return inventarios.Select(MapToResponseDto).ToList();
        }

        public async Task<bool> ActualizarStockAsync(ActualizarStockDto dto)
        {
            if (dto.Cantidad < 0)
                throw new InvalidOperationException("La cantidad de stock no puede ser negativa.");

            if (dto.Operacion?.ToLower() == "fijar" || dto.Operacion?.ToLower() == "set")
            {
                return await _repository.ActualizarStockAsync(dto.SucursalId, dto.ProductoId, dto.Cantidad);
            }
            else
            {
                // Por defecto o "reabastecer": acumular stock
                return await _repository.ReabastecerStockAsync(dto.SucursalId, dto.ProductoId, dto.Cantidad);
            }
        }

        private static InventarioResponseDto MapToResponseDto(Inventario i)
        {
            return new InventarioResponseDto
            {
                InventarioId = i.InventarioId,
                SucursalId = i.SucursalId,
                SucursalNombre = i.Sucursal?.Nombre ?? $"Sucursal #{i.SucursalId}",
                ProductoId = i.ProductoId,
                ProductoNombre = i.Producto?.Nombre ?? $"Producto #{i.ProductoId}",
                Descripcion = i.Producto?.Descripcion,
                TipoProductoNombre = i.Producto?.TipoProducto?.Nombre ?? "Sin categoría",
                UnidadMedida = i.Producto?.UnidadMedida?.Nombre ?? "Pieza",
                CantidadStock = i.CantidadStock,
                PrecioVenta = i.Producto?.PrecioVenta ?? 0m,
                EsVendible = i.Producto?.EsVendible ?? true,
                EsInsumo = i.Producto?.EsInsumo ?? false
            };
        }
    }
}

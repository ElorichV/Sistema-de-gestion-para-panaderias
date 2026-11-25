using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Services
{
    public class CompraService : ICompraService
    {
        private readonly ICompraRepository _compraRepository;

        public CompraService(ICompraRepository compraRepository)
        {
            _compraRepository = compraRepository;
        }

        public async Task<List<CompraResponseDto>> ObtenerRecientesAsync(int limit = 60, int? sucursalId = null)
        {
            var compras = await _compraRepository.ObtenerRecientesAsync(limit, sucursalId);
            return compras.Select(MapToDto).ToList();
        }

        public async Task<CompraResponseDto?> ObtenerPorIdAsync(int id)
        {
            var compra = await _compraRepository.ObtenerPorIdAsync(id);
            return compra == null ? null : MapToDto(compra);
        }

        public async Task<CompraResponseDto> ProcesarCompraAsync(CreateCompraDto dto)
        {
            if (dto.Detalles == null || dto.Detalles.Count == 0)
                throw new InvalidOperationException("Debe registrar al menos una línea de compra.");

            var detalles = dto.Detalles.Select(d => new CompraDetalle
            {
                ProductoId = d.ProductoId,
                Cantidad = d.Cantidad,
                CostoUnitario = d.CostoUnitario
            }).ToList();

            var total = Math.Round(detalles.Sum(d => d.Cantidad * d.CostoUnitario), 2, MidpointRounding.AwayFromZero);

            var nuevaCompra = new Compra
            {
                ProveedorId = dto.ProveedorId,
                SucursalId = dto.SucursalId,
                EmpleadoId = dto.EmpleadoId,
                FechaRecepcion = dto.FechaRecepcion ?? DateOnly.FromDateTime(DateTime.Now),
                Total = total,
                CompraDetalles = detalles
            };

            var creada = await _compraRepository.RegistrarCompraTransaccionalAsync(nuevaCompra);
            return MapToDto(creada);
        }

        private static CompraResponseDto MapToDto(Compra c)
        {
            return new CompraResponseDto
            {
                CompraId = c.CompraId,
                ProveedorId = c.ProveedorId,
                ProveedorNombre = c.Proveedor?.NombreFiscal ?? $"Proveedor #{c.ProveedorId}",
                ProveedorRfc = c.Proveedor?.Rfc ?? string.Empty,
                SucursalId = c.SucursalId,
                SucursalNombre = c.Sucursal?.Nombre ?? $"Sucursal #{c.SucursalId}",
                EmpleadoId = c.EmpleadoId,
                EmpleadoNombre = c.Empleado != null ? $"{c.Empleado.Nombre} {c.Empleado.Apellido}" : $"Empleado #{c.EmpleadoId}",
                FechaRecepcion = c.FechaRecepcion,
                Total = c.Total,
                Detalles = c.CompraDetalles.Select(d => new CompraDetalleResponseDto
                {
                    CompraDetalleId = d.CompraDetalleId,
                    ProductoId = d.ProductoId,
                    ProductoNombre = d.Producto?.Nombre ?? $"Producto #{d.ProductoId}",
                    UnidadMedida = d.Producto?.UnidadMedida?.Abreviatura ?? "pz",
                    Cantidad = d.Cantidad,
                    CostoUnitario = d.CostoUnitario,
                    Subtotal = Math.Round(d.Cantidad * d.CostoUnitario, 2, MidpointRounding.AwayFromZero)
                }).ToList()
            };
        }
    }
}

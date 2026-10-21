using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;
using Panaderia.Domain.Exceptions;

namespace Panaderia.Application.Services
{
    public class VentaService : IVentaService
    {
        private readonly IVentaRepository _ventaRepository;
        private readonly IProductoRepository _productoRepository;

        public VentaService(IVentaRepository ventaRepository, IProductoRepository productoRepository)
        {
            _ventaRepository = ventaRepository;
            _productoRepository = productoRepository;
        }

        public async Task<List<VentaResponseDto>> ObtenerTodosAsync()
        {
            var ventas = await _ventaRepository.ObtenerTodosAsync();
            return ventas.Select(MapToResponseDto).ToList();
        }

        public async Task<VentaResponseDto?> ObtenerPorIdAsync(int id)
        {
            var venta = await _ventaRepository.ObtenerPorIdAsync(id);
            return venta == null ? null : MapToResponseDto(venta);
        }

        public async Task<VentaResponseDto> ProcesarVentaAsync(CreateVentaDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            if (dto.Detalles == null || !dto.Detalles.Any())
                throw new InvalidOperationException("La venta debe contener al menos un producto.");

            if (dto.SucursalId <= 0)
                throw new InvalidOperationException("Debe seleccionar una sucursal válida.");

            if (dto.EmpleadoId <= 0)
                throw new InvalidOperationException("Debe especificar un empleado cajero válido.");

            // 1. REGLA DE NEGOCIO: Consolidar y validar productos e insumos requeridos
            var productosDb = await _productoRepository.ObtenerTodosAsync();
            var productosMap = productosDb.ToDictionary(p => p.ProductoId);

            var itemsProcesados = new List<VentaDetalle>();
            var descuentosStock = new List<(int ProductoId, decimal Cantidad)>();

            foreach (var item in dto.Detalles)
            {
                if (item.Cantidad <= 0)
                    throw new InvalidOperationException($"La cantidad para el producto ID {item.ProductoId} debe ser mayor a cero.");

                if (!productosMap.TryGetValue(item.ProductoId, out var producto))
                    throw new InvalidOperationException($"El producto ID {item.ProductoId} no existe en catálogo.");

                if (!producto.EsVendible)
                    throw new InvalidOperationException($"El producto '{producto.Nombre}' no está habilitado para la venta.");

                // Si el DTO no trae precio unitario o es 0, asignamos el precio oficial del catálogo
                var precioUnitario = item.PrecioUnitario > 0 ? item.PrecioUnitario : producto.PrecioVenta;

                itemsProcesados.Add(new VentaDetalle
                {
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = precioUnitario
                });

                descuentosStock.Add((item.ProductoId, item.Cantidad));
            }

            // 2. REGLA FINANCIERA: Cálculo de Subtotal, Impuestos y Total
            var subtotal = itemsProcesados.Sum(d => d.Cantidad * d.PrecioUnitario);

            // Tasa impositiva (Default 16% IVA para México/Latam o configurable)
            decimal tasaImpuesto = 0.16m;
            var totalImpuestos = Math.Round(subtotal * tasaImpuesto, 2, MidpointRounding.AwayFromZero);
            var total = subtotal + totalImpuestos;

            var nuevaVenta = new Venta
            {
                SucursalId = dto.SucursalId,
                EmpleadoId = dto.EmpleadoId,
                ClienteId = dto.ClienteId,
                TipoImpuestoId = dto.TipoImpuestoId > 0 ? dto.TipoImpuestoId : 1,
                FechaHora = DateTime.Now,
                Subtotal = subtotal,
                TotalImpuestos = totalImpuestos,
                Total = total,
                Estatus = "Completada",
                VentaDetalles = itemsProcesados
            };

            // 3. ATOMICIDAD: Descuento de stock en Inventario y persistencia en una sola transacción ACID
            var ventaRegistrada = await _ventaRepository.RegistrarVentaTransaccionalAsync(nuevaVenta, descuentosStock);

            return MapToResponseDto(ventaRegistrada);
        }

        public async Task<bool> CrearAsync(CreateVentaDto dto)
        {
            try
            {
                var resultado = await ProcesarVentaAsync(dto);
                return resultado != null && resultado.VentaId > 0;
            }
            catch
            {
                return false;
            }
        }

        private static VentaResponseDto MapToResponseDto(Venta v)
        {
            return new VentaResponseDto
            {
                VentaId = v.VentaId,
                SucursalId = v.SucursalId,
                SucursalNombre = v.Sucursal?.Nombre ?? $"Sucursal #{v.SucursalId}",
                EmpleadoId = v.EmpleadoId,
                EmpleadoNombre = v.Empleado != null ? $"{v.Empleado.Nombre} {v.Empleado.Apellido}" : $"Empleado #{v.EmpleadoId}",
                ClienteId = v.ClienteId,
                ClienteNombre = v.Cliente?.Nombre ?? "Público General",
                TipoImpuestoId = v.TipoImpuestoId,
                TipoImpuestoDescripcion = v.TipoImpuesto?.Descripcion ?? "IVA 16%",
                TipoImpuestoPorcentaje = v.TipoImpuesto?.Porcentaje ?? 0.16m,
                FechaHora = v.FechaHora,
                Subtotal = v.Subtotal,
                TotalImpuestos = v.TotalImpuestos,
                Total = v.Total,
                Estatus = v.Estatus,
                Detalles = v.VentaDetalles.Select(d => new VentaDetalleResponseDto
                {
                    VentaDetalleId = d.VentaDetalleId,
                    ProductoId = d.ProductoId,
                    ProductoNombre = d.Producto?.Nombre ?? $"Producto #{d.ProductoId}",
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Importe = d.Importe ?? (d.Cantidad * d.PrecioUnitario)
                }).ToList()
            };
        }
    }
}

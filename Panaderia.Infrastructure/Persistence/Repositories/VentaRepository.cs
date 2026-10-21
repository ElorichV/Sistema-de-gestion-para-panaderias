using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;
using Panaderia.Domain.Exceptions;
using Panaderia.Infrastructure.Persistence.Contexts;

namespace Panaderia.Infrastructure.Persistence.Repositories
{
    public class VentaRepository : IVentaRepository
    {
        private readonly PanaderiaDbContext _context;

        public VentaRepository(PanaderiaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Venta>> ObtenerTodosAsync()
        {
            return await _context.Ventas
                .AsNoTracking()
                .Include(v => v.VentaDetalles)
                    .ThenInclude(vd => vd.Producto)
                .Include(v => v.Cliente)
                .Include(v => v.Empleado)
                .Include(v => v.Sucursal)
                .Include(v => v.TipoImpuesto)
                .OrderByDescending(v => v.FechaHora)
                .ToListAsync();
        }

        public async Task<Venta?> ObtenerPorIdAsync(int id)
        {
            return await _context.Ventas
                .AsNoTracking()
                .Include(v => v.VentaDetalles)
                    .ThenInclude(vd => vd.Producto)
                .Include(v => v.Cliente)
                .Include(v => v.Empleado)
                .Include(v => v.Sucursal)
                .Include(v => v.TipoImpuesto)
                .FirstOrDefaultAsync(v => v.VentaId == id);
        }

        public async Task<Venta> RegistrarVentaTransaccionalAsync(Venta venta, List<(int ProductoId, decimal Cantidad)> itemsADescontar)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 1. VALIDACIÓN Y DESCUENTO ATÓMICO DE STOCK EN INVENTARIO
                    foreach (var item in itemsADescontar)
                    {
                        var inventario = await _context.Inventarios
                            .FirstOrDefaultAsync(i => i.SucursalId == venta.SucursalId && i.ProductoId == item.ProductoId);

                        var producto = await _context.Productos.FindAsync(item.ProductoId);
                        var nombreProducto = producto?.Nombre ?? $"Producto #{item.ProductoId}";

                        if (inventario == null)
                        {
                            throw new StockInsuficienteException(
                                item.ProductoId,
                                nombreProducto,
                                stockDisponible: 0,
                                cantidadSolicitada: item.Cantidad);
                        }

                        if (inventario.CantidadStock < item.Cantidad)
                        {
                            throw new StockInsuficienteException(
                                item.ProductoId,
                                nombreProducto,
                                stockDisponible: inventario.CantidadStock,
                                cantidadSolicitada: item.Cantidad);
                        }

                        // Descuento atómico de stock
                        inventario.CantidadStock -= item.Cantidad;
                    }

                    // 2. REGISTRO DE VENTA Y DETALLES
                    await _context.Ventas.AddAsync(venta);
                    await _context.SaveChangesAsync();

                    // 3. CONFIRMACIÓN ATÓMICA DE TRANSACCIÓN
                    await transaction.CommitAsync();

                    // Recargamos las entidades de navegación para la respuesta completa
                    await _context.Entry(venta).Reference(v => v.Sucursal).LoadAsync();
                    await _context.Entry(venta).Reference(v => v.Empleado).LoadAsync();
                    if (venta.ClienteId.HasValue)
                    {
                        await _context.Entry(venta).Reference(v => v.Cliente).LoadAsync();
                    }
                    await _context.Entry(venta).Reference(v => v.TipoImpuesto).LoadAsync();

                    foreach (var detalle in venta.VentaDetalles)
                    {
                        await _context.Entry(detalle).Reference(d => d.Producto).LoadAsync();
                    }

                    return venta;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        public async Task<bool> CrearAsync(Venta venta)
        {
            _context.Ventas.Add(venta);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

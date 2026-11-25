using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;
using Panaderia.Infrastructure.Persistence.Contexts;

namespace Panaderia.Infrastructure.Persistence.Repositories
{
    public class CompraRepository : ICompraRepository
    {
        private readonly PanaderiaDbContext _context;

        public CompraRepository(PanaderiaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Compra>> ObtenerRecientesAsync(int limit = 60, int? sucursalId = null)
        {
            var safeLimit = Math.Clamp(limit, 1, 300);
            var query = _context.Compras.AsNoTracking().AsQueryable();

            if (sucursalId.HasValue && sucursalId.Value > 0)
            {
                query = query.Where(c => c.SucursalId == sucursalId.Value);
            }

            return await query
                .OrderByDescending(c => c.FechaRecepcion)
                .ThenByDescending(c => c.CompraId)
                .Take(safeLimit)
                .Include(c => c.Proveedor)
                .Include(c => c.Sucursal)
                .Include(c => c.Empleado)
                .Include(c => c.CompraDetalles)
                    .ThenInclude(cd => cd.Producto)
                        .ThenInclude(p => p.UnidadMedida)
                .ToListAsync();
        }

        public async Task<Compra?> ObtenerPorIdAsync(int id)
        {
            return await _context.Compras
                .AsNoTracking()
                .Include(c => c.Proveedor)
                .Include(c => c.Sucursal)
                .Include(c => c.Empleado)
                .Include(c => c.CompraDetalles)
                    .ThenInclude(cd => cd.Producto)
                        .ThenInclude(p => p.UnidadMedida)
                .FirstOrDefaultAsync(c => c.CompraId == id);
        }

        public async Task<Compra> RegistrarCompraTransaccionalAsync(Compra compra)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var detalle in compra.CompraDetalles)
                    {
                        var producto = await _context.Productos
                            .Include(p => p.Inventarios)
                            .FirstOrDefaultAsync(p => p.ProductoId == detalle.ProductoId);

                        if (producto == null)
                        {
                            throw new InvalidOperationException($"El insumo o producto ID {detalle.ProductoId} no existe en el catálogo.");
                        }

                        var stockGlobalActual = producto.Inventarios.Sum(i => i.CantidadStock);
                        var denominador = stockGlobalActual + detalle.Cantidad;

                        if (denominador > 0)
                        {
                            var valorActual = Math.Max(0m, stockGlobalActual) * producto.CostoPromedio;
                            var valorEntrada = detalle.Cantidad * detalle.CostoUnitario;
                            producto.CostoPromedio = Math.Round((valorActual + valorEntrada) / denominador, 2, MidpointRounding.AwayFromZero);
                        }

                        var inventarioSucursal = producto.Inventarios
                            .FirstOrDefault(i => i.SucursalId == compra.SucursalId);

                        if (inventarioSucursal == null)
                        {
                            await _context.Inventarios.AddAsync(new Inventario
                            {
                                SucursalId = compra.SucursalId,
                                ProductoId = detalle.ProductoId,
                                CantidadStock = detalle.Cantidad
                            });
                        }
                        else
                        {
                            inventarioSucursal.CantidadStock += detalle.Cantidad;
                        }
                    }

                    await _context.Compras.AddAsync(compra);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return await ObtenerPorIdAsync(compra.CompraId) ?? compra;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }
    }
}

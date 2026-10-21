using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;
using Panaderia.Infrastructure.Persistence.Contexts;

namespace Panaderia.Infrastructure.Persistence.Repositories
{
    public class InventarioRepository : IInventarioRepository
    {
        private readonly PanaderiaDbContext _context;

        public InventarioRepository(PanaderiaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Inventario>> ObtenerTodosAsync()
        {
            return await _context.Inventarios
                .AsNoTracking()
                .Include(i => i.Producto)
                    .ThenInclude(p => p.TipoProducto)
                .Include(i => i.Producto)
                    .ThenInclude(p => p.UnidadMedida)
                .Include(i => i.Sucursal)
                .OrderBy(i => i.SucursalId)
                .ThenBy(i => i.Producto.Nombre)
                .ToListAsync();
        }

        public async Task<List<Inventario>> ObtenerPorSucursalAsync(int sucursalId)
        {
            return await _context.Inventarios
                .AsNoTracking()
                .Where(i => i.SucursalId == sucursalId)
                .Include(i => i.Producto)
                    .ThenInclude(p => p.TipoProducto)
                .Include(i => i.Producto)
                    .ThenInclude(p => p.UnidadMedida)
                .Include(i => i.Sucursal)
                .OrderBy(i => i.Producto.Nombre)
                .ToListAsync();
        }

        public async Task<Inventario?> ObtenerPorSucursalYProductoAsync(int sucursalId, int productoId)
        {
            return await _context.Inventarios
                .Include(i => i.Producto)
                .FirstOrDefaultAsync(i => i.SucursalId == sucursalId && i.ProductoId == productoId);
        }

        public async Task<bool> ActualizarStockAsync(int sucursalId, int productoId, decimal nuevaCantidad)
        {
            var inventario = await _context.Inventarios
                .FirstOrDefaultAsync(i => i.SucursalId == sucursalId && i.ProductoId == productoId);

            if (inventario == null)
            {
                inventario = new Inventario
                {
                    SucursalId = sucursalId,
                    ProductoId = productoId,
                    CantidadStock = nuevaCantidad
                };
                await _context.Inventarios.AddAsync(inventario);
            }
            else
            {
                inventario.CantidadStock = nuevaCantidad;
            }

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> ReabastecerStockAsync(int sucursalId, int productoId, decimal cantidadAgregar)
        {
            var inventario = await _context.Inventarios
                .FirstOrDefaultAsync(i => i.SucursalId == sucursalId && i.ProductoId == productoId);

            if (inventario == null)
            {
                inventario = new Inventario
                {
                    SucursalId = sucursalId,
                    ProductoId = productoId,
                    CantidadStock = cantidadAgregar
                };
                await _context.Inventarios.AddAsync(inventario);
            }
            else
            {
                inventario.CantidadStock += cantidadAgregar;
            }

            return await _context.SaveChangesAsync() > 0;
        }
    }
}

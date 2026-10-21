using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;
using Panaderia.Infrastructure.Persistence.Contexts;

namespace Panaderia.Infrastructure.Persistence.Repositories
{
    public class ProductoRepository : IProductoRepository
    {
        private readonly PanaderiaDbContext _context;

        public ProductoRepository(PanaderiaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Producto>> ObtenerTodosAsync()
        {
            return await _context.Productos
                .AsNoTracking()
                .Include(p => p.TipoProducto)
                .Include(p => p.UnidadMedida)
                .Include(p => p.Inventarios)
                .OrderBy(p => p.Nombre)
                .ToListAsync();
        }

        public async Task<Producto?> ObtenerPorIdAsync(int id)
        {
            return await _context.Productos
                .Include(p => p.TipoProducto)
                .Include(p => p.UnidadMedida)
                .Include(p => p.Inventarios)
                .FirstOrDefaultAsync(p => p.ProductoId == id);
        }

        public async Task<Producto> CrearAsync(Producto producto)
        {
            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();
            return producto;
        }

        public async Task<bool> ActualizarAsync(Producto producto)
        {
            _context.Productos.Update(producto);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

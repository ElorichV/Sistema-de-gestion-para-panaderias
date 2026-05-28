using Microsoft.EntityFrameworkCore;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;
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
                .Include(v => v.VentaDetalles)
                    .ThenInclude(vd => vd.Producto)
                .Include(v => v.Cliente)
                .Include(v => v.Empleado)
                .Include(v => v.Sucursal)
                .ToListAsync();
        }

        public async Task<Venta?> ObtenerPorIdAsync(int id)
        {
            return await _context.Ventas
                .Include(v => v.VentaDetalles)
                    .ThenInclude(vd => vd.Producto)
                .Include(v => v.Cliente)
                .Include(v => v.Empleado)
                .Include(v => v.Sucursal)
                .FirstOrDefaultAsync(v => v.VentaId == id);
        }

        public async Task<bool> CrearAsync(Venta venta)
        {
            _context.Ventas.Add(venta);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}

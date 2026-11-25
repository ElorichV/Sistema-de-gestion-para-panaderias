using System.Collections.Generic;
using System.Threading.Tasks;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Interfaces
{
    public interface ICompraRepository
    {
        Task<List<Compra>> ObtenerRecientesAsync(int limit = 60, int? sucursalId = null);
        Task<Compra?> ObtenerPorIdAsync(int id);
        Task<Compra> RegistrarCompraTransaccionalAsync(Compra compra);
    }
}

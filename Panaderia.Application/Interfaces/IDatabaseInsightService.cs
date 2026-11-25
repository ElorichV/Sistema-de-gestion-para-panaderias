using System.Threading.Tasks;
using Panaderia.Application.DTOs;

namespace Panaderia.Application.Interfaces
{
    public interface IDatabaseInsightService
    {
        Task<DatabaseTelemetryDto> ObtenerTelemetriaEsquemaAsync();
        Task<DatabaseAnalyticsDto> ObtenerAnaliticaHistoricaAsync(int? anio = null, int? sucursalId = null);
        Task<CatalogosBundleDto> ObtenerCatalogosMaestrosAsync();
    }
}

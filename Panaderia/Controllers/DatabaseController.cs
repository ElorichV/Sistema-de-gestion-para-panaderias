using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;

namespace Panaderia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly IDatabaseInsightService _insightService;

        public DatabaseController(IDatabaseInsightService insightService)
        {
            _insightService = insightService;
        }

        [HttpGet("telemetry")]
        public async Task<ActionResult<DatabaseTelemetryDto>> ObtenerTelemetria()
        {
            var telemetry = await _insightService.ObtenerTelemetriaEsquemaAsync();
            return Ok(telemetry);
        }

        [HttpGet("analytics")]
        public async Task<ActionResult<DatabaseAnalyticsDto>> ObtenerAnalitica([FromQuery] int? anio = null, [FromQuery] int? sucursalId = null)
        {
            var analytics = await _insightService.ObtenerAnaliticaHistoricaAsync(anio, sucursalId);
            return Ok(analytics);
        }

        [HttpGet("catalogos")]
        public async Task<ActionResult<CatalogosBundleDto>> ObtenerCatalogos()
        {
            var catalogos = await _insightService.ObtenerCatalogosMaestrosAsync();
            return Ok(catalogos);
        }
    }
}

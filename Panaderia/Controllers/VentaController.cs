using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTO_S;
using Panaderia.Application.Interfaces;

namespace Panaderia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentaController : ControllerBase
    {
        private readonly IVentaService _ventaService;

        public VentaController(IVentaService ventaService)
        {
            _ventaService = ventaService;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var ventas = await _ventaService.ObtenerTodosAsync();
            return Ok(ventas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var venta = await _ventaService.ObtenerPorIdAsync(id);
            
            if (venta == null)
            {
                return NotFound(new { Mensaje = "Venta no encontrada" });
            }

            return Ok(venta);
        }

        [HttpPost]
        public async Task<IActionResult> CrearVenta([FromBody] CreateVentaDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultado = await _ventaService.CrearAsync(dto);

            if (resultado)
            {
                return Ok(new { Mensaje = "Venta registrada con éxito 🧾" });
            }

            return StatusCode(500, "Error al registrar la venta");
        }
    }
}

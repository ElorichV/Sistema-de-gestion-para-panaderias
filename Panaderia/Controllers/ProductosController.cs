using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.Interfaces;
using Panaderia.Application.DTOs;

namespace Panaderia.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductoController : ControllerBase
    {
        private readonly IProductoService _productoService;

        // Inyección de dependencias en acción: el contenedor te pasa el servicio
        public ProductoController(IProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearProducto([FromBody] CreateProductoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Aquí le pasas la pelota a la Capa de Aplicación
            var resultado = await _productoService.CrearAsync(dto);

            if (resultado)
            {
                return Ok(new { Mensaje = "Producto horneado y guardado con éxito 🥖" });
            }

            return StatusCode(500, "Hubo un problema en el horno (error interno).");
        }
    }
}
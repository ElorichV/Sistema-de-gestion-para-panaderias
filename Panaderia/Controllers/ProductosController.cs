using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;

namespace Panaderia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductoController : ControllerBase
    {
        private readonly IProductoService _productoService;

        public ProductoController(IProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProductoResponseDto>>> ObtenerTodos()
        {
            var productos = await _productoService.ObtenerTodosAsync();
            return Ok(productos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductoResponseDto>> ObtenerPorId(int id)
        {
            var producto = await _productoService.ObtenerPorIdAsync(id);
            if (producto == null)
            {
                return NotFound(new { Mensaje = $"Producto #{id} no encontrado en vitrina." });
            }
            return Ok(producto);
        }

        [HttpPost]
        public async Task<ActionResult<ProductoResponseDto>> CrearProducto([FromBody] CreateProductoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var nuevo = await _productoService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = nuevo.ProductoId }, nuevo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] CreateProductoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultado = await _productoService.ActualizarAsync(id, dto);
            if (resultado)
            {
                return Ok(new { Mensaje = "Información del producto actualizada con éxito 📝" });
            }
            return NotFound(new { Mensaje = "El producto no existe." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> BorradoLogicoProducto(int id)
        {
            var resultado = await _productoService.DesactivarProductoAsync(id);
            if (resultado)
            {
                return Ok(new { Mensaje = "Producto retirado del mostrador (Desactivado de ventas) 🚫" });
            }
            return NotFound(new { Mensaje = "El producto no existe." });
        }
    }
}

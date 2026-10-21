using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;

namespace Panaderia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly IInventarioService _inventarioService;

        public InventarioController(IInventarioService inventarioService)
        {
            _inventarioService = inventarioService;
        }

        /// <summary>
        /// Obtiene las existencias de stock de todos los productos en todas las sucursales.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<InventarioResponseDto>>> ObtenerTodos()
        {
            var inventarios = await _inventarioService.ObtenerTodosAsync();
            return Ok(inventarios);
        }

        /// <summary>
        /// Obtiene el inventario disponible filtrado por sucursal específica.
        /// </summary>
        [HttpGet("sucursal/{sucursalId}")]
        public async Task<ActionResult<List<InventarioResponseDto>>> ObtenerPorSucursal(int sucursalId)
        {
            var inventarios = await _inventarioService.ObtenerPorSucursalAsync(sucursalId);
            return Ok(inventarios);
        }

        /// <summary>
        /// Permite fijar o reabastecer stock de un insumo o producto para una sucursal determinada.
        /// </summary>
        [HttpPost("actualizar-stock")]
        public async Task<IActionResult> ActualizarStock([FromBody] ActualizarStockDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var exito = await _inventarioService.ActualizarStockAsync(dto);
            if (exito)
            {
                return Ok(new { Mensaje = "Stock de inventario actualizado exitosamente 📦" });
            }

            return BadRequest(new { Mensaje = "No fue posible actualizar el inventario solicitado." });
        }
    }
}

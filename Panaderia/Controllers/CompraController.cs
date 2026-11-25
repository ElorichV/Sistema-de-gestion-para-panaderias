using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;

namespace Panaderia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompraController : ControllerBase
    {
        private readonly ICompraService _compraService;

        public CompraController(ICompraService compraService)
        {
            _compraService = compraService;
        }

        [HttpGet]
        public async Task<ActionResult<List<CompraResponseDto>>> ObtenerRecientes([FromQuery] int limit = 60, [FromQuery] int? sucursalId = null)
        {
            var compras = await _compraService.ObtenerRecientesAsync(limit, sucursalId);
            return Ok(compras);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CompraResponseDto>> ObtenerPorId(int id)
        {
            var compra = await _compraService.ObtenerPorIdAsync(id);
            if (compra == null)
            {
                return NotFound(new { Mensaje = $"La orden de compra #{id} no fue encontrada." });
            }
            return Ok(compra);
        }

        [HttpPost]
        public async Task<ActionResult<CompraResponseDto>> RegistrarCompra([FromBody] CreateCompraDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var creada = await _compraService.ProcesarCompraAsync(dto);
                return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.CompraId }, creada);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Codigo = "REGLA_NEGOCIO_INVALIDA", Mensaje = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Codigo = "ERROR_INTERNO", Mensaje = "Error al registrar la recepción de insumos.", Detalle = ex.Message });
            }
        }
    }
}

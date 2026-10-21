using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Exceptions;

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

        /// <summary>
        /// Obtiene el historial completo de ventas con detalles calculados y catálogos.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<VentaResponseDto>>> ObtenerTodos()
        {
            var ventas = await _ventaService.ObtenerTodosAsync();
            return Ok(ventas);
        }

        /// <summary>
        /// Obtiene el ticket detallado de una venta por su identificador único.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<VentaResponseDto>> ObtenerPorId(int id)
        {
            var venta = await _ventaService.ObtenerPorIdAsync(id);
            if (venta == null)
            {
                return NotFound(new { Mensaje = $"La venta #{id} no existe en los registros." });
            }
            return Ok(venta);
        }

        /// <summary>
        /// Registra una nueva venta de forma transaccional, validando y descontando existencias en inventario.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<VentaResponseDto>> CrearVenta([FromBody] CreateVentaDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var ventaCreada = await _ventaService.ProcesarVentaAsync(dto);
                return CreatedAtAction(nameof(ObtenerPorId), new { id = ventaCreada.VentaId }, ventaCreada);
            }
            catch (StockInsuficienteException ex)
            {
                return BadRequest(new
                {
                    Codigo = "STOCK_INSUFICIENTE",
                    Mensaje = ex.Message,
                    ex.ProductoId,
                    ex.ProductoNombre,
                    ex.StockDisponible,
                    ex.CantidadSolicitada
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Codigo = "REGLA_NEGOCIO_INVALIDA",
                    Mensaje = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Codigo = "ERROR_INTERNO",
                    Mensaje = "Ocurrió un error inesperado al procesar la venta en base de datos.",
                    Detalle = ex.Message
                });
            }
        }
    }
}

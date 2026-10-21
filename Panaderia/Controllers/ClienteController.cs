using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;

namespace Panaderia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteService _clienteService;

        public ClienteController(IClienteService clienteService)
        {
            _clienteService = clienteService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ClienteResponseDto>>> ObtenerTodos()
        {
            var clientes = await _clienteService.ObtenerTodosAsync();
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ClienteResponseDto>> ObtenerPorId(int id)
        {
            var cliente = await _clienteService.ObtenerPorIdAsync(id);
            if (cliente == null)
            {
                return NotFound(new { Mensaje = $"Cliente #{id} no encontrado." });
            }
            return Ok(cliente);
        }

        [HttpPost]
        public async Task<ActionResult<ClienteResponseDto>> Crear([FromBody] CreateClienteDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var clienteCreado = await _clienteService.CrearAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = clienteCreado.ClienteId }, clienteCreado);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] CreateClienteDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultado = await _clienteService.ActualizarAsync(id, dto);
            if (resultado)
            {
                return Ok(new { Mensaje = "Cliente actualizado con éxito 📝" });
            }
            return NotFound(new { Mensaje = "Cliente no encontrado." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var resultado = await _clienteService.EliminarAsync(id);
            if (resultado)
            {
                return Ok(new { Mensaje = "Cliente eliminado con éxito ❌" });
            }
            return NotFound(new { Mensaje = "Cliente no encontrado." });
        }
    }
}

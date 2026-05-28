using Microsoft.AspNetCore.Mvc;
using Panaderia.Application.DTO_S;
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
        public async Task<IActionResult> ObtenerTodos()
        {
            var clientes = await _clienteService.ObtenerTodosAsync();
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var cliente = await _clienteService.ObtenerPorIdAsync(id);
            
            if (cliente == null)
            {
                return NotFound(new { Mensaje = "Cliente no encontrado" });
            }

            return Ok(cliente);
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CreateClienteDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resultado = await _clienteService.CrearAsync(dto);

            if (resultado)
            {
                return Ok(new { Mensaje = "Cliente registrado con éxito 👤" });
            }

            return StatusCode(500, "Error al registrar el cliente");
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
                return Ok(new { Mensaje = "Cliente actualizado con éxito" });
            }

            return NotFound(new { Mensaje = "Cliente no encontrado" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var resultado = await _clienteService.EliminarAsync(id);

            if (resultado)
            {
                return Ok(new { Mensaje = "Cliente eliminado con éxito" });
            }

            return NotFound(new { Mensaje = "Cliente no encontrado" });
        }
    }
}

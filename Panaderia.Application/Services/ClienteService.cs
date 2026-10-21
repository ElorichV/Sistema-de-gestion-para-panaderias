using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Panaderia.Application.DTOs;
using Panaderia.Application.Interfaces;
using Panaderia.Domain.Entities;

namespace Panaderia.Application.Services
{
    public class ClienteService : IClienteService
    {
        private readonly IClienteRepository _repository;

        public ClienteService(IClienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ClienteResponseDto>> ObtenerTodosAsync()
        {
            var clientes = await _repository.ObtenerTodosAsync();
            return clientes.Select(MapToResponseDto).ToList();
        }

        public async Task<ClienteResponseDto?> ObtenerPorIdAsync(int id)
        {
            var cliente = await _repository.ObtenerPorIdAsync(id);
            return cliente == null ? null : MapToResponseDto(cliente);
        }

        public async Task<ClienteResponseDto> CrearAsync(CreateClienteDto dto)
        {
            var cliente = new Cliente
            {
                Nombre = dto.Nombre,
                Rfc = dto.Rfc,
                Email = dto.Email,
                TipoClienteId = dto.TipoClienteId
            };

            await _repository.CrearAsync(cliente);
            var guardado = await _repository.ObtenerPorIdAsync(cliente.ClienteId);
            return MapToResponseDto(guardado ?? cliente);
        }

        public async Task<bool> ActualizarAsync(int id, CreateClienteDto dto)
        {
            var cliente = await _repository.ObtenerPorIdAsync(id);
            if (cliente == null) return false;

            cliente.Nombre = dto.Nombre;
            cliente.Rfc = dto.Rfc;
            cliente.Email = dto.Email;
            cliente.TipoClienteId = dto.TipoClienteId;

            return await _repository.ActualizarAsync(cliente);
        }

        public async Task<bool> EliminarAsync(int id)
        {
            return await _repository.EliminarAsync(id);
        }

        private static ClienteResponseDto MapToResponseDto(Cliente c)
        {
            return new ClienteResponseDto
            {
                ClienteId = c.ClienteId,
                Nombre = c.Nombre,
                Rfc = c.Rfc,
                Email = c.Email,
                TipoClienteId = c.TipoClienteId,
                TipoClienteNombre = c.TipoCliente?.Nombre ?? "General"
            };
        }
    }
}

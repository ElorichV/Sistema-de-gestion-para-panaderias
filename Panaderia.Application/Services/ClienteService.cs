using Panaderia.Application.DTO_S;
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

        public async Task<List<Cliente>> ObtenerTodosAsync()
        {
            return await _repository.ObtenerTodosAsync();
        }

        public async Task<Cliente?> ObtenerPorIdAsync(int id)
        {
            return await _repository.ObtenerPorIdAsync(id);
        }

        public async Task<bool> CrearAsync(CreateClienteDto dto)
        {
            var cliente = new Cliente
            {
                Nombre = dto.Nombre,
                Rfc = dto.Rfc,
                Email = dto.Email,
                TipoClienteId = dto.TipoClienteId
            };

            return await _repository.CrearAsync(cliente);
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
    }
}

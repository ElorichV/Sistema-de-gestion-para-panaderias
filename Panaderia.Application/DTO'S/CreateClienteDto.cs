using System.ComponentModel.DataAnnotations;

namespace Panaderia.Application.DTOs
{
    public class CreateClienteDto
    {
        [Required(ErrorMessage = "El nombre del cliente es obligatorio.")]
        [StringLength(150)]
        public string Nombre { get; set; } = null!;

        [StringLength(13, MinimumLength = 12, ErrorMessage = "El RFC debe tener entre 12 y 13 caracteres.")]
        public string? Rfc { get; set; }

        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        [StringLength(100)]
        public string? Email { get; set; }

        [Required(ErrorMessage = "El tipo de cliente es obligatorio.")]
        public int TipoClienteId { get; set; }
    }

    public class ClienteResponseDto
    {
        public int ClienteId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Rfc { get; set; }
        public string? Email { get; set; }
        public int TipoClienteId { get; set; }
        public string TipoClienteNombre { get; set; } = string.Empty;
    }
}

namespace Panaderia.Application.DTO_S
{
    public class CreateClienteDto : Panaderia.Application.DTOs.CreateClienteDto { }
    public class ClienteResponseDto : Panaderia.Application.DTOs.ClienteResponseDto { }
}

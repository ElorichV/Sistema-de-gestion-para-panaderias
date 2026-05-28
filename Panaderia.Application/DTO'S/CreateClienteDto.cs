namespace Panaderia.Application.DTO_S
{
    public class CreateClienteDto
    {
        public string Nombre { get; set; } = null!;
        public string? Rfc { get; set; }
        public string? Email { get; set; }
        public int TipoClienteId { get; set; }
    }
}

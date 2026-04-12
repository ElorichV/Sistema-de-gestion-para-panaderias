using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Panaderia.Application.DTOs
{
    public class CreateProductoDto
    {
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public decimal PrecioVenta { get; set; }
        // Aquí podrías agregar más campos como TipoProductoId, etc.
        // Por ahora lo dejaremos simple para probar.
    }
}
namespace Panaderia.Domain.Exceptions;

public class StockInsuficienteException : DomainException
{
    public int ProductoId { get; }
    public string ProductoNombre { get; }
    public decimal StockDisponible { get; }
    public decimal CantidadSolicitada { get; }

    public StockInsuficienteException(int productoId, string productoNombre, decimal stockDisponible, decimal cantidadSolicitada)
        : base($"Stock insuficiente para el producto '{productoNombre}' (ID: {productoId}). Stock disponible en sucursal: {stockDisponible:N2}, Cantidad solicitada: {cantidadSolicitada:N2}.")
    {
        ProductoId = productoId;
        ProductoNombre = productoNombre;
        StockDisponible = stockDisponible;
        CantidadSolicitada = cantidadSolicitada;
    }
}

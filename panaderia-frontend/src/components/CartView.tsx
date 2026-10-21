import React, { useState } from 'react'
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react'
import { CartItem, Cliente, Sucursal, VentaResponseDto } from '../types/api'
import { api } from '../services/api'

interface CartViewProps {
  cart: CartItem[]
  onUpdateQuantity: (productoId: number, delta: number) => void
  onRemoveItem: (productoId: number) => void
  onClearCart: () => void
  sucursales: Sucursal[]
  currentSucursalId: number
  clientes: Cliente[]
  onSaleCompleted: (venta: VentaResponseDto) => void
  onNavigateToCatalog: () => void
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  sucursales,
  currentSucursalId,
  clientes,
  onSaleCompleted,
  onNavigateToCatalog,
}) => {
  const [selectedSucursal, setSelectedSucursal] = useState<number>(currentSucursalId)
  const [selectedCliente, setSelectedCliente] = useState<number>(clientes[0]?.clienteId ?? 1)
  const [empleadoId] = useState<number>(1) // Default cajero en turno
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0)
  const totalImpuestos = Math.round(subtotal * 0.16 * 100) / 100
  const total = subtotal + totalImpuestos

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsSubmitting(true)
    setErrorMessage(null)

    const dto = {
      sucursalId: selectedSucursal,
      empleadoId,
      clienteId: selectedCliente,
      tipoImpuestoId: 1, // 1 = IVA 16%
      detalles: cart.map((c) => ({
        productoId: c.producto.productoId,
        cantidad: c.cantidad,
        precioUnitario: c.precioUnitario,
      })),
    }

    const res = await api.procesarVenta(dto)
    setIsSubmitting(false)

    if (res.success && res.data) {
      onClearCart()
      onSaleCompleted(res.data)
    } else {
      setErrorMessage(res.error || 'Ocurrió un error inesperado al procesar la venta.')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
        <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 text-3xl">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">Tu carrito está vacío</h2>
        <p className="text-stone-500 text-sm mt-2 leading-relaxed">
          Explora la vitrina artesanal para agregar baguettes, conchas, croissants y postres a tu pedido.
        </p>
        <button
          onClick={onNavigateToCatalog}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
        >
          <span>Ir a la Vitrina</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Items List (Left Column) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-black text-stone-900">Detalle del Pedido</h2>
            <p className="text-xs text-stone-500">
              {cart.length} {cart.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            </p>
          </div>
          <button
            onClick={onClearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Carrito</span>
          </button>
        </div>

        {/* Error Alert if Stock Validation Fails */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error de Validación de Stock (ACID Rollback)</p>
              <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {cart.map((item) => {
            const itemTotal = item.cantidad * item.precioUnitario
            return (
              <div
                key={item.producto.productoId}
                className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm gap-4"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    {item.producto.tipoProductoNombre || 'Pan'}
                  </span>
                  <h4 className="font-bold text-stone-900 text-base truncate">
                    {item.producto.nombre}
                  </h4>
                  <div className="text-xs text-stone-400 mt-0.5">
                    ${item.precioUnitario.toFixed(2)} c/u • {item.producto.unidadMedidaAbreviatura || 'pza'}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                  <button
                    onClick={() => onUpdateQuantity(item.producto.productoId, -1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-stone-700 hover:bg-stone-200 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-black text-sm text-stone-900">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.producto.productoId, 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-stone-700 hover:bg-stone-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right min-w-[80px]">
                  <span className="text-base font-black text-stone-900 block">
                    ${itemTotal.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.producto.productoId)}
                    className="text-stone-400 hover:text-rose-600 text-xs inline-flex items-center gap-1 mt-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Checkout Sidebar (Right Column) */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-stone-900">Caja y Facturación</h3>
          <p className="text-xs text-stone-500">Configura la venta para registrar la transacción.</p>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Sucursal de Despacho
            </label>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.direccion})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Cliente
            </label>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {clientes.map((c) => (
                <option key={c.clienteId} value={c.clienteId}>
                  {c.nombre} ({c.tipoClienteNombre})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-2.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal de Productos</span>
            <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>IVA Trasladado (16%)</span>
            <span className="font-semibold text-stone-900">${totalImpuestos.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
            <span className="font-bold text-stone-900 text-base">Total a Pagar</span>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-600">${total.toFixed(2)}</span>
              <span className="text-xs text-stone-500 ml-1">MXN</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          disabled={isSubmitting}
          onClick={handleCheckout}
          className="w-full py-4 rounded-2xl bg-amber-600 text-white font-extrabold text-base hover:bg-amber-700 active:scale-[0.99] shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando Transacción ACID...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Confirmar y Procesar Venta</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-stone-400">
          La venta descuenta automáticamente los insumos en <span className="font-semibold text-stone-600">SQL Server</span> bajo una transacción con aislamiento Serializable/Read Committed.
        </p>
      </div>

    </div>
  )
}

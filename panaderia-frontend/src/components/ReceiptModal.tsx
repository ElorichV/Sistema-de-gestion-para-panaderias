import React from 'react'
import { CheckCircle2, Printer, X } from 'lucide-react'
import { VentaResponseDto } from '../types/api'

interface ReceiptModalProps {
  venta: VentaResponseDto | null
  onClose: () => void
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ venta, onClose }) => {
  if (!venta) return null

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Transacción ACID Confirmada
          </span>
          <h2 className="text-2xl font-black text-stone-900">
            Ticket de Venta #{venta.ventaId}
          </h2>
          <p className="text-xs text-stone-400">
            Panificadora Tanajara • {venta.sucursalNombre}
          </p>
        </div>

        {/* Receipt Body */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-3 font-mono">
          <div className="flex justify-between text-stone-500">
            <span>Fecha y Hora:</span>
            <span>{new Date(venta.fechaHora).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Atendió:</span>
            <span className="font-semibold text-stone-700">{venta.empleadoNombre}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Cliente:</span>
            <span className="font-semibold text-stone-700">{venta.clienteNombre || 'Público General'}</span>
          </div>

          <div className="border-t border-dashed border-stone-300 pt-2 space-y-2">
            {venta.detalles.map((d) => (
              <div key={d.ventaDetalleId} className="flex justify-between items-baseline">
                <div className="flex-1 pr-2">
                  <span className="font-bold text-stone-800">{d.productoNombre}</span>
                  <span className="block text-[10px] text-stone-400">
                    {d.cantidad} x ${d.precioUnitario.toFixed(2)}
                  </span>
                </div>
                <span className="font-bold text-stone-900">${d.importe.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-stone-300 pt-2 space-y-1">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span>${venta.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>IVA (16%):</span>
              <span>${venta.totalImpuestos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-900 font-bold text-sm pt-1 border-t border-stone-200">
              <span>TOTAL PAGADO:</span>
              <span className="text-amber-700 font-black">${venta.total.toFixed(2)} MXN</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { InventarioItem, Sucursal } from '../types/api'
import { api } from '../services/api'

interface StockDashboardProps {
  inventario: InventarioItem[]
  sucursales: Sucursal[]
  currentSucursalId: number
  onSelectSucursal: (id: number) => void
  onRefreshInventario: () => void
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  inventario,
  sucursales,
  currentSucursalId,
  onSelectSucursal,
  onRefreshInventario,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [modalItem, setModalItem] = useState<InventarioItem | null>(null)
  const [modalAmount, setModalAmount] = useState<number>(20)
  const [modalOperation, setModalOperation] = useState<'reabastecer' | 'fijar'>('reabastecer')
  const [isUpdating, setIsUpdating] = useState(false)

  // Metrics
  const currentBranchItems = useMemo(() => {
    return inventario.filter((i) => i.sucursalId === currentSucursalId)
  }, [inventario, currentSucursalId])

  const metrics = useMemo(() => {
    const totalProductos = currentBranchItems.length
    const totalUnidades = currentBranchItems.reduce((acc, curr) => acc + curr.cantidadStock, 0)
    const stockCritico = currentBranchItems.filter(
      (i) => i.cantidadStock > 0 && i.cantidadStock < 10
    ).length
    const agotados = currentBranchItems.filter((i) => i.cantidadStock <= 0).length

    return { totalProductos, totalUnidades, stockCritico, agotados }
  }, [currentBranchItems])

  // Filtered table rows
  const filteredItems = useMemo(() => {
    return currentBranchItems.filter(
      (item) =>
        item.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tipoProductoNombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [currentBranchItems, searchTerm])

  const handleSaveStock = async () => {
    if (!modalItem) return
    setIsUpdating(true)

    await api.actualizarStock({
      sucursalId: modalItem.sucursalId,
      productoId: modalItem.productoId,
      cantidad: modalAmount,
      operacion: modalOperation,
    })

    setIsUpdating(false)
    setModalItem(null)
    onRefreshInventario()
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Branch selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">
              Control Maestro de Inventario
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Supervisión de existencias en almacén y mostrador por sucursal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentSucursalId}
            onChange={(e) => onSelectSucursal(Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={onRefreshInventario}
            className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors"
            title="Recargar inventario"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Productos Registrados</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-stone-900">{metrics.totalProductos}</div>
          <p className="text-[11px] text-stone-400 mt-1">En catálogo activo</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Piezas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">{metrics.totalUnidades}</div>
          <p className="text-[11px] text-stone-400 mt-1">Disponibles en sucursal</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Crítico</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{metrics.stockCritico}</div>
          <p className="text-[11px] text-stone-400 mt-1">Menos de 10 unidades</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Productos Agotados</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">{metrics.agotados}</div>
          <p className="text-[11px] text-stone-400 mt-1">Requieren abastecimiento</p>
        </div>

      </div>

      {/* Table & Search */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        
        {/* Search header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs font-medium text-stone-400">
            Mostrando {filteredItems.length} registros
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/80 text-stone-500 text-xs font-bold uppercase tracking-wider border-b border-stone-100">
              <tr>
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Producto</th>
                <th className="py-3 px-6">Categoría</th>
                <th className="py-3 px-6">Precio Venta</th>
                <th className="py-3 px-6">Stock Actual</th>
                <th className="py-3 px-6">Estado</th>
                <th className="py-3 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredItems.map((item) => {
                const agotado = item.cantidadStock <= 0
                const bajo = item.cantidadStock > 0 && item.cantidadStock < 10

                return (
                  <tr key={item.inventarioId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-stone-400">
                      #{item.productoId}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-stone-900">
                      {item.productoNombre}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md text-xs bg-stone-100 text-stone-600 font-semibold">
                        {item.tipoProductoNombre}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-stone-700">
                      ${item.precioVenta.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-black text-stone-900 text-base">
                        {item.cantidadStock}
                      </span>{' '}
                      <span className="text-xs text-stone-400">{item.unidadMedida}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          agotado
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : bajo
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {agotado ? 'Agotado' : bajo ? 'Bajo Stock' : 'Disponible'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setModalItem(item)
                          setModalAmount(20)
                          setModalOperation('reabastecer')
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Reabastecer</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Restock Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Operación de Almacén
              </span>
              <h3 className="text-xl font-black text-stone-900 mt-0.5">
                Reabastecer / Ajustar Stock
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {modalItem.productoNombre} en <span className="font-semibold">{modalItem.sucursalNombre}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOperation('reabastecer')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      modalOperation === 'reabastecer'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    + Sumar al Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOperation('fijar')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      modalOperation === 'fijar'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    = Fijar Inventario
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  Cantidad ({modalItem.unidadMedida})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-base font-black text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="bg-stone-50 p-3 rounded-xl text-xs text-stone-600">
                Stock actual: <span className="font-bold">{modalItem.cantidadStock}</span> {modalItem.unidadMedida}
                {modalOperation === 'reabastecer' && (
                  <> → Nuevo estimado: <span className="font-bold text-emerald-700">{modalItem.cantidadStock + modalAmount}</span></>
                )}
                {modalOperation === 'fijar' && (
                  <> → Se reemplazará por: <span className="font-bold text-amber-700">{modalAmount}</span></>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveStock}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-2 shadow-md shadow-amber-600/20 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando en BD...</span>
                  </>
                ) : (
                  <span>Confirmar Actualización</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Search, Plus, Check, AlertCircle, Sparkles } from 'lucide-react'
import { Producto, InventarioItem } from '../types/api'

interface CatalogViewProps {
  productos: Producto[]
  inventario: InventarioItem[]
  onAddToCart: (producto: Producto, cantidad: number) => void
  currentSucursalName: string
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  productos,
  inventario,
  onAddToCart,
  currentSucursalName,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [addedItemNotice, setAddedItemNotice] = useState<number | null>(null)

  // Map inventory by productoId for the active branch
  const stockByProductId = useMemo(() => {
    const map = new Map<number, number>()
    for (const item of inventario) {
      map.set(item.productoId, item.cantidadStock)
    }
    return map
  }, [inventario])

  // Extract available categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    productos.forEach((p) => {
      if (p.tipoProductoNombre) set.add(p.tipoProductoNombre)
    })
    return ['all', ...Array.from(set)]
  }, [productos])

  // Filter products
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      // Solo mostramos productos vendibles en vitrina
      if (!p.esVendible) return false

      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'all' || p.tipoProductoNombre === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [productos, searchTerm, selectedCategory])

  const handleAdd = (producto: Producto) => {
    onAddToCart(producto, 1)
    setAddedItemNotice(producto.productoId)
    setTimeout(() => {
      setAddedItemNotice((curr) => (curr === producto.productoId ? null : curr))
    }, 1200)
  }

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recién Horneado • Sabor Tradicional</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Vitrina de Panadería y Repostería
          </h1>
          <p className="mt-2 text-amber-100/90 text-sm sm:text-base">
            Inventario en tiempo real sincronizado con <span className="font-bold underline decoration-amber-400">{currentSucursalName}</span>. Cada pedido valida y descuenta existencias de forma atómica.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-10 text-9xl opacity-20 pointer-events-none select-none">
          🥖🥐🧁
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por concha, baguette, hojaldre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? 'Todos los Panes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
          <div className="text-5xl mb-3">🧺</div>
          <h3 className="text-lg font-bold text-stone-800">No encontramos productos</h3>
          <p className="text-sm text-stone-400 mt-1">
            Intenta con otro término de búsqueda o categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((producto) => {
            const stockActual = stockByProductId.get(producto.productoId) ?? 0
            const agotado = stockActual <= 0
            const stockBajo = stockActual > 0 && stockActual < 10
            const isAdded = addedItemNotice === producto.productoId

            return (
              <div
                key={producto.productoId}
                className="group flex flex-col bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all relative overflow-hidden"
              >
                {/* Header: Category & Stock Pill */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
                    {producto.tipoProductoNombre || 'Panadería'}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      agotado
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : stockBajo
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {agotado ? (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>Agotado</span>
                      </>
                    ) : (
                      <>
                        <span>Stock:</span>
                        <span>{stockActual} {producto.unidadMedidaAbreviatura || 'pza'}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Title & Desc */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                    {producto.nombre}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {producto.descripcion || 'Elaborado artesanalmente con ingredientes seleccionados y horneado diario.'}
                  </p>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-400 block font-medium">Precio unitario</span>
                    <span className="text-2xl font-black text-stone-900">
                      ${producto.precioVenta.toFixed(2)}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">MXN</span>
                  </div>

                  <button
                    disabled={agotado}
                    onClick={() => handleAdd(producto)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                      agotado
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                        : isAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20 active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>¡Agregado!</span>
                      </>
                    ) : agotado ? (
                      <span>Sin Stock</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

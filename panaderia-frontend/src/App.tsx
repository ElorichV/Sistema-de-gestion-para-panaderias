import { useState, useEffect, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { CatalogView } from './components/CatalogView'
import { CartView } from './components/CartView'
import { StockDashboard } from './components/StockDashboard'
import { ReceiptModal } from './components/ReceiptModal'
import { Producto, InventarioItem, CartItem, Cliente, Sucursal, VentaResponseDto } from './types/api'
import { api, SUCURSALES_DEMO, CLIENTES_DEMO } from './services/api'

export function App() {
  const [currentTab, setCurrentTab] = useState<'catalog' | 'cart' | 'stock'>('catalog')
  const [currentSucursalId, setCurrentSucursalId] = useState<number>(1)
  const [sucursales] = useState<Sucursal[]>(SUCURSALES_DEMO)
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_DEMO)
  const [productos, setProductos] = useState<Producto[]>([])
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [lastReceipt, setLastReceipt] = useState<VentaResponseDto | null>(null)

  // Fetch initial data
  const loadData = useCallback(async () => {
    const online = await api.checkHealth()
    setIsOnline(online)

    const [prods, invs, clis] = await Promise.all([
      api.getProductos(),
      api.getInventario(),
      api.getClientes(),
    ])

    setProductos(prods)
    setInventario(invs)
    if (clis && clis.length > 0) setClientes(clis)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Cart operations
  const handleAddToCart = (producto: Producto, cantidad: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto.productoId === producto.productoId)
      if (existing) {
        return prev.map((item) =>
          item.producto.productoId === producto.productoId
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [
        ...prev,
        {
          producto,
          cantidad,
          precioUnitario: producto.precioVenta,
        },
      ]
    })
  }

  const handleUpdateQuantity = (productoId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.producto.productoId === productoId) {
            const newQty = item.cantidad + delta
            return newQty > 0 ? { ...item, cantidad: newQty } : null
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    )
  }

  const handleRemoveItem = (productoId: number) => {
    setCart((prev) => prev.filter((item) => item.producto.productoId !== productoId))
  }

  const handleClearCart = () => {
    setCart([])
  }

  const handleSaleCompleted = (venta: VentaResponseDto) => {
    setLastReceipt(venta)
    // Reload inventory after sale deduction
    loadData()
  }

  const currentSucursalName =
    sucursales.find((s) => s.id === currentSucursalId)?.nombre || 'Matriz'

  const cartCount = cart.reduce((acc, curr) => acc + curr.cantidad, 0)

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        cartCount={cartCount}
        sucursales={sucursales}
        currentSucursalId={currentSucursalId}
        onSelectSucursal={setCurrentSucursalId}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'catalog' && (
          <CatalogView
            productos={productos}
            inventario={inventario}
            onAddToCart={handleAddToCart}
            currentSucursalName={currentSucursalName}
          />
        )}

        {currentTab === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            sucursales={sucursales}
            currentSucursalId={currentSucursalId}
            clientes={clientes}
            onSaleCompleted={handleSaleCompleted}
            onNavigateToCatalog={() => setCurrentTab('catalog')}
          />
        )}

        {currentTab === 'stock' && (
          <StockDashboard
            inventario={inventario}
            sucursales={sucursales}
            currentSucursalId={currentSucursalId}
            onSelectSucursal={setCurrentSucursalId}
            onRefreshInventario={loadData}
          />
        )}
      </main>

      {/* Success Receipt Modal */}
      <ReceiptModal
        venta={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-center text-xs text-stone-500">
        <p className="font-semibold text-stone-700">
          Panificadora Tanajara • Arquitectura Clean en .NET 8 & React + Tailwind CSS
        </p>
        <p className="mt-1 text-stone-400">
          Transacciones atómicas ACID (SQL Server / SQLite) • Thin Controllers con DTOs inmutables
        </p>
      </footer>

    </div>
  )
}

export default App

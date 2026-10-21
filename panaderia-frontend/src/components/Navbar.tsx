import React from 'react'
import { ShoppingCart, Store, Package, Layers, CheckCircle2, AlertCircle } from 'lucide-react'
import { Sucursal } from '../types/api'

interface NavbarProps {
  currentTab: 'catalog' | 'cart' | 'stock'
  onSelectTab: (tab: 'catalog' | 'cart' | 'stock') => void
  cartCount: number
  sucursales: Sucursal[]
  currentSucursalId: number
  onSelectSucursal: (id: number) => void
  isOnline: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  sucursales,
  currentSucursalId,
  onSelectSucursal,
  isOnline,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-2xl shadow-md shadow-amber-500/20">
              🥖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">
                  Panificadora <span className="text-amber-600">Tanajara</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
                  v2.0 .NET 8
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">Panadería Artesanal & Sistema POS</p>
            </div>
          </div>

          {/* Sucursal Selector & Server Status */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-600 font-medium">
              <Store className="w-4 h-4 text-amber-600" />
              <span>Sucursal Activa:</span>
              <select
                value={currentSucursalId}
                onChange={(e) => onSelectSucursal(Number(e.target.value))}
                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isOnline ? 'Conectado a ASP.NET Core API' : 'Modo Demostración / Simulación'}
            >
              {isOnline ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>API .NET Conectada</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modo Local / Demo</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'catalog'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catálogo</span>
            </button>

            <button
              onClick={() => onSelectTab('stock')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'stock'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tablero Stock</span>
            </button>

            <button
              onClick={() => onSelectTab('cart')}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'cart'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              {cartCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-black rounded-full bg-amber-500 text-stone-950">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>

        </div>
      </div>
    </header>
  )
}

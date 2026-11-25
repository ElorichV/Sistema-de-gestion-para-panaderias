import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Flame,
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  CartItem,
  Cliente,
  InventarioItem,
  Producto,
  SucursalDto,
  VentaResponseDto,
} from '../../types/api';
import { api } from '../../services/api';
import { Panel } from '../engine/Widgets';

interface TahonaPosViewProps {
  productos: Producto[];
  inventario: InventarioItem[];
  sucursales: SucursalDto[];
  clientes: Cliente[];
  activeSucursalId: number;
  onSelectSucursal: (id: number) => void;
  onTransactionLogged: (lines: string[]) => void;
  onRefreshData: () => void;
}

export function TahonaPosView({
  productos,
  inventario,
  sucursales,
  clientes,
  activeSucursalId,
  onSelectSucursal,
  onTransactionLogged,
  onRefreshData,
}: TahonaPosViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteId, setClienteId] = useState<number>(clientes[0]?.clienteId ?? 1);
  const [tipoImpuestoId, setTipoImpuestoId] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<VentaResponseDto | null>(null);

  useEffect(() => {
    if (!ticket) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTicket(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ticket]);

  const stockMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const i of inventario) {
      if (i.sucursalId === activeSucursalId) {
        map.set(i.productoId, i.cantidadStock);
      }
    }
    return map;
  }, [inventario, activeSucursalId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    productos.forEach((p) => {
      if (p.esVendible && p.tipoProductoNombre) set.add(p.tipoProductoNombre);
    });
    return ['all', ...Array.from(set)];
  }, [productos]);

  const vendibles = useMemo(() => {
    return productos.filter((p) => {
      if (!p.esVendible) return false;
      const matchSearch =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.tipoProductoNombre === category;
      return matchSearch && matchCat;
    });
  }, [productos, search, category]);

  const addToCart = (prod: Producto) => {
    setErrorBanner(null);
    setCart((prev) => {
      const found = prev.find((x) => x.producto.productoId === prod.productoId);
      if (found) {
        return prev.map((x) =>
          x.producto.productoId === prod.productoId ? { ...x, cantidad: x.cantidad + 1 } : x
        );
      }
      return [...prev, { producto: prod, cantidad: 1, precioUnitario: prod.precioVenta }];
    });
    setFlashId(prod.productoId);
    setTimeout(() => setFlashId((cur) => (cur === prod.productoId ? null : cur)), 900);
  };

  const updateQty = (productoId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.producto.productoId !== productoId) return c;
          const next = c.cantidad + delta;
          return next > 0 ? { ...c, cantidad: next } : null;
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const taxRate = tipoImpuestoId === 2 ? 0 : tipoImpuestoId === 3 ? 0.08 : 0.16;
  const subtotal = cart.reduce((s, c) => s + c.cantidad * c.precioUnitario, 0);
  const impuestos = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + impuestos;

  const checkout = async () => {
    if (!cart.length) return;
    setBusy(true);
    setErrorBanner(null);

    const res = await api.procesarVenta({
      sucursalId: activeSucursalId,
      empleadoId: 2,
      clienteId,
      tipoImpuestoId,
      detalles: cart.map((c) => ({
        productoId: c.producto.productoId,
        cantidad: c.cantidad,
        precioUnitario: c.precioUnitario,
      })),
    });

    setBusy(false);

    if (res.success && res.data) {
      onTransactionLogged([
        `[${new Date().toTimeString().slice(0, 8)}] POST /api/Venta -> HTTP 201 (${res.latencyMs}ms)`,
        `[commit] Ticket #${res.data.ventaId} confirmado por $${res.data.total.toFixed(2)} MXN (${cart.length} SKUs descontados)`,
      ]);
      setTicket(res.data);
      setCart([]);
      onRefreshData();
    } else {
      const msg = res.error ?? 'Stock insuficiente detectado durante la transacción.';
      setErrorBanner(msg);
      onTransactionLogged([
        `[${new Date().toTimeString().slice(0, 8)}] POST /api/Venta -> HTTP ${res.status} (${res.latencyMs}ms)`,
        `[rollback] ${msg}`,
      ]);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_390px] fade-up items-start">
      {/* Left: Artisan Vitrina */}
      <div className="space-y-4 min-w-0">
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-amber-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar concha vainilla, masa madre, kouign-amann, espresso..."
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-amber-50 placeholder:text-purple-200/45 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <select
            value={activeSucursalId}
            onChange={(e) => onSelectSucursal(Number(e.target.value))}
            aria-label="Seleccionar sucursal activa"
            className="rounded-xl border border-amber-400/30 bg-[#120d1c] px-3 py-2 font-mono text-xs text-amber-200 focus:outline-none"
          >
            {sucursales.map((s) => (
              <option key={s.sucursalId} value={s.sucursalId}>
                Horno: {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-xl px-3 py-1.5 font-mono text-[11px] whitespace-nowrap border transition-all ${
                category === cat
                  ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                  : 'border-white/10 bg-white/[0.02] text-purple-200/65 hover:text-amber-100'
              }`}
            >
              {cat === 'all' ? 'Toda la Vitrina' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendibles.map((p) => {
            const stock = stockMap.get(p.productoId) ?? 0;
            const out = stock <= 0;
            const low = stock > 0 && stock < 10;
            const flashed = flashId === p.productoId;

            return (
              <div
                key={p.productoId}
                className="glass hover-lift rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md bg-purple-500/15 border border-purple-400/20 px-2 py-0.5 font-mono text-[10px] text-purple-200 truncate">
                      {p.tipoProductoNombre}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold shrink-0 ${
                        out
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          : low
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25'
                      }`}
                    >
                      {out ? 'Agotado (0)' : `${stock} ${p.unidadMedidaAbreviatura}`}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-amber-50 leading-snug">
                    {p.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-purple-200/60 line-clamp-2 leading-relaxed">
                    {p.descripcion}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-purple-200/50 block">
                      SKU #{p.productoId}
                    </span>
                    <span className="font-display text-xl font-bold text-amber-300 tabular-nums">
                      ${p.precioVenta.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    title={out ? 'Agregar para demostrar Rollback ACID 400 en caja' : 'Agregar a la canasta'}
                    className={`rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-all ${
                      flashed
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : out
                        ? 'border border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                        : 'neon-btn'
                    }`}
                  >
                    {flashed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>En Canasta</span>
                      </>
                    ) : out ? (
                      <span>Probar Rollback</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Hornear</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Tactical POS Checkout */}
      <aside className="sticky top-16 space-y-4">
        <Panel
          title={
            <>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Canasta Transaccional POS</span>
            </>
          }
          action={
            cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="font-mono text-[10px] text-rose-300 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Vaciar
              </button>
            )
          }
        >
          <div className="p-4 space-y-4">
            {errorBanner && (
              <div className="rounded-xl border border-rose-400/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono font-semibold text-rose-300">ACID ROLLBACK EJECUTADO</p>
                  <p className="mt-1 text-[11px] leading-relaxed">{errorBanner}</p>
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Flame className="w-8 h-8 text-amber-400/50 mx-auto" />
                <p className="font-display text-sm text-amber-100">La pala del horno está vacía</p>
                <p className="text-xs text-purple-200/55">
                  Selecciona panes de masa madre, repostería o incluso un producto agotado para verificar la protección ACID.
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {cart.map((item) => (
                  <div
                    key={item.producto.productoId}
                    className="rounded-xl border border-white/10 bg-black/30 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-amber-50 truncate">
                        {item.producto.nombre}
                      </p>
                      <p className="font-mono text-[10.5px] text-purple-200/60">
                        ${item.precioUnitario.toFixed(2)} × {item.cantidad}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label="Disminuir cantidad"
                        onClick={() => updateQty(item.producto.productoId, -1)}
                        className="w-6 h-6 rounded-md border border-white/10 bg-white/5 grid place-items-center hover:bg-white/10"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-semibold">
                        {item.cantidad}
                      </span>
                      <button
                        aria-label="Aumentar cantidad"
                        onClick={() => updateQty(item.producto.productoId, 1)}
                        className="w-6 h-6 rounded-md border border-white/10 bg-white/5 grid place-items-center hover:bg-white/10"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer & Tax Selectors */}
            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
              <div>
                <label className="block font-mono text-[10px] text-purple-200/65 mb-1">
                  CLIENTE / CONVENIO B2B
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#120d1c] px-3 py-2 text-xs text-amber-100 focus:outline-none"
                >
                  {clientes.slice(0, 15).map((c) => (
                    <option key={c.clienteId} value={c.clienteId}>
                      {c.nombre} ({c.tipoClienteNombre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-purple-200/65 mb-1">
                  RÉGIMEN DE IMPUESTO (dbo.TipoImpuesto)
                </label>
                <select
                  value={tipoImpuestoId}
                  onChange={(e) => setTipoImpuestoId(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#120d1c] px-3 py-2 font-mono text-xs text-amber-100 focus:outline-none"
                >
                  <option value={1}>IVA General 16%</option>
                  <option value={2}>Tasa Cero Panificación Básica 0%</option>
                  <option value={3}>IEPS Alta Densidad Calórica 8%</option>
                </select>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-amber-500/20 bg-black/40 p-3 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-purple-200/70">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-purple-200/70">
                <span>Impuestos ({Math.round(taxRate * 100)}%)</span>
                <span>${impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-300 font-bold text-sm pt-1.5 border-t border-white/10">
                <span>TOTAL MXN</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={!cart.length || busy}
              onClick={checkout}
              className="w-full neon-btn rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ejecutando BeginTransactionAsync...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Procesar Venta Atómica</span>
                </>
              )}
            </button>
          </div>
        </Panel>
      </aside>

      {/* Ticket Receipt Modal rendered via Portal to body so parent transforms never trap fixed positioning */}
      {ticket &&
        createPortal(
          <div
            onClick={() => setTicket(null)}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Ticket de venta ${ticket.ventaId}`}
              className="glass-strong neon-border rounded-3xl max-w-md w-full p-6 space-y-5 fade-up my-auto"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 grid place-items-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400">
                  COMMIT CONFIRMADO EN SQL SERVER
                </p>
                <h3 className="font-display text-2xl font-bold text-amber-50">
                  Ticket #{ticket.ventaId}
                </h3>
                <p className="text-xs text-purple-200/70">{ticket.sucursalNombre}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#07050b] p-4 font-mono text-xs space-y-2">
                <div className="flex justify-between text-purple-200/60">
                  <span>Cliente:</span>
                  <span className="text-amber-100">{ticket.clienteNombre}</span>
                </div>
                <div className="border-t border-dashed border-white/15 pt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {(ticket.detalles ?? []).map((d) => (
                    <div key={d.ventaDetalleId} className="flex justify-between">
                      <span className="text-amber-50 truncate pr-2">
                        {d.cantidad}x {d.productoNombre}
                      </span>
                      <span className="text-amber-300">${Number(d.importe ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-white/15 pt-2 flex justify-between font-bold text-sm text-emerald-300">
                  <span>TOTAL PAGADO</span>
                  <span>${Number(ticket.total ?? 0).toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-white/15 py-2.5 text-xs font-medium text-amber-100 hover:bg-white/5 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setTicket(null)}
                  className="neon-btn rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

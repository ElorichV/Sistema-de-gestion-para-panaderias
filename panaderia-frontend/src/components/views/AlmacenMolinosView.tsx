import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Boxes,
  Loader2,
  PackagePlus,
  PlusCircle,
  Search,
  Truck,
  Wheat,
} from 'lucide-react';
import {
  CatalogosBundleDto,
  CompraResponseDto,
  InventarioItem,
  Producto,
} from '../../types/api';
import { api } from '../../services/api';
import { Panel } from '../engine/Widgets';

interface AlmacenMolinosViewProps {
  inventario: InventarioItem[];
  productos: Producto[];
  compras: CompraResponseDto[];
  catalogos: CatalogosBundleDto;
  activeSucursalId: number;
  onSelectSucursal: (id: number) => void;
  onTransactionLogged: (lines: string[]) => void;
  onRefreshData: () => void;
}

export function AlmacenMolinosView({
  inventario,
  productos,
  compras,
  catalogos,
  activeSucursalId,
  onSelectSucursal,
  onTransactionLogged,
  onRefreshData,
}: AlmacenMolinosViewProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'insumos' | 'alerts'>('all');
  const [search, setSearch] = useState('');
  const [adjustItem, setAdjustItem] = useState<InventarioItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(24);
  const [adjustOp, setAdjustOp] = useState<'reabastecer' | 'fijar'>('reabastecer');
  const [busyAdjust, setBusyAdjust] = useState(false);

  useEffect(() => {
    if (!adjustItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAdjustItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [adjustItem]);

  // Purchase form state (POST /api/Compra)
  const insumosList = useMemo(
    () => productos.filter((p) => p.esInsumo || !p.esVendible),
    [productos]
  );
  const [proveedorId, setProveedorId] = useState<number>(
    catalogos.proveedores[0]?.proveedorId ?? 1
  );
  const [insumoId, setInsumoId] = useState<number>(insumosList[0]?.productoId ?? 37);
  const [compraCant, setCompraCant] = useState<number>(8);
  const [compraCosto, setCompraCosto] = useState<number>(595);
  const [busyCompra, setBusyCompra] = useState(false);

  const branchItems = useMemo(() => {
    return inventario.filter((i) => {
      if (i.sucursalId !== activeSucursalId) return false;
      if (filterMode === 'insumos' && !i.esInsumo) return false;
      if (filterMode === 'alerts' && i.cantidadStock >= 10) return false;
      if (
        search &&
        !i.productoNombre.toLowerCase().includes(search.toLowerCase()) &&
        !i.tipoProductoNombre.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [inventario, activeSucursalId, filterMode, search]);

  const criticalCount = useMemo(
    () =>
      inventario.filter((i) => i.sucursalId === activeSucursalId && i.cantidadStock < 10).length,
    [inventario, activeSucursalId]
  );

  const submitAdjust = async () => {
    if (!adjustItem) return;
    setBusyAdjust(true);
    await api.actualizarStock({
      sucursalId: adjustItem.sucursalId,
      productoId: adjustItem.productoId,
      cantidad: adjustQty,
      operacion: adjustOp,
    });
    setBusyAdjust(false);
    onTransactionLogged([
      `[${new Date().toTimeString().slice(0, 8)}] POST /api/Inventario/actualizar-stock (${adjustOp}: ${adjustQty})`,
      `[commit] Inventario actualizado para '${adjustItem.productoNombre}' en ${adjustItem.sucursalNombre}`,
    ]);
    setAdjustItem(null);
    onRefreshData();
  };

  const submitCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyCompra(true);
    const res = await api.registrarCompra({
      proveedorId,
      sucursalId: activeSucursalId,
      empleadoId: 7,
      detalles: [
        {
          productoId: insumoId,
          cantidad: compraCant,
          costoUnitario: compraCosto,
        },
      ],
    });
    setBusyCompra(false);

    if (res.success && res.data) {
      onTransactionLogged([
        `[${new Date().toTimeString().slice(0, 8)}] POST /api/Compra -> HTTP 201 (${res.latencyMs}ms)`,
        `[commit] Orden de Compra #${res.data.compraId} recibida ($${res.data.total.toFixed(2)} MXN) + CostoPromedio recalculado`,
      ]);
      onRefreshData();
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_390px] fade-up items-start">
      {/* Left: Multi-Branch Stock Matrix */}
      <div className="space-y-4 min-w-0">
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'Todo el Almacén'],
                ['insumos', 'Harinas & Materias Primas'],
                ['alerts', `Alertas / Agotados (${criticalCount})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilterMode(k)}
                className={`rounded-xl px-3 py-1.5 font-mono text-xs border transition-all ${
                  filterMode === k
                    ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                    : 'border-white/10 bg-black/30 text-purple-200/70 hover:text-amber-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-amber-400/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar SKU..."
                className="rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-amber-50 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <select
              value={activeSucursalId}
              onChange={(e) => onSelectSucursal(Number(e.target.value))}
              aria-label="Sucursal de almacén"
              className="rounded-xl border border-amber-400/30 bg-[#120d1c] px-3 py-1.5 font-mono text-xs text-amber-200 focus:outline-none"
            >
              {catalogos.sucursales.map((s) => (
                <option key={s.sucursalId} value={s.sucursalId}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Panel
          title={
            <>
              <Boxes className="w-4 h-4 text-amber-400" />
              <span>Existencias Indexadas por UQ_Inventario_Producto_Sucursal</span>
            </>
          }
          action={
            <span className="font-mono text-[10px] text-purple-200/65">
              {branchItems.length} registros visibles
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 font-mono text-[10.5px] uppercase text-purple-200/60 bg-black/25">
                <tr>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Producto / Insumo</th>
                  <th className="px-4 py-2.5">Familia</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Horno / Ajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {branchItems.map((item) => {
                  const out = item.cantidadStock <= 0;
                  const low = item.cantidadStock > 0 && item.cantidadStock < 10;
                  return (
                    <tr key={item.inventarioId} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5 font-mono text-purple-300/70">
                        #{item.productoId}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-amber-50">{item.productoNombre}</div>
                        {item.esInsumo && (
                          <span className="font-mono text-[9.5px] text-amber-300/80">
                            MATERIA PRIMA OBRADOR
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-purple-200/70">{item.tipoProductoNombre}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-amber-200 tabular-nums">
                        {item.cantidadStock} <span className="text-purple-300/60">{item.unidadMedida}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            out
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              : low
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25'
                          }`}
                        >
                          {out && <AlertTriangle className="w-3 h-3" />}
                          {out ? 'Agotado' : low ? 'Crítico' : 'Óptimo'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustQty(24);
                            setAdjustOp('reabastecer');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10.5px] text-amber-200 hover:bg-amber-500/20"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Hornear / Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Right: Supplier Purchase ACID Form + Recent Purchases */}
      <aside className="space-y-4">
        <Panel
          title={
            <>
              <Wheat className="w-4 h-4 text-amber-400" />
              <span>Recepción de Molino (POST /api/Compra)</span>
            </>
          }
          subtitle="Incrementa stock y recalcula CostoPromedio Ponderado"
        >
          <form onSubmit={submitCompra} className="p-4 space-y-3 text-xs">
            <div>
              <label className="block font-mono text-[10px] text-purple-200/70 mb-1">
                PROVEEDOR FISCAL (dbo.Proveedores)
              </label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#120d1c] px-3 py-2 text-amber-100 focus:outline-none"
              >
                {catalogos.proveedores.slice(0, 12).map((p) => (
                  <option key={p.proveedorId} value={p.proveedorId}>
                    {p.nombreFiscal} ({p.rfc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-purple-200/70 mb-1">
                INSUMO / MATERIA PRIMA
              </label>
              <select
                value={insumoId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setInsumoId(id);
                  const found = insumosList.find((x) => x.productoId === id);
                  if (found && found.costoPromedio > 0) setCompraCosto(found.costoPromedio);
                }}
                className="w-full rounded-xl border border-white/10 bg-[#120d1c] px-3 py-2 text-amber-100 focus:outline-none"
              >
                {insumosList.map((ins) => (
                  <option key={ins.productoId} value={ins.productoId}>
                    {ins.nombre} (Costo prom: ${ins.costoPromedio})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] text-purple-200/70 mb-1">
                  CANTIDAD RECIBIDA
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={compraCant}
                  onChange={(e) => setCompraCant(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-amber-100"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-purple-200/70 mb-1">
                  COSTO UNITARIO MXN
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.5"
                  value={compraCosto}
                  onChange={(e) => setCompraCosto(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-amber-100"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 p-2.5 flex justify-between font-mono text-xs">
              <span className="text-purple-200/70">Importe Orden Compra:</span>
              <span className="text-amber-300 font-bold">
                ${(compraCant * compraCosto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </span>
            </div>

            <button
              type="submit"
              disabled={busyCompra}
              className="w-full neon-btn rounded-xl py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {busyCompra ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackagePlus className="w-4 h-4" />
              )}
              <span>Registrar Recepción ACID</span>
            </button>
          </form>
        </Panel>

        <Panel
          title={
            <>
              <Truck className="w-4 h-4 text-purple-300" />
              <span>Últimas Recepciones en dbo.Compras</span>
            </>
          }
        >
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
            {compras.slice(0, 6).map((c) => (
              <div
                key={c.compraId}
                className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs space-y-1"
              >
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-amber-300 font-semibold">OC #{c.compraId}</span>
                  <span className="text-emerald-400">${c.total.toLocaleString('es-MX')}</span>
                </div>
                <p className="text-amber-50 font-medium truncate">{c.proveedorNombre}</p>
                <p className="font-mono text-[10px] text-purple-200/60">
                  {c.fechaRecepcion} · {c.sucursalNombre}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </aside>

      {/* Adjust Stock Modal rendered via Portal to body */}
      {adjustItem &&
        createPortal(
          <div
            onClick={() => setAdjustItem(null)}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="glass-strong neon-border rounded-3xl max-w-md w-full p-6 space-y-4 fade-up my-auto"
            >
              <div>
                <span className="font-mono text-[10px] text-amber-300 tracking-widest">
                  HORNEADO Y REABASTECIMIENTO DIRECTO
                </span>
                <h3 className="font-display text-xl font-bold text-amber-50 mt-1">
                  {adjustItem.productoNombre}
                </h3>
                <p className="text-xs text-purple-200/70">{adjustItem.sucursalNombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setAdjustOp('reabastecer')}
                  className={`rounded-xl py-2 border ${
                    adjustOp === 'reabastecer'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                      : 'border-white/10 text-purple-200/70'
                  }`}
                >
                  + Sumar Lote Horneado
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustOp('fijar')}
                  className={`rounded-xl py-2 border ${
                    adjustOp === 'fijar'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                      : 'border-white/10 text-purple-200/70'
                  }`}
                >
                  = Fijar Conteo Físico
                </button>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-purple-200/70 mb-1">
                  CANTIDAD ({adjustItem.unidadMedida})
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-amber-400/30 bg-black/50 px-3 py-2 font-mono text-base text-amber-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs text-purple-200 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busyAdjust}
                  onClick={submitAdjust}
                  className="neon-btn rounded-xl px-5 py-2 text-xs"
                >
                  {busyAdjust ? 'Guardando...' : 'Confirmar en Inventario'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

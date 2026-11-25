import { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Database,
  Flame,
  Layers,
  Receipt,
  ShieldCheck,
  Sparkles,
  Store,
  Wheat,
} from 'lucide-react';
import {
  CatalogosBundleDto,
  DatabaseAnalyticsDto,
  DatabaseTelemetryDto,
} from '../../types/api';
import { HearthGradient } from '../engine/HearthGradient';
import { HorizontalRankBars, HistoricalAreaChart } from '../engine/Charts';
import { Panel, SparkKpi, SqlTerminal } from '../engine/Widgets';

interface OverviewConsoleProps {
  telemetry: DatabaseTelemetryDto;
  analytics: DatabaseAnalyticsDto;
  catalogos: CatalogosBundleDto;
  selectedYear: number | null;
  onSelectYear: (y: number | null) => void;
  selectedSucursalId: number | null;
  onSelectSucursal: (id: number | null) => void;
  onNavigate: (tab: 'overview' | 'schema' | 'apilab' | 'pos' | 'almacen') => void;
  logs: string[];
  onClearLogs: () => void;
}

export function OverviewConsole({
  telemetry,
  analytics,
  catalogos,
  selectedYear,
  onSelectYear,
  selectedSucursalId,
  onSelectSucursal,
  onNavigate,
  logs,
  onClearLogs,
}: OverviewConsoleProps) {
  const [inspectedProdId, setInspectedProdId] = useState<number>(
    analytics.topProductos[0]?.productoId ?? 10
  );

  const inspectedProd =
    analytics.topProductos.find((p) => p.productoId === inspectedProdId) ??
    analytics.topProductos[0];

  const serieIngresos = analytics.serieMensual.map((m) => m.ingresos);
  const serieTickets = analytics.serieMensual.map((m) => m.tickets);
  const serieCompras = analytics.serieMensual.map((m) => m.compras);
  const serieMargen = analytics.serieMensual.map((m) => m.margenBruto);

  const totalPeriodoIngresos = analytics.serieMensual.reduce((s, x) => s + x.ingresos, 0);
  const totalPeriodoTickets = analytics.serieMensual.reduce((s, x) => s + x.tickets, 0);
  const totalPeriodoCompras = analytics.serieMensual.reduce((s, x) => s + x.compras, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_350px] fade-up">
      <div className="min-w-0 space-y-4">
        {/* Hero Hearth Banner (BenchEngine DNA) */}
        <section className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-[#0b0910]">
          <HearthGradient className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0910]/95 via-[#0b0910]/65 to-transparent" />

          <div className="relative grid gap-5 p-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <p className="font-mono text-[11px] tracking-[0.32em] text-amber-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                RELATIONAL HEARTH · .NET 8 CLEAN ARCHITECTURE
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-amber-50 md:text-4xl leading-tight">
                Tres años de masa madre,{' '}
                <span className="neon-shimmer">trazados al centavo en SQL.</span>
              </h1>
              <p className="mt-2.5 max-w-xl text-sm text-purple-100/75 leading-relaxed">
                Observatorio técnico de <strong className="text-amber-200">{telemetry.databaseName}</strong>: 15 tablas normalizadas (3FN), transacciones ACID con rollback automático, columnas calculadas e índices cubrientes sobre{' '}
                <span className="font-mono text-emerald-300">{telemetry.totalRowsGlobal.toLocaleString('es-MX')}</span> registros reales.
              </p>

              {/* Year & Branch Filter Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-purple-200/60 mr-1">HORIZONTE:</span>
                {([null, 2024, 2025, 2026] as const).map((yr) => {
                  const active = selectedYear === yr;
                  return (
                    <button
                      key={String(yr)}
                      onClick={() => onSelectYear(yr)}
                      className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all ${
                        active
                          ? 'border-amber-400 bg-amber-500/20 text-amber-100 shadow-[0_0_14px_-3px_rgba(245,158,11,0.6)]'
                          : 'border-white/10 bg-black/30 text-purple-200/70 hover:text-amber-100 hover:border-amber-500/40'
                      }`}
                    >
                      {yr === null ? '3 Años (2024–2026)' : yr}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-purple-200/60 mr-1">HORNO:</span>
                <button
                  onClick={() => onSelectSucursal(null)}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all ${
                    selectedSucursalId === null
                      ? 'border-purple-400 bg-purple-500/25 text-purple-100'
                      : 'border-white/10 bg-black/30 text-purple-200/70 hover:text-amber-100'
                  }`}
                >
                  Todas (5)
                </button>
                {catalogos.sucursales.map((s) => (
                  <button
                    key={s.sucursalId}
                    onClick={() => onSelectSucursal(s.sucursalId)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-all ${
                      selectedSucursalId === s.sucursalId
                        ? 'border-purple-400 bg-purple-500/25 text-purple-100'
                        : 'border-white/10 bg-black/30 text-purple-200/70 hover:text-amber-100'
                    }`}
                  >
                    {s.nombre.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Quick-Launch Card */}
            <div className="glass neon-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  MOTOR TRANSACCIONAL ACTIVO
                </span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                  3FN · ACID
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <span className="text-[10px] text-purple-200/60 block">VALUACIÓN STOCK</span>
                  <span className="text-amber-300 font-semibold text-sm">
                    ${Math.round(telemetry.valorInventarioActual).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
                  <span className="text-[10px] text-purple-200/60 block">VENTANA ACTIVA</span>
                  <span className="text-purple-200 font-semibold text-sm">
                    {telemetry.mesesOperacion} meses
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onNavigate('apilab')}
                  className="neon-btn rounded-xl py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Probar Endpoints</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('schema')}
                  className="glass hover-lift rounded-xl py-2.5 px-3 text-xs font-medium text-amber-100 flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-purple-300" />
                  <span>Mapa 15 Tablas</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Sparkline KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SparkKpi
            label="Registros Relacionales"
            value={telemetry.totalRowsGlobal.toLocaleString('es-MX')}
            unit="filas"
            delta={`${telemetry.totalTables} tablas · 4 índices INCLUDE`}
            tone="emerald"
            series={serieMargen}
            icon={<Database className="w-4 h-4" />}
          />
          <SparkKpi
            label={selectedYear ? `Ingresos POS (${selectedYear})` : 'Ingresos POS (3 Años)'}
            value={`$${(totalPeriodoIngresos / 1_000_000).toFixed(2)}M`}
            unit="MXN"
            delta="↑ +21.8% CAGR · SARGable GroupBy"
            tone="amber"
            series={serieIngresos}
            icon={<Flame className="w-4 h-4" />}
          />
          <SparkKpi
            label="Tickets Emitidos"
            value={totalPeriodoTickets.toLocaleString('es-MX')}
            unit="ventas"
            delta={`${telemetry.totalLineasDetalleVenta.toLocaleString('es-MX')} líneas VentaDetalle`}
            tone="purple"
            series={serieTickets}
            icon={<Receipt className="w-4 h-4" />}
          />
          <SparkKpi
            label="Insumos & Molinos"
            value={`$${(totalPeriodoCompras / 1_000_000).toFixed(2)}M`}
            unit="MXN"
            delta={`${telemetry.totalOrdenesCompra.toLocaleString('es-MX')} recepciones CostoProm`}
            tone="emerald"
            series={serieCompras}
            icon={<Wheat className="w-4 h-4" />}
          />
        </div>

        {/* 36-Month Seasonal Curve */}
        <Panel
          title={
            <>
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Curva Histórica de Horneado, Ventas e Insumos ({analytics.serieMensual.length} meses)</span>
            </>
          }
          subtitle="Picos estacionales verificables en Enero (Rosca de Reyes) y Octubre–Noviembre (Pan de Muerto)"
          action={
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-400/25 px-2 py-0.5 rounded-full">
              IX_Ventas_FechaHora_Sucursal SEEK
            </span>
          }
        >
          <HistoricalAreaChart data={analytics.serieMensual} />
        </Panel>

        {/* Dual Rank Panels: Branches & Top Artisan Products */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={
              <>
                <Store className="w-4 h-4 text-purple-300" />
                <span>Rendimiento por Horno / Sucursal</span>
              </>
            }
            action={<span className="font-mono text-[10px] text-purple-200/60">Clic para filtrar</span>}
          >
            <HorizontalRankBars
              items={analytics.rendimientoSucursales.map((b) => ({
                id: b.sucursalId,
                title: b.sucursalNombre,
                subtitle: `${b.tickets.toLocaleString('es-MX')} tickets · Promedio $${b.ticketPromedio.toFixed(0)} MXN · Stock: ${b.unidadesEnStock.toLocaleString('es-MX')} u.`,
                value: b.ingresos,
                formatted: `$${(b.ingresos / 1000).toFixed(1)}k`,
              }))}
              selectedId={selectedSucursalId}
              onSelect={(id) =>
                onSelectSucursal(selectedSucursalId === Number(id) ? null : Number(id))
              }
            />
          </Panel>

          <Panel
            title={
              <>
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Panadería de Autor con Mayor Facturación</span>
              </>
            }
            action={<span className="font-mono text-[10px] text-amber-300">Clic para inspeccionar</span>}
          >
            <HorizontalRankBars
              items={analytics.topProductos.slice(0, 5).map((p) => ({
                id: p.productoId,
                title: p.nombre,
                subtitle: `${p.categoria} · ${p.unidadesVendidas.toLocaleString('es-MX')} pzas · Margen ${p.margenPorcentaje}%`,
                value: p.ingresos,
                formatted: `$${(p.ingresos / 1000).toFixed(1)}k`,
              }))}
              selectedId={inspectedProd?.productoId}
              onSelect={(id) => setInspectedProdId(Number(id))}
            />
          </Panel>
        </div>
      </div>

      {/* Right Technical Inspector + SQL Console (BenchEngine Sidebar Pattern) */}
      <aside className="space-y-4">
        {inspectedProd && (
          <Panel
            title="Inspector de Receta & Margen SQL"
            action={
              <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                SKU #{inspectedProd.productoId}
              </span>
            }
          >
            <div className="p-4 space-y-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-purple-300">
                  {inspectedProd.categoria}
                </span>
                <h4 className="font-display text-lg font-semibold text-amber-50 mt-0.5">
                  {inspectedProd.nombre}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                  <span className="text-[10px] text-purple-200/55 block">INGRESO ACUMULADO</span>
                  <span className="text-amber-300 text-sm font-semibold">
                    ${inspectedProd.ingresos.toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                  <span className="text-[10px] text-purple-200/55 block">PIEZAS DESPACHADAS</span>
                  <span className="text-emerald-300 text-sm font-semibold">
                    {inspectedProd.unidadesVendidas.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-purple-200/70">Margen Bruto sobre Costo Promedio</span>
                  <span className="text-emerald-400 font-semibold">{inspectedProd.margenPorcentaje}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                    style={{ width: `${Math.min(100, Math.max(10, inspectedProd.margenPorcentaje))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 font-mono text-[10.5px] text-purple-200/80 space-y-1">
                <div className="text-amber-300 font-semibold">// Traza de Agregación EF Core 8</div>
                <div>.AsNoTracking()</div>
                <div>.Where(vd =&gt; vd.Venta.Estatus == &quot;Completada&quot;)</div>
                <div>.GroupBy(vd =&gt; vd.ProductoId)</div>
                <div className="text-emerald-400">// Usa IX_VentaDetalle_ProductoID INCLUDE</div>
              </div>
            </div>
          </Panel>
        )}

        {/* Distribution by Bakery Family */}
        <Panel title="Mezcla por Familia de Panificación">
          <div className="p-4 space-y-2.5">
            {analytics.distribucionCategorias.slice(0, 5).map((cat) => {
              const maxCat = analytics.distribucionCategorias[0]?.ingresos || 1;
              const pct = Math.round((cat.ingresos / maxCat) * 100);
              return (
                <div key={cat.categoria} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-50/90 truncate">{cat.categoria}</span>
                    <span className="font-mono text-[11px] text-amber-300">
                      ${(cat.ingresos / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <SqlTerminal logs={logs} onClear={onClearLogs} />
      </aside>
    </div>
  );
}

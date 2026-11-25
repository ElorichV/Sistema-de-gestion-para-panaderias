import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Boxes,
  Database,
  ExternalLink,
  Flame,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Server,
  Sparkles,
  Store,
  Terminal,
  X,
} from 'lucide-react';
import {
  CatalogosBundleDto,
  Cliente,
  CompraResponseDto,
  DatabaseAnalyticsDto,
  DatabaseTelemetryDto,
  InventarioItem,
  Producto,
} from './types/api';
import {
  buildSnapshotInventario,
  getSnapshotAnalytics,
  SNAPSHOT_CATALOGOS,
  SNAPSHOT_CLIENTES,
  SNAPSHOT_COMPRAS,
  SNAPSHOT_PRODUCTOS,
  SNAPSHOT_TELEMETRY,
} from './services/mockSnapshot';
import { api } from './services/api';
import { IntroPortal } from './components/engine/Widgets';
import { OverviewConsole } from './components/views/OverviewConsole';
import { SchemaExplorer } from './components/views/SchemaExplorer';
import { ApiAcidLab } from './components/views/ApiAcidLab';
import { TahonaPosView } from './components/views/TahonaPosView';
import { AlmacenMolinosView } from './components/views/AlmacenMolinosView';

type TabKey = 'overview' | 'schema' | 'apilab' | 'pos' | 'almacen';

const NAV_ITEMS: { id: TabKey; label: string; sub: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Observatorio 3 Años', sub: 'KPIs & Estacionalidad', icon: LayoutDashboard },
  { id: 'schema', label: 'Esquema 15 Tablas', sub: '3FN, DDL & Índices', icon: Database },
  { id: 'apilab', label: 'Endpoints & ACID Lab', sub: 'Commit vs Rollback', icon: Terminal },
  { id: 'pos', label: 'La Tahona POS', sub: 'Vitrina & Facturación', icon: Store },
  { id: 'almacen', label: 'Almacén & Molinos', sub: 'Insumos & CostoProm', icon: Boxes },
];

export function App() {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('tahona_intro_seen') !== '1';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [filterSucursalId, setFilterSucursalId] = useState<number | null>(null);
  const [posSucursalId, setPosSucursalId] = useState<number>(1);

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number>(4.2);
  const [syncing, setSyncing] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<DatabaseTelemetryDto>(SNAPSHOT_TELEMETRY);
  const [analytics, setAnalytics] = useState<DatabaseAnalyticsDto>(() =>
    getSnapshotAnalytics(null, null)
  );
  const [catalogos, setCatalogos] = useState<CatalogosBundleDto>(SNAPSHOT_CATALOGOS);
  const [productos, setProductos] = useState<Producto[]>(SNAPSHOT_PRODUCTOS);
  const [inventario, setInventario] = useState<InventarioItem[]>(() => buildSnapshotInventario());
  const [clientes, setClientes] = useState<Cliente[]>(SNAPSHOT_CLIENTES);
  const [compras, setCompras] = useState<CompraResponseDto[]>(SNAPSHOT_COMPRAS);

  const [logs, setLogs] = useState<string[]>([
    '[boot] TahonaEngine OS inicializado · Clean Architecture .NET 8 + EF Core 8',
    '[sql] Verificando conectividad con PanaderiaDB (15 tablas normalizadas en 3FN)...',
  ]);

  const appendLogs = useCallback((entries: string[]) => {
    setLogs((prev) => [...prev.slice(-45), ...entries]);
  }, []);

  const refreshAll = useCallback(async () => {
    setSyncing(true);
    const health = await api.checkHealth();
    setIsOnline(health.online);
    setPingMs(health.latencyMs);

    const [telRes, anaRes, cats, prods, invs, clis, comps] = await Promise.all([
      api.getTelemetry(),
      api.getAnalytics(selectedYear, filterSucursalId),
      api.getCatalogos(),
      api.getProductos(),
      api.getInventario(),
      api.getClientes(),
      api.getCompras(),
    ]);

    setTelemetry(telRes.data);
    setAnalytics(anaRes.data);
    setCatalogos(cats);
    setProductos(prods);
    setInventario(invs);
    setClientes(clis);
    setCompras(comps);

    appendLogs([
      health.online
        ? `[commit] Conectado a SQL Server (${telRes.data.databaseName}) · ${telRes.data.totalRowsGlobal.toLocaleString('es-MX')} filas · ping ${health.latencyMs}ms`
        : `[boot] Modo Portafolio Resiliente activo (Snapshot 3 años: 63,503 registros listos)`,
    ]);
    setSyncing(false);
  }, [selectedYear, filterSucursalId, appendLogs]);

  const refreshOperational = useCallback(async () => {
    const [invs, prods, comps] = await Promise.all([
      api.getInventario(),
      api.getProductos(),
      api.getCompras(),
    ]);
    setInventario(invs);
    setProductos(prods);
    setCompras(comps);

    // Actualizar telemetría y analítica en segundo plano sin bloquear el POS
    void Promise.all([
      api.getTelemetry(),
      api.getAnalytics(selectedYear, filterSucursalId),
    ]).then(([telRes, anaRes]) => {
      setTelemetry(telRes.data);
      setAnalytics(anaRes.data);
    });
  }, [selectedYear, filterSucursalId]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const finishIntro = () => {
    try {
      sessionStorage.setItem('tahona_intro_seen', '1');
    } catch {
      // ignore storage errors
    }
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0b0910] text-[#faf7f2] relative">
      {showIntro && <IntroPortal onComplete={finishIntro} />}

      {/* Ambient Floating Flour/Ember Spores */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <span className="spore-dot absolute top-24 left-[18%] w-1.5 h-1.5 rounded-full bg-amber-400/35" />
        <span className="spore-dot absolute top-2/3 left-[42%] w-2 h-2 rounded-full bg-purple-400/25" style={{ animationDelay: '1.8s' }} />
        <span className="spore-dot absolute top-1/3 right-[15%] w-1.5 h-1.5 rounded-full bg-emerald-400/30" style={{ animationDelay: '3.1s' }} />
      </div>

      {/* Desktop Sidebar (BenchEngine Layout) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-amber-500/15 glass-strong p-3.5 z-20 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-purple-700 grid place-items-center text-lg shadow-[0_0_20px_-4px_rgba(245,158,11,0.7)]">
            🥖
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-[0.2em] text-amber-50">
              TAHONA<span className="text-amber-400">ENGINE</span>
            </div>
            <p className="font-mono text-[10px] text-purple-200/60">Tanajara DB OS · v3.0</p>
          </div>
        </div>

        <nav className="mt-5 space-y-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  active
                    ? 'bg-amber-500/15 text-amber-50 border border-amber-400/35 shadow-[inset_3px_0_0_#fbbf24]'
                    : 'text-purple-100/65 hover:bg-white/[0.04] hover:text-amber-100 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-purple-300/70'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{item.label}</div>
                  <div className="font-mono text-[10px] text-purple-200/50 truncate">{item.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom DB Engine Telemetry Card */}
        <div className="mt-auto space-y-2.5 pt-4">
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="w-full rounded-xl border border-purple-400/25 bg-purple-500/10 px-3 py-2 text-xs font-mono text-purple-200 hover:bg-purple-500/20 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Repetir Intro Portal</span>
          </button>

          <div className="rounded-xl border border-amber-500/20 bg-black/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-medium text-amber-100">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Motor SQL
              </span>
              <span className="font-mono text-[10px] text-amber-300">{pingMs}ms</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className={isOnline ? 'text-emerald-300' : 'text-amber-200'}>
                {isOnline ? 'SQL Server Conectado' : 'Snapshot 3 Años'}
              </span>
            </div>

            <p className="font-mono text-[10px] text-purple-200/55 truncate">
              {telemetry.databaseName} · {telemetry.totalRowsGlobal.toLocaleString('es-MX')} filas
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex">
          <div className="w-72 glass-strong h-full p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-amber-300 tracking-widest text-sm">
                🥖 TAHONA ENGINE
              </span>
              <button
                aria-label="Cerrar menú"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                      activeTab === item.id
                        ? 'bg-amber-500/20 text-amber-100 border border-amber-400/40'
                        : 'text-purple-200/75'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Telemetry Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-amber-500/15 bg-[#0b0910]/85 backdrop-blur-md px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir navegación"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-white/10 text-amber-200"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-purple-200/75">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Panificadora Tanajara</span>
              <span className="text-white/20">·</span>
              <span className="text-amber-300">2024–2026 (36 Meses)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11px]">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-purple-200/70">Tablas:</span>
              <span className="text-amber-200 font-semibold">{telemetry.totalTables}</span>
              <span className="text-white/20">|</span>
              <span className="text-purple-200/70">Filas:</span>
              <span className="text-emerald-300 font-semibold">
                {telemetry.totalRowsGlobal.toLocaleString('es-MX')}
              </span>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              title="Sincronizar telemetría con SQL Server"
              className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-2.5 py-1.5 font-mono text-[11px] text-amber-200 hover:bg-amber-500/20 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <a
              href="http://localhost:5064/swagger"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-purple-400/30 bg-purple-500/15 px-3 py-1.5 font-mono text-[11px] text-purple-200 hover:bg-purple-500/25 flex items-center gap-1.5"
            >
              <span>Swagger UI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Active View */}
        <main className="flex-1 p-4 md:p-5 max-w-[1600px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewConsole
              telemetry={telemetry}
              analytics={analytics}
              catalogos={catalogos}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              selectedSucursalId={filterSucursalId}
              onSelectSucursal={setFilterSucursalId}
              onNavigate={setActiveTab}
              logs={logs}
              onClearLogs={() => setLogs(['[boot] Consola reiniciada.'])}
            />
          )}

          {activeTab === 'schema' && <SchemaExplorer telemetry={telemetry} />}

          {activeTab === 'apilab' && (
            <ApiAcidLab
              logs={logs}
              onAppendLogs={appendLogs}
              onClearLogs={() => setLogs(['[boot] Consola reiniciada.'])}
              onDataMutated={refreshOperational}
            />
          )}

          {activeTab === 'pos' && (
            <TahonaPosView
              productos={productos}
              inventario={inventario}
              sucursales={catalogos.sucursales}
              clientes={clientes}
              activeSucursalId={posSucursalId}
              onSelectSucursal={setPosSucursalId}
              onTransactionLogged={appendLogs}
              onRefreshData={refreshOperational}
            />
          )}

          {activeTab === 'almacen' && (
            <AlmacenMolinosView
              inventario={inventario}
              productos={productos}
              compras={compras}
              catalogos={catalogos}
              activeSucursalId={posSucursalId}
              onSelectSucursal={setPosSucursalId}
              onTransactionLogged={appendLogs}
              onRefreshData={refreshOperational}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

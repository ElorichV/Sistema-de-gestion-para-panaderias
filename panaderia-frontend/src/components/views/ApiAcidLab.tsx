import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code,
  Loader2,
  Play,
  ShieldAlert,
  Terminal as TerminalIcon,
  Workflow,
} from 'lucide-react';
import { EndpointExecutionResult } from '../../types/api';
import { api } from '../../services/api';
import { Panel, SqlTerminal } from '../engine/Widgets';

interface PresetEndpoint {
  id: string;
  badge: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  description: string;
  sqlSteps: string[];
  defaultBody?: unknown;
}

const PRESETS: PresetEndpoint[] = [
  {
    id: 'telemetry',
    badge: '15 TABLAS',
    method: 'GET',
    path: '/api/Database/telemetry',
    title: 'Telemetría Global de PanaderiaDB',
    description: 'Consulta conteos reales de las 15 tablas, valuación financiera del inventario e índices activos.',
    sqlSteps: [
      '[sql] SELECT COUNT(*) sobre las 15 entidades normalizadas (AsNoTracking)',
      '[sql] SUM(CantidadStock * CostoPromedio) -> Valuación de almacén en vivo',
    ],
  },
  {
    id: 'analytics-2026',
    badge: 'SARGABLE SQL',
    method: 'GET',
    path: '/api/Database/analytics?anio=2026',
    title: 'Analítica Agregada 2026 (Index Seek)',
    description: 'Ejecuta GROUP BY mensual y ranking de sucursales usando rangos de fecha SARGables sin escanear toda la tabla.',
    sqlSteps: [
      "[sql] WHERE FechaHora >= '2026-01-01' AND FechaHora < '2027-01-01' (Index Seek en IX_Ventas_FechaHora_Sucursal)",
      '[sql] GROUP BY YEAR(FechaHora), MONTH(FechaHora) proyectado directo a DTO',
    ],
  },
  {
    id: 'acid-venta-ok',
    badge: 'ACID COMMIT 201',
    method: 'POST',
    path: '/api/Venta',
    title: 'Transacción Venta Atómica Exitosa',
    description: 'Descuenta 2 Conchas de Vainilla y 1 Baguette Masa Madre en Matriz Centro dentro de BeginTransactionAsync().',
    sqlSteps: [
      '[sql] BEGIN TRANSACTION -> SEEK UQ_Inventario_Producto_Sucursal (SucursalID=1)',
      '[sql] UPDATE Inventario SET CantidadStock = CantidadStock - @cant; INSERT INTO Ventas & VentaDetalle',
    ],
    defaultBody: {
      sucursalId: 1,
      empleadoId: 2,
      clienteId: 2,
      tipoImpuestoId: 1,
      detalles: [
        { productoId: 1, cantidad: 2, precioUnitario: 18.0 },
        { productoId: 13, cantidad: 1, precioUnitario: 34.0 },
      ],
    },
  },
  {
    id: 'acid-venta-rollback',
    badge: 'ACID ROLLBACK 400',
    method: 'POST',
    path: '/api/Venta',
    title: 'Simular Colisión Sin Stock (Rollback)',
    description: 'Intenta vender 5 rebanadas de Cheesecake Vasco Tostado (agotado = 0 en Matriz) disparando StockInsuficienteException.',
    sqlSteps: [
      '[sql] BEGIN TRANSACTION -> Verificando ProductoID=22 en SucursalID=1 (StockDisponible = 0.00)',
      '[sql] StockInsuficienteException lanzada -> ROLLBACK TRANSACTION inmediato (0 filas alteradas)',
    ],
    defaultBody: {
      sucursalId: 1,
      empleadoId: 2,
      clienteId: 1,
      tipoImpuestoId: 1,
      detalles: [
        { productoId: 1, cantidad: 2, precioUnitario: 18.0 },
        { productoId: 22, cantidad: 5, precioUnitario: 72.0 },
      ],
    },
  },
  {
    id: 'acid-compra-harina',
    badge: 'COSTO PROMEDIO',
    method: 'POST',
    path: '/api/Compra',
    title: 'Recepción de Harina W320 (Compra ACID)',
    description: 'Registra entrada de 6 bultos de Harina Fuerza W320 del molino proveedor, incrementando stock y recalculando CostoPromedio.',
    sqlSteps: [
      '[sql] BEGIN TRANSACTION -> Recálculo de Costo Promedio Ponderado en dbo.Productos (ID=37)',
      '[sql] INSERT INTO Compras & CompraDetalle; UPDATE Inventario SET CantidadStock += 6',
    ],
    defaultBody: {
      proveedorId: 1,
      sucursalId: 1,
      empleadoId: 7,
      detalles: [
        { productoId: 37, cantidad: 6, costoUnitario: 592.0 },
      ],
    },
  },
  {
    id: 'catalogos',
    badge: '3FN LOOKUPS',
    method: 'GET',
    path: '/api/Database/catalogos',
    title: 'Bundle de Catálogos y Maestros',
    description: 'Inspecciona Sucursales, Empleados, Proveedores, Puestos, Unidades de Medida y Tasas de Impuesto.',
    sqlSteps: [
      '[sql] Proyección limpia a DTOs sin ciclos de navegación sobre catálogos 3FN',
    ],
  },
];

interface ApiAcidLabProps {
  logs: string[];
  onAppendLogs: (entries: string[]) => void;
  onClearLogs: () => void;
  onDataMutated: () => void;
}

export function ApiAcidLab({
  logs,
  onAppendLogs,
  onClearLogs,
  onDataMutated,
}: ApiAcidLabProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetEndpoint>(PRESETS[2]!);
  const [bodyText, setBodyText] = useState<string>(
    JSON.stringify(PRESETS[2]!.defaultBody, null, 2)
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EndpointExecutionResult | null>(null);

  const pickPreset = (p: PresetEndpoint) => {
    setSelectedPreset(p);
    setBodyText(p.defaultBody ? JSON.stringify(p.defaultBody, null, 2) : '');
  };

  const runEndpoint = async () => {
    setBusy(true);
    let parsedBody: unknown = undefined;
    if (selectedPreset.method === 'POST' && bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        onAppendLogs(['[rollback] Error de sintaxis JSON en el payload de entrada']);
        setBusy(false);
        return;
      }
    }

    const execRes = await api.executeLabEndpoint(
      selectedPreset.method,
      selectedPreset.path,
      parsedBody,
      selectedPreset.sqlSteps
    );
    setResult(execRes);
    onAppendLogs(execRes.sqlTrace);
    if (selectedPreset.method === 'POST' && execRes.status < 300) {
      onDataMutated();
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr] fade-up">
      {/* Left: Preset Endpoints Catalog */}
      <div className="space-y-3">
        <Panel
          title={
            <>
              <Workflow className="w-4 h-4 text-amber-400" />
              <span>Catálogo de Endpoints C# (.NET 8)</span>
            </>
          }
          subtitle="Thin Controllers + DTOs + ExecutionStrategy ACID"
        >
          <div className="p-3 space-y-2">
            {PRESETS.map((p) => {
              const active = p.id === selectedPreset.id;
              const isPost = p.method === 'POST';
              const isRollbackDemo = p.id === 'acid-venta-rollback';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPreset(p)}
                  className={`w-full text-left rounded-xl p-3 border transition-all ${
                    active
                      ? 'neon-border border-amber-400/60 bg-amber-500/10'
                      : 'border-white/10 bg-black/30 hover:border-amber-400/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        isRollbackDemo
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          : isPost
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {p.method}
                    </span>
                    <span className="font-mono text-[10px] text-purple-300">{p.badge}</span>
                  </div>
                  <p className="mt-1.5 font-display text-sm font-semibold text-amber-50">
                    {p.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[10.5px] text-amber-200/70 truncate">
                    {p.path}
                  </p>
                  <p className="mt-1 text-[11px] text-purple-200/65 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Right: Interactive Execution Sandbox & Response Inspector */}
      <div className="space-y-4 min-w-0">
        <Panel
          title={
            <>
              <TerminalIcon className="w-4 h-4 text-amber-400" />
              <span>Workbench de Ejecución HTTP &amp; Transacciones SQL</span>
            </>
          }
          action={
            <button
              onClick={runEndpoint}
              disabled={busy}
              className="neon-btn rounded-xl px-4 py-1.5 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{busy ? 'Ejecutando...' : 'Disparar Petición'}</span>
            </button>
          }
        >
          <div className="p-4 space-y-4">
            {/* URL Bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-[#07050b] px-3.5 py-2.5 font-mono text-xs">
              <span
                className={`font-bold ${
                  selectedPreset.method === 'POST' ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {selectedPreset.method}
              </span>
              <span className="text-amber-50 break-all flex-1">{selectedPreset.path}</span>
              <span className="text-[10px] text-purple-300/70">Content-Type: application/json</span>
            </div>

            {/* Pipeline Visualization */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10.5px]">
              {[
                ['1. Thin Controller', 'ModelState + DTO In'],
                ['2. App Service', 'Reglas + Impuestos'],
                ['3. EF Core Strategy', 'BeginTransactionAsync'],
                ['4. SQL Server', 'IX Seek + Commit/Rollback'],
              ].map(([step, desc]) => (
                <div key={step} className="rounded-xl border border-purple-400/20 bg-purple-950/20 p-2.5">
                  <div className="text-amber-300 font-semibold">{step}</div>
                  <div className="text-purple-200/65 mt-0.5">{desc}</div>
                </div>
              ))}
            </div>

            {/* Editable Payload for POST */}
            {selectedPreset.method === 'POST' && (
              <div>
                <label className="block font-mono text-[11px] text-purple-200/75 mb-1.5">
                  Payload JSON de Entrada (Editable para pruebas de estrés / bordes):
                </label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  className="w-full rounded-xl border border-amber-500/25 bg-[#07050b] p-3 font-mono text-xs text-amber-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}

            {/* Response Box */}
            {result ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 font-mono text-xs">
                  <div className="flex items-center gap-2.5">
                    {result.status < 300 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        HTTP {result.status} OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        HTTP {result.status} ROLLBACK PROTEGIDO
                      </span>
                    )}
                    <span className="text-purple-200/60">|</span>
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      {result.latencyMs} ms
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-300">
                    Origen: {result.source === 'live-sql' ? 'SQL Server Live (.NET 8)' : 'Snapshot Integrado 3 Años'}
                  </span>
                </div>

                <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-[#07050b] p-4 font-mono text-[11px] text-emerald-200/95 leading-relaxed">
                  {JSON.stringify(result.responseBody, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-500/25 bg-black/25 p-8 text-center">
                <Code className="w-7 h-7 text-amber-400/70 mx-auto mb-2" />
                <p className="font-display text-sm text-amber-100">
                  Selecciona un escenario y presiona «Disparar Petición»
                </p>
                <p className="text-xs text-purple-200/60 mt-1">
                  Puedes comprobar tanto una venta transaccional exitosa (<code className="font-mono text-emerald-300">201 Created</code>) como la protección contra stock negativo (<code className="font-mono text-rose-300">400 STOCK_INSUFICIENTE</code>).
                </p>
              </div>
            )}
          </div>
        </Panel>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3 text-xs text-amber-100/85">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Tip para Reclutadores / Revisión Técnica:</strong> Ejecuta primero{' '}
            <code className="font-mono text-rose-300">Simular Colisión Sin Stock</code> para observar el rollback atómico y luego reabastece el Cheesecake Vasco desde la pestaña <strong>Almacén &amp; Molinos</strong>.
          </span>
        </div>

        <SqlTerminal logs={logs} onClear={onClearLogs} />
      </div>
    </div>
  );
}

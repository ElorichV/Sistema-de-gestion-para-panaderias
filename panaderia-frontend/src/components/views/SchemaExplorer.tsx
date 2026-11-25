import { useState } from 'react';
import {
  Code2,
  Database,
  GitBranch,
  KeyRound,
  Layers,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DatabaseTelemetryDto, TableMetricDto } from '../../types/api';
import { SCHEMA_SPECS } from '../../services/mockSnapshot';
import { Panel } from '../engine/Widgets';
import { DatabaseMapsCanvas } from './DatabaseMapsCanvas';

interface SchemaExplorerProps {
  telemetry: DatabaseTelemetryDto;
}

const GROUPS = [
  'Núcleo Transaccional ACID',
  'Entidades Maestras',
  'Catálogos Lookup',
] as const;

export function SchemaExplorer({ telemetry }: SchemaExplorerProps) {
  const [selectedTable, setSelectedTable] = useState<string>('Ventas');
  const [inspectorTab, setInspectorTab] = useState<'ddl' | 'ef' | 'perf'>('ddl');

  const current: TableMetricDto =
    telemetry.tables.find((t) => t.tableName === selectedTable) ?? telemetry.tables[0]!;

  const spec = SCHEMA_SPECS[current.tableName] ?? {
    ddl: `CREATE TABLE ${current.tableName} (\n  ${current.primaryKey} PRIMARY KEY,\n  -- Tabla normalizada en 3FN dentro de PanaderiaDB\n);`,
    efFluent: `modelBuilder.Entity<${current.tableName}>(entity => {\n  entity.HasKey(e => e.Id);\n  // Lecturas optimizadas con .AsNoTracking()\n});`,
    sargableTip: 'Entidad maestra/catálogo indexada por clave primaria secuencial INT IDENTITY(1,1) con cero fragmentación de página.',
    relations: current.indexesAndConstraints.filter((c) => c.startsWith('FK_')),
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_410px] fade-up">
      {/* Left: 15-Table Relational Rings */}
      <div className="space-y-4 min-w-0">
        <div className="glass rounded-2xl p-5 border border-amber-400/25 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              ARQUITECTURA RELACIONAL 3FN · {telemetry.databaseName}
            </p>
            <h2 className="font-display text-2xl font-semibold text-amber-50 mt-1">
              Mapa de las 15 Tablas, Restricciones e Índices Cubrientes
            </h2>
            <p className="text-xs text-purple-200/70 mt-1">
              Selecciona cualquier tabla para auditar su DDL en SQL Server, su configuración Fluent API en C# y su estrategia de indexación.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-right">
              <span className="block text-[10px] text-emerald-200/70">FILAS EN VIVO</span>
              <span className="text-base font-semibold text-emerald-300">
                {telemetry.totalRowsGlobal.toLocaleString('es-MX')}
              </span>
            </div>
            <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-right">
              <span className="block text-[10px] text-purple-200/70">ESQUEMA</span>
              <span className="text-base font-semibold text-purple-200">
                {telemetry.totalTables} Tablas
              </span>
            </div>
          </div>
        </div>

        <DatabaseMapsCanvas
          tables={telemetry.tables}
          selectedTable={current.tableName}
          onSelectTable={setSelectedTable}
        />

        {GROUPS.map((groupName) => {
          const groupTables = telemetry.tables.filter((t) => t.domainGroup === groupName);
          const badgeTone =
            groupName === 'Núcleo Transaccional ACID'
              ? 'text-amber-300 border-amber-400/30 bg-amber-500/10'
              : groupName === 'Entidades Maestras'
              ? 'text-purple-300 border-purple-400/30 bg-purple-500/10'
              : 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';

          return (
            <Panel
              key={groupName}
              title={
                <>
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{groupName}</span>
                </>
              }
              action={
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${badgeTone}`}>
                  {groupTables.length} tablas ·{' '}
                  {groupTables.reduce((s, x) => s + x.rowCount, 0).toLocaleString('es-MX')} filas
                </span>
              }
            >
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupTables.map((tb) => {
                  const isSelected = tb.tableName === current.tableName;
                  return (
                    <button
                      key={tb.tableName}
                      type="button"
                      onClick={() => setSelectedTable(tb.tableName)}
                      className={`text-left rounded-xl p-3.5 border transition-all hover-lift ${
                        isSelected
                          ? 'neon-border border-amber-400/60 bg-amber-500/10'
                          : 'border-white/10 bg-black/30 hover:border-amber-400/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-semibold text-sm text-amber-50">
                          dbo.{tb.tableName}
                        </span>
                        <span className="font-mono text-xs font-semibold text-amber-300 tabular-nums">
                          {tb.rowCount.toLocaleString('es-MX')}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[11px] text-purple-100/65 line-clamp-2 leading-relaxed">
                        {tb.description}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9.5px] text-amber-300">
                          PK
                        </span>
                        {tb.indexesAndConstraints.some((c) => c.includes('IX_') || c.includes('INCLUDE')) && (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9.5px] text-emerald-300">
                            COVERING IX
                          </span>
                        )}
                        {tb.indexesAndConstraints.some((c) => c.includes('UQ_')) && (
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9.5px] text-purple-300">
                            UNIQUE
                          </span>
                        )}
                        {tb.indexesAndConstraints.some((c) => c.includes('COMPUTED')) && (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9.5px] text-rose-300">
                            COMPUTED
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Right: Deep SQL & EF Core Inspector */}
      <aside className="space-y-4">
        <Panel
          title={
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Inspector DBA: dbo.{current.tableName}</span>
            </>
          }
          action={
            <span className="font-mono text-xs text-emerald-400">
              {current.rowCount.toLocaleString('es-MX')} filas
            </span>
          }
        >
          <div className="p-4 space-y-4">
            <p className="text-xs text-purple-100/80 leading-relaxed">{current.description}</p>

            <div className="rounded-xl border border-amber-500/20 bg-black/40 p-3 font-mono text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Clave Primaria Clustered:</span>
              </div>
              <div className="text-amber-50 pl-5">{current.primaryKey}</div>
            </div>

            {/* Constraints & Indexes pills */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                Índices, FKs e Invariantes Relacionales
              </p>
              <div className="space-y-1.5">
                {current.indexesAndConstraints.map((idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-purple-100/85"
                  >
                    {idx}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Tabs */}
            <div>
              <div className="flex border-b border-white/10 text-xs font-mono">
                {(
                  [
                    ['ddl', 'SQL DDL'],
                    ['ef', 'Índices / EF Core'],
                    ['perf', 'Rendimiento'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setInspectorTab(key)}
                    className={`px-3 py-2 -mb-px border-b-2 transition-colors ${
                      inspectorTab === key
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-purple-200/55 hover:text-amber-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                {inspectorTab === 'ddl' && (
                  <pre className="rounded-xl border border-white/10 bg-[#07050b] p-3.5 font-mono text-[11px] text-amber-100/90 overflow-x-auto leading-relaxed">
                    {spec.ddl}
                  </pre>
                )}
                {inspectorTab === 'ef' && (
                  <pre className="rounded-xl border border-white/10 bg-[#07050b] p-3.5 font-mono text-[11px] text-purple-200 overflow-x-auto leading-relaxed">
                    {spec.efFluent}
                  </pre>
                )}
                {inspectorTab === 'perf' && (
                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-300 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Nota de Ingeniería de Datos</span>
                    </div>
                    <p className="text-purple-100/85 leading-relaxed">{spec.sargableTip}</p>
                    {spec.relations.length > 0 && (
                      <div className="pt-2 border-t border-white/10 font-mono text-[11px] text-amber-200/80">
                        Cardinalidad: {spec.relations.join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title={
            <>
              <Code2 className="w-4 h-4 text-purple-300" />
              <span>Garantías de Integridad en .NET 8</span>
            </>
          }
        >
          <div className="p-4 space-y-2.5 text-xs text-purple-100/75">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-amber-100">Cero Exposición de Entidades:</strong> Todos los controladores devuelven DTOs inmutables evitando referencias circulares de EF Core.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-amber-100">ExecutionStrategy + ACID:</strong> Tanto <code className="font-mono text-amber-300">POST /api/Venta</code> como <code className="font-mono text-amber-300">POST /api/Compra</code> operan bajo transacciones explícitas con rollback automático.
              </p>
            </div>
          </div>
        </Panel>
      </aside>
    </div>
  );
}

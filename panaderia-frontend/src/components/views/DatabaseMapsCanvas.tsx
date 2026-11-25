import { useState } from 'react';
import { GitFork, Layers, Lock, Network, Star, Zap } from 'lucide-react';
import { TableMetricDto } from '../../types/api';

interface ErNode {
  name: string;
  x: number;
  y: number;
  ring: 'lookup' | 'master' | 'acid';
  pk: string;
  highlightCols: string[];
}

interface ErEdge {
  from: string; // parent (1)
  to: string;   // child (N)
  fk: string;
}

const ER_NODES: ErNode[] = [
  // Column 1: Lookups 3FN (x = 24)
  { name: 'Puestos', x: 24, y: 24, ring: 'lookup', pk: 'PuestoID', highlightCols: ['Nombre'] },
  { name: 'Sucursales', x: 24, y: 122, ring: 'lookup', pk: 'SucursalID', highlightCols: ['Nombre', 'Direccion'] },
  { name: 'TipoCliente', x: 24, y: 220, ring: 'lookup', pk: 'TipoClienteID', highlightCols: ['Nombre'] },
  { name: 'TipoProducto', x: 24, y: 318, ring: 'lookup', pk: 'TipoProductoID', highlightCols: ['Nombre'] },
  { name: 'UnidadMedida', x: 24, y: 416, ring: 'lookup', pk: 'UnidadMedidaID', highlightCols: ['Abreviatura'] },
  { name: 'TipoImpuesto', x: 24, y: 514, ring: 'lookup', pk: 'TipoImpuestoID', highlightCols: ['Porcentaje'] },

  // Column 2: Master Entities (x = 310)
  { name: 'Empleados', x: 310, y: 48, ring: 'master', pk: 'EmpleadoID', highlightCols: ['FK PuestoID', 'FK SucursalID'] },
  { name: 'Proveedores', x: 310, y: 185, ring: 'master', pk: 'ProveedorID', highlightCols: ['UQ RFC', 'NombreFiscal'] },
  { name: 'Clientes', x: 310, y: 318, ring: 'master', pk: 'ClienteID', highlightCols: ['UQ Email', 'FK TipoClienteID'] },
  { name: 'Productos', x: 310, y: 455, ring: 'master', pk: 'ProductoID', highlightCols: ['PrecioVenta', 'CostoPromedio'] },

  // Column 3: ACID Transactional Core (x = 615)
  { name: 'Compras', x: 615, y: 34, ring: 'acid', pk: 'CompraID', highlightCols: ['IX FechaRecepcion', 'Total'] },
  { name: 'CompraDetalle', x: 615, y: 152, ring: 'acid', pk: 'CompraDetalleID', highlightCols: ['FK CompraID', 'CostoUnitario'] },
  { name: 'Inventario', x: 615, y: 274, ring: 'acid', pk: 'InventarioID', highlightCols: ['UQ (Sucursal,Prod)', 'CantidadStock'] },
  { name: 'Ventas', x: 615, y: 396, ring: 'acid', pk: 'VentaID', highlightCols: ['IX FechaHora_Suc', 'Total'] },
  { name: 'VentaDetalle', x: 615, y: 516, ring: 'acid', pk: 'VentaDetalleID', highlightCols: ['COMP Importe', 'Cantidad'] },
];

const ER_EDGES: ErEdge[] = [
  { from: 'Puestos', to: 'Empleados', fk: 'FK_Empleado_Puesto' },
  { from: 'Sucursales', to: 'Empleados', fk: 'FK_Empleado_Sucursal' },
  { from: 'Sucursales', to: 'Inventario', fk: 'FK_Inventario_Sucursal' },
  { from: 'Sucursales', to: 'Ventas', fk: 'FK_Venta_Sucursal' },
  { from: 'Sucursales', to: 'Compras', fk: 'FK_Compra_Sucursal' },
  { from: 'TipoCliente', to: 'Clientes', fk: 'FK_Cliente_Tipo' },
  { from: 'TipoProducto', to: 'Productos', fk: 'FK_Producto_Tipo' },
  { from: 'UnidadMedida', to: 'Productos', fk: 'FK_Producto_Unidad' },
  { from: 'TipoImpuesto', to: 'Ventas', fk: 'FK_Venta_Impuesto' },
  { from: 'Empleados', to: 'Ventas', fk: 'FK_Venta_Empleado' },
  { from: 'Empleados', to: 'Compras', fk: 'FK_Compra_Empleado' },
  { from: 'Proveedores', to: 'Compras', fk: 'FK_Compra_Proveedor' },
  { from: 'Clientes', to: 'Ventas', fk: 'FK_Venta_Cliente' },
  { from: 'Productos', to: 'Inventario', fk: 'FK_Inventario_Producto' },
  { from: 'Productos', to: 'VentaDetalle', fk: 'FK_VentaDetalle_Producto' },
  { from: 'Productos', to: 'CompraDetalle', fk: 'FK_CompraDetalle_Producto' },
  { from: 'Compras', to: 'CompraDetalle', fk: 'FK_CompraDetalle_Compra' },
  { from: 'Ventas', to: 'VentaDetalle', fk: 'FK_VentaDetalle_Venta' },
];

type MapKind = 'er' | 'acid' | 'btree' | 'star';

export function DatabaseMapsCanvas({
  tables,
  selectedTable,
  onSelectTable,
}: {
  tables: TableMetricDto[];
  selectedTable: string;
  onSelectTable: (name: string) => void;
}) {
  const [activeMap, setActiveMap] = useState<MapKind>('er');
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  const focusTable = hoveredTable ?? selectedTable;
  const rowMap = new Map(tables.map((t) => [t.tableName, t.rowCount]));

  const nodeW = 212;
  const nodeH = 82;

  return (
    <div className="glass rounded-2xl overflow-hidden border border-amber-400/25">
      {/* Atlas Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/15 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-amber-400" />
          <span className="font-display text-sm font-semibold text-amber-50">
            Atlas de Ingeniería de Base de Datos
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          {(
            [
              ['er', '1. Mapa E-R (15 Tablas)', GitFork],
              ['acid', '2. Secuencia ACID & Locks', Lock],
              ['btree', '3. B-Tree & Covering IX', Zap],
              ['star', '4. Estrella OLAP', Star],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveMap(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all ${
                activeMap === id
                  ? 'border-amber-400 bg-amber-500/20 text-amber-100 shadow-[0_0_12px_-3px_rgba(245,158,11,0.5)]'
                  : 'border-white/10 bg-black/30 text-purple-200/70 hover:text-amber-100'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAP 1: INTERACTIVE CROW'S FOOT E-R DIAGRAM */}
      {activeMap === 'er' && (
        <div className="p-4 bg-[#08060d]/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-400" />
                Catálogos 3FN (6)
              </span>
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/40 border border-purple-400" />
                Entidades Maestras (4)
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-400" />
                Núcleo Transaccional ACID (5)
              </span>
            </div>
            <span className="text-purple-200/60">
              Notación Crow&apos;s Foot (1 ───&lt; N) · Haz clic en cualquier entidad para auditar su DDL
            </span>
          </div>

          <div className="overflow-x-auto">
            <svg viewBox="0 0 855 620" className="w-full min-w-[740px] h-auto select-none">
              <defs>
                <linearGradient id="edgeActive" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>

              {/* Column Headers */}
              <text x="130" y="14" textAnchor="middle" className="fill-emerald-300/70 font-mono text-[10px] tracking-widest">
                ANILLO 1 · CATÁLOGOS LOOKUP (3FN)
              </text>
              <text x="416" y="14" textAnchor="middle" className="fill-purple-300/70 font-mono text-[10px] tracking-widest">
                ANILLO 2 · ENTIDADES MAESTRAS
              </text>
              <text x="721" y="14" textAnchor="middle" className="fill-amber-300/70 font-mono text-[10px] tracking-widest">
                ANILLO 3 · TRANSACCIONAL ACID
              </text>

              {/* Crow's Foot Edges (18 Foreign Keys) */}
              {ER_EDGES.map((edge) => {
                const src = ER_NODES.find((n) => n.name === edge.from)!;
                const dst = ER_NODES.find((n) => n.name === edge.to)!;
                const isSameCol = src.x === dst.x;

                const x1 = isSameCol ? src.x + nodeW / 2 : src.x + nodeW;
                const y1 = isSameCol ? src.y + nodeH : src.y + nodeH / 2;
                const x2 = isSameCol ? dst.x + nodeW / 2 : dst.x;
                const y2 = isSameCol ? dst.y : dst.y + nodeH / 2;

                const connected = edge.from === focusTable || edge.to === focusTable;
                const midX = (x1 + x2) / 2;
                const d = isSameCol
                  ? `M ${x1} ${y1} L ${x2} ${y2}`
                  : `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                // Crow's foot prongs at destination (N side)
                const crow = isSameCol
                  ? `M ${x2 - 5} ${y2 - 7} L ${x2} ${y2} L ${x2 + 5} ${y2 - 7}`
                  : `M ${x2 - 8} ${y2 - 5} L ${x2} ${y2} L ${x2 - 8} ${y2 + 5}`;

                // '1' tick mark at origin (1 side)
                const oneTick = isSameCol
                  ? `M ${x1 - 5} ${y1 + 5} L ${x1 + 5} ${y1 + 5}`
                  : `M ${x1 + 6} ${y1 - 5} L ${x1 + 6} ${y1 + 5}`;

                return (
                  <g key={edge.fk} opacity={connected ? 1 : 0.24}>
                    <path
                      d={d}
                      fill="none"
                      stroke={connected ? 'url(#edgeActive)' : '#9f7aea'}
                      strokeWidth={connected ? 2.2 : 1.1}
                    />
                    <path
                      d={crow}
                      fill="none"
                      stroke={connected ? '#fbbf24' : '#9f7aea'}
                      strokeWidth={connected ? 2 : 1.1}
                    />
                    <path
                      d={oneTick}
                      fill="none"
                      stroke={connected ? '#34d399' : '#9f7aea'}
                      strokeWidth={connected ? 2 : 1.1}
                    />
                  </g>
                );
              })}

              {/* 15 Entity Boxes */}
              {ER_NODES.map((node) => {
                const isSelected = node.name === selectedTable;
                const isConnected =
                  node.name === focusTable ||
                  ER_EDGES.some(
                    (e) =>
                      (e.from === focusTable && e.to === node.name) ||
                      (e.to === focusTable && e.from === node.name)
                  );

                const stroke =
                  isSelected
                    ? '#fbbf24'
                    : node.ring === 'acid'
                    ? 'rgba(245,158,11,0.45)'
                    : node.ring === 'master'
                    ? 'rgba(192,132,252,0.45)'
                    : 'rgba(52,211,153,0.45)';

                const headerFill =
                  node.ring === 'acid'
                    ? 'rgba(245,158,11,0.18)'
                    : node.ring === 'master'
                    ? 'rgba(147,51,234,0.22)'
                    : 'rgba(16,185,129,0.18)';

                const rows = rowMap.get(node.name) ?? 0;

                return (
                  <g
                    key={node.name}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => onSelectTable(node.name)}
                    onMouseEnter={() => setHoveredTable(node.name)}
                    onMouseLeave={() => setHoveredTable(null)}
                    className="cursor-pointer"
                    opacity={isConnected ? 1 : 0.52}
                  >
                    <rect
                      width={nodeW}
                      height={nodeH}
                      rx={10}
                      fill="#110d1a"
                      stroke={stroke}
                      strokeWidth={isSelected ? 2.4 : 1.2}
                    />
                    <rect width={nodeW} height={24} rx={10} fill={headerFill} />
                    <text x={10} y={16} className="fill-amber-50 font-display text-[11.5px] font-semibold">
                      {node.name}
                    </text>
                    <text
                      x={nodeW - 8}
                      y={16}
                      textAnchor="end"
                      className="fill-amber-300 font-mono text-[10px]"
                    >
                      {rows.toLocaleString('es-MX')}
                    </text>

                    <text x={10} y={41} className="fill-emerald-300 font-mono text-[10px]">
                      PK · {node.pk}
                    </text>
                    <text x={10} y={57} className="fill-purple-200/75 font-mono text-[9.5px]">
                      {node.highlightCols[0]}
                    </text>
                    {node.highlightCols[1] && (
                      <text x={10} y={71} className="fill-purple-200/55 font-mono text-[9.5px]">
                        {node.highlightCols[1]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* MAP 2: ACID TRANSACTIONAL SEQUENCE & ISOLATION */}
      {activeMap === 'acid' && (
        <div className="p-5 bg-[#08060d]/80 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-amber-400/25 bg-black/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-amber-200">
                  Flujo A · Despacho POS (POST /api/Venta)
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                  ACID + Rollback Guard
                </span>
              </div>
              <ol className="space-y-2 font-mono text-[11px]">
                <li className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                  <span className="text-amber-300 font-bold">1. ExecutionStrategy.ExecuteAsync()</span>
                  <p className="text-purple-200/70 mt-0.5">Envuelve la unidad de trabajo para tolerar fallos transitorios en SQL Server.</p>
                </li>
                <li className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                  <span className="text-purple-300 font-bold">2. BeginTransactionAsync() + Index Seek</span>
                  <p className="text-purple-200/70 mt-0.5">Localiza fila exacta vía UQ_Inventario_Producto_Sucursal (SucursalID, ProductoID).</p>
                </li>
                <li className="rounded-lg border border-emerald-400/25 bg-emerald-950/20 p-2.5">
                  <span className="text-emerald-300 font-bold">3A. Stock &gt;= Solicitado → COMMIT (HTTP 201)</span>
                  <p className="text-purple-200/70 mt-0.5">Resta CantidadStock, inserta Ventas + VentaDetalle (calcula Importe) y confirma.</p>
                </li>
                <li className="rounded-lg border border-rose-400/25 bg-rose-950/20 p-2.5">
                  <span className="text-rose-300 font-bold">3B. Stock &lt; Solicitado → ROLLBACK (HTTP 400)</span>
                  <p className="text-purple-200/70 mt-0.5">Dispara StockInsuficienteException; revierte cualquier resta previa de la misma canasta.</p>
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-purple-400/25 bg-black/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-purple-200">
                  Flujo B · Recepción de Molino (POST /api/Compra)
                </span>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] text-purple-300">
                  Costo Promedio Ponderado
                </span>
              </div>
              <ol className="space-y-2 font-mono text-[11px]">
                <li className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                  <span className="text-amber-300 font-bold">1. Lectura de Existencia Consolidada</span>
                  <p className="text-purple-200/70 mt-0.5">Obtiene stock actual del insumo (ej. Harina Fuerza W320) y su CostoPromedio vigente.</p>
                </li>
                <li className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                  <span className="text-purple-300 font-bold">2. Fórmula Contable Atómica</span>
                  <p className="text-amber-200/90 mt-0.5">NuevoCosto = ((StockActual * CostoActual) + (Entrada * CostoCompra)) / (StockActual + Entrada)</p>
                </li>
                <li className="rounded-lg border border-emerald-400/25 bg-emerald-950/20 p-2.5">
                  <span className="text-emerald-300 font-bold">3. Upsert Inventario + Registro OC + COMMIT</span>
                  <p className="text-purple-200/70 mt-0.5">Incrementa existencias en la sucursal receptora y actualiza el margen bruto global.</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* MAP 3: PHYSICAL B-TREE & COVERING INDEXES */}
      {activeMap === 'btree' && (
        <div className="p-5 bg-[#08060d]/80 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                idx: 'IX_Ventas_FechaHora_Sucursal',
                table: 'dbo.Ventas (15,612 filas)',
                keys: '(FechaHora ASC, SucursalID ASC)',
                included: 'INCLUDE (Total, Subtotal, TotalImpuestos, Estatus, ClienteID)',
                impact: 'Resuelve la curva de 36 meses mediante Index Seek por rango SARGable con 0 Key Lookups a las páginas de datos.',
              },
              {
                idx: 'IX_VentaDetalle_ProductoID',
                table: 'dbo.VentaDetalle (42,152 filas)',
                keys: '(ProductoID ASC)',
                included: 'INCLUDE (VentaID, Cantidad, PrecioUnitario)',
                impact: 'Acelera el cálculo del Top de Panes de Autor y distribución por familia sin escanear columnas anchas.',
              },
              {
                idx: 'UQ_Inventario_Producto_Sucursal',
                table: 'dbo.Inventario (240 filas)',
                keys: 'UNIQUE (SucursalID ASC, ProductoID ASC)',
                included: 'Garantía física anti-duplicados + bloqueo puntual de fila',
                impact: 'Impide registros duplicados de un mismo SKU por sucursal y reduce el lock footprint durante cobros concurrentes.',
              },
              {
                idx: 'IX_Compras_FechaRecepcion_Sucursal',
                table: 'dbo.Compras (1,323 filas)',
                keys: '(FechaRecepcion ASC, SucursalID ASC)',
                included: 'INCLUDE (Total, ProveedorID)',
                impact: 'Alimenta la comparativa mensual de egresos de materia prima frente a ingresos POS.',
              },
            ].map((item) => (
              <div key={item.idx} className="rounded-xl border border-emerald-400/25 bg-black/40 p-4 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-emerald-300 font-bold truncate">{item.idx}</span>
                  <span className="text-[10px] text-amber-300 shrink-0">{item.table}</span>
                </div>
                <div className="text-[11px] text-amber-100">Keys: {item.keys}</div>
                <div className="text-[10.5px] text-purple-300">{item.included}</div>
                <p className="text-[11px] font-sans text-purple-100/70 pt-1 leading-relaxed">
                  {item.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAP 4: VIRTUAL ANALYTICAL STAR SCHEMA (OLTP -> OLAP) */}
      {activeMap === 'star' && (
        <div className="p-5 bg-[#08060d]/80">
          <div className="grid gap-4 lg:grid-cols-3 items-center">
            <div className="space-y-3">
              <div className="rounded-xl border border-purple-400/30 bg-purple-950/20 p-3.5 font-mono text-xs">
                <span className="text-purple-300 font-bold block">DIM_TIEMPO (Derivada SARGable)</span>
                <span className="text-purple-100/70 text-[11px]">Año (2024-2026) · Mes · Temporada (Rosca / Pan de Muerto) · Hora Horno</span>
              </div>
              <div className="rounded-xl border border-purple-400/30 bg-purple-950/20 p-3.5 font-mono text-xs">
                <span className="text-purple-300 font-bold block">DIM_SUCURSAL (dbo.Sucursales)</span>
                <span className="text-purple-100/70 text-[11px]">SucursalID · Nombre Horno · Zona Geográfica</span>
              </div>
            </div>

            <div className="rounded-2xl neon-border border border-amber-400/50 bg-amber-500/10 p-5 text-center space-y-2">
              <Layers className="w-6 h-6 text-amber-400 mx-auto" />
              <p className="font-mono text-[10px] tracking-widest text-amber-300">TABLA DE HECHOS VIRTUAL</p>
              <h4 className="font-display text-lg font-bold text-amber-50">
                FACT_VENTAS_PARTIDAS
              </h4>
              <p className="font-mono text-xs text-emerald-300">42,152 Eventos Atómicos</p>
              <div className="text-left rounded-xl bg-black/50 p-3 font-mono text-[10.5px] text-amber-100/90 space-y-1">
                <div>• Medidas: Cantidad, Importe, Subtotal, Impuestos</div>
                <div>• Margen = Importe - (Cantidad * CostoPromedio)</div>
                <div>• Proyectado en vivo desde 3FN vía /api/Database/analytics</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-purple-400/30 bg-purple-950/20 p-3.5 font-mono text-xs">
                <span className="text-purple-300 font-bold block">DIM_PRODUCTO (Productos + Tipo + Unidad)</span>
                <span className="text-purple-100/70 text-[11px]">SKU · Familia Panificación · Unidad · CostoPromedio</span>
              </div>
              <div className="rounded-xl border border-purple-400/30 bg-purple-950/20 p-3.5 font-mono text-xs">
                <span className="text-purple-300 font-bold block">DIM_CLIENTE &amp; FISCAL (Clientes + TipoImpuesto)</span>
                <span className="text-purple-100/70 text-[11px]">Segmento B2C/B2B · Tasa IVA 16% / 0% / IEPS 8%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

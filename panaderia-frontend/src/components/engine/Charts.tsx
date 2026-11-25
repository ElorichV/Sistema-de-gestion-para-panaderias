import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { MonthlyMetricDto } from '../../types/api';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function HistoricalAreaChart({
  data,
}: {
  data: MonthlyMetricDto[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="h-64 grid place-items-center text-xs font-mono text-purple-200/50">
        Sin series temporales para el filtro actual
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padL = 54;
  const padR = 18;
  const padT = 18;
  const padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => Math.max(d.ingresos, d.compras)), 1);

  const getX = (i: number) =>
    data.length === 1 ? padL + innerW / 2 : padL + (i / (data.length - 1)) * innerW;
  const getY = (val: number) => padT + innerH - (val / maxVal) * innerH;

  const ingresosPts = data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.ingresos).toFixed(1)}`);
  const comprasPts = data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.compras).toFixed(1)}`);

  const ingresosLine = `M ${ingresosPts.join(' L ')}`;
  const ingresosArea = `${ingresosLine} L ${getX(data.length - 1).toFixed(1)},${padT + innerH} L ${getX(0).toFixed(1)},${padT + innerH} Z`;

  const comprasLine = `M ${comprasPts.join(' L ')}`;
  const comprasArea = `${comprasLine} L ${getX(data.length - 1).toFixed(1)},${padT + innerH} L ${getX(0).toFixed(1)},${padT + innerH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const active = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="relative p-4 select-none">
      {/* Legend & Active Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            Ingresos POS
          </span>
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            Compras Insumos
          </span>
        </div>

        {active ? (
          <div className="font-mono text-[11px] flex items-center gap-3 bg-white/5 border border-amber-400/25 rounded-lg px-2.5 py-1">
            <span className="text-amber-200 font-semibold">
              {MONTH_NAMES[(active.mes - 1) % 12]} {active.anio}
            </span>
            <span className="text-amber-400">Ventas: ${active.ingresos.toLocaleString('es-MX')}</span>
            <span className="text-purple-300">Insumos: ${active.compras.toLocaleString('es-MX')}</span>
            <span className="text-emerald-400">{active.tickets} tks</span>
          </div>
        ) : (
          <span className="font-mono text-[11px] text-purple-200/50">
            Pasa el cursor para inspeccionar estacionalidad (Rosca Ene · Pan de Muerto Oct/Nov)
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-60 overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gradCompras" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid */}
        {yTicks.map((t) => {
          const y = padT + innerH - t * innerH;
          const val = Math.round((maxVal * t) / 1000);
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="rgba(246,173,85,0.12)"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-purple-200/50 font-mono text-[10px]"
              >
                ${val}k
              </text>
            </g>
          );
        })}

        {/* Areas & Lines */}
        <path d={comprasArea} fill="url(#gradCompras)" />
        <path d={ingresosArea} fill="url(#gradIngresos)" />
        <path d={comprasLine} fill="none" stroke="#c084fc" strokeWidth="1.8" />
        <path d={ingresosLine} fill="none" stroke="#fbbf24" strokeWidth="2.4" />

        {/* Seasonal peak dots (Jan = Rosca, Oct/Nov = Pan de Muerto) */}
        {data.map((d, i) => {
          const isPeak = d.mes === 1 || d.mes === 10 || d.mes === 11;
          if (!isPeak && hoverIdx !== i) return null;
          return (
            <circle
              key={d.periodo}
              cx={getX(i)}
              cy={getY(d.ingresos)}
              r={hoverIdx === i ? 5 : 3}
              fill={hoverIdx === i ? '#34d399' : '#fbbf24'}
              stroke="#0b0910"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Hover crosshair */}
        {hoverIdx !== null && (
          <line
            x1={getX(hoverIdx)}
            x2={getX(hoverIdx)}
            y1={padT}
            y2={padT + innerH}
            stroke="rgba(251,191,36,0.55)"
            strokeDasharray="2 2"
          />
        )}

        {/* X Axis labels */}
        {data.map((d, i) => {
          const step = Math.max(1, Math.ceil(data.length / 9));
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={d.periodo}
              x={getX(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-purple-200/55 font-mono text-[10px]"
            >
              {d.periodo}
            </text>
          );
        })}

        {/* Invisible interactive hover bands */}
        {data.map((d, i) => {
          const bandW = innerW / Math.max(data.length, 1);
          return (
            <rect
              key={d.periodo}
              x={getX(i) - bandW / 2}
              y={padT}
              width={Math.max(bandW, 8)}
              height={innerH}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoverIdx(i)}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function HorizontalRankBars({
  items,
  selectedId,
  onSelect,
}: {
  items: { id: number | string; title: string; subtitle: string; value: number; formatted: string }[];
  selectedId?: number | string | null;
  onSelect?: (id: number | string) => void;
}) {
  const max = Math.max(...items.map((x) => x.value), 1);

  return (
    <div className="p-4 space-y-2.5">
      {items.map((item, idx) => {
        const pct = Math.max(6, Math.round((item.value / max) * 100));
        const active = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={`w-full text-left rounded-xl p-2.5 border transition-all ${
              active
                ? 'border-amber-400/60 bg-amber-500/10'
                : 'border-white/5 bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <span className="font-medium text-amber-50 truncate flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-purple-300/70">#{idx + 1}</span>
                {item.title}
                {idx === 0 && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </span>
              <span className="font-mono text-xs font-semibold text-amber-300 shrink-0 tabular-nums">
                {item.formatted}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background:
                    idx === 0
                      ? 'linear-gradient(90deg, #34d399, #fbbf24)'
                      : 'linear-gradient(90deg, #9333ea, #f59e0b)',
                }}
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-purple-200/55">{item.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, Flame, Sparkles } from 'lucide-react';

export function Panel({
  title,
  subtitle,
  action,
  className = '',
  children,
}: {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`glass rounded-2xl overflow-hidden ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-amber-500/15 px-4 py-3 bg-white/[0.015]">
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold tracking-tight text-amber-50 flex items-center gap-2">
              {title}
            </h3>
            {subtitle && <p className="text-[11px] text-purple-200/55 truncate mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function SparkKpi({
  label,
  value,
  unit,
  delta,
  tone = 'emerald',
  series,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  tone?: 'emerald' | 'amber' | 'purple';
  series: number[];
  icon?: React.ReactNode;
}) {
  const safe = series.length > 1 ? series : [10, 14, 12, 18, 22, 20, 26];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = max - min || 1;
  const w = 96;
  const h = 38;

  const pts = safe.map((v, idx) => {
    const x = (idx / (safe.length - 1)) * w;
    const y = h - 4 - ((v - min) / span) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${pts.join(' L ')}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  const gradId = `spark-${label.replace(/\W+/g, '')}`;

  const strokeColor =
    tone === 'amber' ? '#fbbf24' : tone === 'purple' ? '#c084fc' : '#34d399';

  return (
    <div className="glass hover-lift rounded-2xl p-4 relative overflow-hidden">
      <div className="flex items-center justify-between text-xs text-purple-200/65">
        <span className="truncate font-medium">{label}</span>
        {icon && <span className="text-amber-400/90">{icon}</span>}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold tabular-nums text-amber-50 truncate">
            {value}
            {unit && <span className="ml-1 text-xs font-normal text-purple-200/60">{unit}</span>}
          </p>
          <p
            className={`mt-1 font-mono text-[11px] truncate ${
              tone === 'amber'
                ? 'text-amber-300'
                : tone === 'purple'
                ? 'text-purple-300'
                : 'text-emerald-400'
            }`}
          >
            {delta}
          </p>
        </div>

        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function SqlTerminal({
  logs,
  onClear,
}: {
  logs: string[];
  onClear?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  const copyAll = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Panel
      title={
        <>
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>SQL &amp; HTTP Telemetry Console</span>
        </>
      }
      action={
        <div className="flex items-center gap-1.5">
          {onClear && (
            <button
              onClick={onClear}
              className="rounded-md border border-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-purple-200/70 hover:text-amber-200 hover:bg-white/5"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={copyAll}
            className="flex items-center gap-1 rounded-md border border-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-purple-200/70 hover:text-amber-200 hover:bg-white/5"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      }
    >
      <div
        ref={ref}
        className="h-48 overflow-y-auto p-3.5 font-mono text-[11px] leading-relaxed bg-[#08060c]/75"
      >
        {logs.map((line, i) => {
          const isCommit = line.includes('[commit]') || line.includes('HTTP 200') || line.includes('HTTP 201');
          const isRollback = line.includes('[rollback]') || line.includes('HTTP 400') || line.includes('StockInsuficiente');
          const isSql = line.includes('SELECT') || line.includes('INDEX') || line.includes('TRANSACTION') || line.includes('[sql]');
          return (
            <div
              key={i}
              className={
                isRollback
                  ? 'text-rose-400'
                  : isCommit
                  ? 'text-emerald-400'
                  : isSql
                  ? 'text-purple-300'
                  : i === logs.length - 1
                  ? 'text-amber-300'
                  : 'text-purple-100/65'
              }
            >
              {line}
            </div>
          );
        })}
        <span className="inline-block h-3.5 w-2 animate-pulse bg-amber-400 align-middle ml-1" />
      </div>
    </Panel>
  );
}

export function IntroPortal({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'letters' | 'wave'>('letters');
  const word = 'TAHONA·DB';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onComplete();
    };
    window.addEventListener('keydown', onKey);
    const t1 = setTimeout(() => setPhase('wave'), 1750);
    const t2 = setTimeout(() => onComplete(), 2550);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      role="button"
      tabIndex={0}
      aria-label="Saltar introducción"
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#09070e] cursor-pointer select-none"
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(245,158,11,0.22), rgba(147,51,234,0.16) 38%, transparent 68%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[10px] tracking-[0.35em] text-amber-300 mb-6">
          <Sparkles className="w-3 h-3" />
          EL GRAN HORNO RELACIONAL · 2024–2026
        </div>

        <h1 className="flex items-center gap-[0.12em] font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-amber-50">
          <span className="intro-letter text-amber-400 neon-text mr-2" style={{ animationDelay: '0ms' }}>
            🥖
          </span>
          {word.split('').map((ch, idx) => (
            <span
              key={idx}
              className={`intro-letter ${ch === '·' ? 'text-purple-400' : ''}`}
              style={{
                animationDelay: `${120 + idx * 110}ms`,
                ['--r' as string]: `${(idx % 2 ? 1 : -1) * (24 + idx * 5)}deg`,
                ['--x' as string]: `${(idx - 4) * 20}px`,
              }}
            >
              {ch}
            </span>
          ))}
        </h1>

        <p className="mt-5 font-mono text-xs text-purple-200/70 max-w-md">
          15 Tablas en 3FN · +63,500 Filas · Transacciones ACID en .NET 8 &amp; SQL Server
        </p>
      </div>

      {phase === 'wave' && (
        <>
          <span className="shockwave" />
          <span className="shockwave" style={{ animationDelay: '130ms' }} />
        </>
      )}

      <p className="absolute bottom-7 font-mono text-[10px] tracking-[0.38em] text-amber-200/50">
        CLIC O ESC PARA ENTRAR AL SISTEMA
      </p>
    </div>
  );
}

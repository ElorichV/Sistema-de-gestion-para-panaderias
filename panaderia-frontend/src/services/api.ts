import {
  ActualizarStockDto,
  CatalogosBundleDto,
  Cliente,
  CompraResponseDto,
  CreateCompraDto,
  CreateVentaDto,
  DatabaseAnalyticsDto,
  DatabaseTelemetryDto,
  EndpointExecutionResult,
  InventarioItem,
  Producto,
  VentaResponseDto,
} from '../types/api';
import {
  buildSnapshotInventario,
  getSnapshotAnalytics,
  SNAPSHOT_CATALOGOS,
  SNAPSHOT_CLIENTES,
  SNAPSHOT_COMPRAS,
  SNAPSHOT_PRODUCTOS,
  SNAPSHOT_TELEMETRY,
} from './mockSnapshot';

const API_BASE = '/api';

let fallbackInventario = buildSnapshotInventario();
let fallbackCompras = [...SNAPSHOT_COMPRAS];

const nowClock = () => new Date().toTimeString().slice(0, 8);

export const api = {
  async checkHealth(): Promise<{ online: boolean; latencyMs: number; database?: string }> {
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2200) });
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      if (!res.ok) return { online: false, latencyMs };
      const body = await res.json();
      return { online: Boolean(body.canConnect ?? true), latencyMs, database: body.database };
    } catch {
      return { online: false, latencyMs: Math.round((performance.now() - t0) * 10) / 10 };
    }
  },

  async getTelemetry(): Promise<{ data: DatabaseTelemetryDto; source: 'live-sql' | 'portfolio-snapshot'; latencyMs: number }> {
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/Database/telemetry`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('offline');
      const data = await res.json();
      return { data, source: 'live-sql', latencyMs: Math.round((performance.now() - t0) * 10) / 10 };
    } catch {
      return { data: SNAPSHOT_TELEMETRY, source: 'portfolio-snapshot', latencyMs: 4.2 };
    }
  },

  async getAnalytics(anio?: number | null, sucursalId?: number | null): Promise<{ data: DatabaseAnalyticsDto; latencyMs: number }> {
    const t0 = performance.now();
    try {
      const params = new URLSearchParams();
      if (anio) params.set('anio', String(anio));
      if (sucursalId) params.set('sucursalId', String(sucursalId));
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/Database/analytics${qs}`, { signal: AbortSignal.timeout(4500) });
      if (!res.ok) throw new Error('offline');
      const data = await res.json();
      return { data, latencyMs: Math.round((performance.now() - t0) * 10) / 10 };
    } catch {
      return { data: getSnapshotAnalytics(anio, sucursalId), latencyMs: 5.8 };
    }
  },

  async getCatalogos(): Promise<CatalogosBundleDto> {
    try {
      const res = await fetch(`${API_BASE}/Database/catalogos`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('offline');
      return await res.json();
    } catch {
      return SNAPSHOT_CATALOGOS;
    }
  },

  async getProductos(): Promise<Producto[]> {
    try {
      const res = await fetch(`${API_BASE}/Producto`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('offline');
      return await res.json();
    } catch {
      return SNAPSHOT_PRODUCTOS;
    }
  },

  async getInventario(sucursalId?: number): Promise<InventarioItem[]> {
    try {
      const url = sucursalId ? `${API_BASE}/Inventario/sucursal/${sucursalId}` : `${API_BASE}/Inventario`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('offline');
      return await res.json();
    } catch {
      return sucursalId
        ? fallbackInventario.filter((i) => i.sucursalId === sucursalId)
        : fallbackInventario;
    }
  },

  async getClientes(): Promise<Cliente[]> {
    try {
      const res = await fetch(`${API_BASE}/Cliente`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('offline');
      return await res.json();
    } catch {
      return SNAPSHOT_CLIENTES;
    }
  },

  async getCompras(sucursalId?: number): Promise<CompraResponseDto[]> {
    try {
      const qs = sucursalId ? `?limit=40&sucursalId=${sucursalId}` : '?limit=40';
      const res = await fetch(`${API_BASE}/Compra${qs}`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('offline');
      return await res.json();
    } catch {
      return sucursalId ? fallbackCompras.filter((c) => c.sucursalId === sucursalId) : fallbackCompras;
    }
  },

  async procesarVenta(dto: CreateVentaDto): Promise<{ success: boolean; data?: VentaResponseDto; error?: string; latencyMs: number; status: number }> {
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/Venta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        signal: AbortSignal.timeout(15000),
      });
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      const body = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: body.mensaje || body.Mensaje || 'Rollback ejecutado por violación de invariante de dominio.',
          latencyMs,
          status: res.status,
        };
      }
      return { success: true, data: body, latencyMs, status: res.status };
    } catch {
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      for (const item of dto.detalles) {
        const inv = fallbackInventario.find((i) => i.sucursalId === dto.sucursalId && i.productoId === item.productoId);
        const prod = SNAPSHOT_PRODUCTOS.find((p) => p.productoId === item.productoId);
        const nombre = prod?.nombre ?? `Producto #${item.productoId}`;
        if (!inv || inv.cantidadStock < item.cantidad) {
          return {
            success: false,
            error: `Stock insuficiente para el producto '${nombre}' (ID: ${item.productoId}). Stock disponible en sucursal: ${(inv?.cantidadStock ?? 0).toFixed(2)}, Cantidad solicitada: ${item.cantidad.toFixed(2)}.`,
            latencyMs,
            status: 400,
          };
        }
      }
      for (const item of dto.detalles) {
        const inv = fallbackInventario.find((i) => i.sucursalId === dto.sucursalId && i.productoId === item.productoId);
        if (inv) inv.cantidadStock -= item.cantidad;
      }
      const subtotal = dto.detalles.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
      const totalImpuestos = Math.round(subtotal * 0.16 * 100) / 100;
      const venta: VentaResponseDto = {
        ventaId: 15613 + Math.floor(Math.random() * 90),
        sucursalId: dto.sucursalId,
        sucursalNombre: SNAPSHOT_CATALOGOS.sucursales.find((s) => s.sucursalId === dto.sucursalId)?.nombre ?? 'Matriz',
        empleadoId: dto.empleadoId,
        empleadoNombre: 'Axel Linares',
        clienteId: dto.clienteId,
        clienteNombre: SNAPSHOT_CLIENTES.find((c) => c.clienteId === dto.clienteId)?.nombre ?? 'Mostrador General',
        tipoImpuestoId: 1,
        tipoImpuestoDescripcion: 'IVA General 16%',
        tipoImpuestoPorcentaje: 0.16,
        fechaHora: new Date().toISOString(),
        subtotal,
        totalImpuestos,
        total: subtotal + totalImpuestos,
        estatus: 'Completada',
        detalles: dto.detalles.map((d, idx) => ({
          ventaDetalleId: idx + 1,
          productoId: d.productoId,
          productoNombre: SNAPSHOT_PRODUCTOS.find((p) => p.productoId === d.productoId)?.nombre ?? `Producto #${d.productoId}`,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          importe: d.cantidad * d.precioUnitario,
        })),
      };
      return { success: true, data: venta, latencyMs, status: 201 };
    }
  },

  async registrarCompra(dto: CreateCompraDto): Promise<{ success: boolean; data?: CompraResponseDto; error?: string; latencyMs: number }> {
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/Compra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        signal: AbortSignal.timeout(15000),
      });
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      const body = await res.json();
      if (!res.ok) {
        return { success: false, error: body.mensaje || body.Mensaje || 'Error en recepción de compra.', latencyMs };
      }
      return { success: true, data: body, latencyMs };
    } catch {
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      for (const det of dto.detalles) {
        const inv = fallbackInventario.find((i) => i.sucursalId === dto.sucursalId && i.productoId === det.productoId);
        if (inv) inv.cantidadStock += det.cantidad;
      }
      const total = dto.detalles.reduce((s, d) => s + d.cantidad * d.costoUnitario, 0);
      const nueva: CompraResponseDto = {
        compraId: 1324 + fallbackCompras.length,
        proveedorId: dto.proveedorId,
        proveedorNombre: SNAPSHOT_CATALOGOS.proveedores.find((p) => p.proveedorId === dto.proveedorId)?.nombreFiscal ?? 'Molino Proveedor',
        proveedorRfc: 'MHE900115AA1',
        sucursalId: dto.sucursalId,
        sucursalNombre: SNAPSHOT_CATALOGOS.sucursales.find((s) => s.sucursalId === dto.sucursalId)?.nombre ?? 'Sucursal',
        empleadoId: dto.empleadoId,
        empleadoNombre: 'Axel Linares',
        fechaRecepcion: new Date().toISOString().slice(0, 10),
        total,
        detalles: dto.detalles.map((d, idx) => ({
          compraDetalleId: 4000 + idx,
          productoId: d.productoId,
          productoNombre: SNAPSHOT_PRODUCTOS.find((p) => p.productoId === d.productoId)?.nombre ?? `Insumo #${d.productoId}`,
          unidadMedida: 'bto',
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitario,
          subtotal: d.cantidad * d.costoUnitario,
        })),
      };
      fallbackCompras = [nueva, ...fallbackCompras];
      return { success: true, data: nueva, latencyMs };
    }
  },

  async actualizarStock(dto: ActualizarStockDto): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/Inventario/actualizar-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('offline');
      return true;
    } catch {
      const inv = fallbackInventario.find((i) => i.sucursalId === dto.sucursalId && i.productoId === dto.productoId);
      if (inv) {
        inv.cantidadStock = dto.operacion === 'fijar' ? dto.cantidad : inv.cantidadStock + dto.cantidad;
      }
      return true;
    }
  },

  async executeLabEndpoint(
    method: 'GET' | 'POST',
    path: string,
    requestBody?: unknown,
    sqlExplain?: string[]
  ): Promise<EndpointExecutionResult> {
    const t0 = performance.now();
    try {
      const res = await fetch(path, {
        method,
        headers: requestBody ? { 'Content-Type': 'application/json' } : undefined,
        body: requestBody ? JSON.stringify(requestBody) : undefined,
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Math.round((performance.now() - t0) * 10) / 10;
      const responseBody = await res.json();
      return {
        method,
        path,
        status: res.status,
        latencyMs,
        source: 'live-sql',
        requestBody,
        responseBody,
        timestamp: nowClock(),
        sqlTrace: [
          `[${nowClock()}] ${method} ${path} -> HTTP ${res.status} (${latencyMs}ms · SQL Server Live)`,
          ...(sqlExplain ?? []),
          res.ok
            ? `[commit] Operación completada con éxito en PanaderiaDB`
            : `[rollback] Transacción revertida limpiamente: ${(responseBody as { mensaje?: string })?.mensaje ?? 'Regla de dominio activada'}`,
        ],
      };
    } catch {
      // Fallback determinista cuando se explora en portafolio estático sin backend local activo
      let status = 200;
      let responseBody: unknown = { info: 'Snapshot response' };
      if (path.includes('/telemetry')) responseBody = SNAPSHOT_TELEMETRY;
      else if (path.includes('/analytics')) responseBody = getSnapshotAnalytics(2026, null);
      else if (path.includes('/Producto')) responseBody = SNAPSHOT_PRODUCTOS.slice(0, 8);
      else if (path.includes('/Inventario')) responseBody = fallbackInventario.slice(0, 10);
      else if (path.includes('/health')) responseBody = { status: 'SnapshotMode', engine: 'Embedded 3-Year Dataset', tables: 15, rows: 63503 };
      else if (method === 'POST' && path.includes('/Venta') && requestBody) {
        const sim = await this.procesarVenta(requestBody as CreateVentaDto);
        status = sim.status;
        responseBody = sim.success ? sim.data : { codigo: 'STOCK_INSUFICIENTE', mensaje: sim.error };
      } else if (method === 'POST' && path.includes('/Compra') && requestBody) {
        const sim = await this.registrarCompra(requestBody as CreateCompraDto);
        status = sim.success ? 201 : 400;
        responseBody = sim.success ? sim.data : { codigo: 'ERROR', mensaje: sim.error };
      }

      const latencyMs = Math.round((performance.now() - t0 + 3.4) * 10) / 10;
      return {
        method,
        path,
        status,
        latencyMs,
        source: 'portfolio-snapshot',
        requestBody,
        responseBody,
        timestamp: nowClock(),
        sqlTrace: [
          `[${nowClock()}] ${method} ${path} -> HTTP ${status} (${latencyMs}ms · Snapshot 3 Años)`,
          ...(sqlExplain ?? []),
          status < 400
            ? `[commit] Transacción simulada confirmada sobre dataset de 36 meses`
            : `[rollback] StockInsuficienteException capturada -> ROLLBACK TRANSACTION`,
        ],
      };
    }
  },
};

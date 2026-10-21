import {
  Producto,
  InventarioItem,
  Cliente,
  CreateVentaDto,
  VentaResponseDto,
  ActualizarStockDto,
  Sucursal,
} from '../types/api'

const API_BASE = '/api'

export const SUCURSALES_DEMO: Sucursal[] = [
  { id: 1, nombre: 'Matriz Centro', direccion: 'Calle 5 de Mayo #123' },
  { id: 2, nombre: 'Sucursal Norte', direccion: 'Av. Vallarta #4500' },
  { id: 3, nombre: 'Sucursal Sur', direccion: 'Blvd. Perisur #890' },
  { id: 4, nombre: 'Sucursal Este', direccion: 'Calz. Independencia #202' },
  { id: 5, nombre: 'Sucursal Oeste', direccion: 'Av. Aviación #999' },
]

export const CLIENTES_DEMO: Cliente[] = [
  { clienteId: 1, nombre: 'Público General', rfc: 'XAXX010101000', email: 'mostrador@panaderiatanajara.com', tipoClienteId: 1, tipoClienteNombre: 'Minorista' },
  { clienteId: 2, nombre: 'Cafetería La Selva', rfc: 'SEL980412XYZ', email: 'compras@laselva.com', tipoClienteId: 2, tipoClienteNombre: 'Mayorista' },
  { clienteId: 3, nombre: 'Restaurante El Gourmet', rfc: 'GOU051120ABC', email: 'cheff@elgourmet.mx', tipoClienteId: 2, tipoClienteNombre: 'Mayorista' },
  { clienteId: 4, nombre: 'Doña María López', rfc: 'LOPM750819K32', email: 'maria.lopez@gmail.com', tipoClienteId: 1, tipoClienteNombre: 'Minorista' },
]

// Datos de demostración enriquecidos basados en Base de datos.txt
const MOCK_PRODUCTOS: Producto[] = [
  {
    productoId: 1,
    nombre: 'Concha de Vainilla Tradicional',
    descripcion: 'Pan dulce artesanal esponjoso con cubierta crujiente de mantequilla y vainilla natural.',
    tipoProductoId: 1,
    tipoProductoNombre: 'Pan Dulce',
    unidadMedidaId: 1,
    unidadMedidaNombre: 'Pieza',
    unidadMedidaAbreviatura: 'pza',
    precioVenta: 14.50,
    costoPromedio: 5.20,
    esVendible: true,
    esInsumo: false,
    stockTotal: 45
  },
  {
    productoId: 2,
    nombre: 'Baguette Rústica de Masa Madre',
    descripcion: 'Corteza dorada y crujiente, miga alveolada con 24 horas de fermentación lenta.',
    tipoProductoId: 2,
    tipoProductoNombre: 'Pan Salado',
    unidadMedidaId: 1,
    unidadMedidaNombre: 'Pieza',
    unidadMedidaAbreviatura: 'pza',
    precioVenta: 32.00,
    costoPromedio: 11.50,
    esVendible: true,
    esInsumo: false,
    stockTotal: 28
  },
  {
    productoId: 3,
    nombre: 'Croissant Francés de Mantequilla',
    descripcion: 'Laminado artesanal con mantequilla de alta calidad, hojaldrado y dorado al punto.',
    tipoProductoId: 3,
    tipoProductoNombre: 'Repostería',
    unidadMedidaId: 1,
    unidadMedidaNombre: 'Pieza',
    unidadMedidaAbreviatura: 'pza',
    precioVenta: 28.00,
    costoPromedio: 9.80,
    esVendible: true,
    esInsumo: false,
    stockTotal: 18
  },
  {
    productoId: 4,
    nombre: 'Bolillo Tradicional de Horno de Piedra',
    descripcion: 'Crujiente por fuera y suave miga interior, horneado con vapor continuo.',
    tipoProductoId: 2,
    tipoProductoNombre: 'Pan Salado',
    unidadMedidaId: 1,
    unidadMedidaNombre: 'Pieza',
    unidadMedidaAbreviatura: 'pza',
    precioVenta: 4.50,
    costoPromedio: 1.60,
    esVendible: true,
    esInsumo: false,
    stockTotal: 120
  },
  {
    productoId: 5,
    nombre: 'Dona Glaseada de Chocolate Belga',
    descripcion: 'Masa frita ligera con cobertura de ganache de chocolate 70% cacao.',
    tipoProductoId: 1,
    tipoProductoNombre: 'Pan Dulce',
    unidadMedidaId: 1,
    unidadMedidaNombre: 'Pieza',
    unidadMedidaAbreviatura: 'pza',
    precioVenta: 18.00,
    costoPromedio: 6.40,
    esVendible: true,
    esInsumo: false,
    stockTotal: 8
  },
  {
    productoId: 6,
    nombre: 'Pastel Tres Leches Individual',
    descripcion: 'Bizcocho bañado en infusión de tres leches y canela, decorado con merengue suizo.',
    tipoProductoId: 3,
    tipoProductoNombre: 'Repostería',
    unidadMedidaId: 1,
    unidadMedidaNombre: 'Pieza',
    unidadMedidaAbreviatura: 'pza',
    precioVenta: 55.00,
    costoPromedio: 22.00,
    esVendible: true,
    esInsumo: false,
    stockTotal: 5
  },
  {
    productoId: 7,
    nombre: 'Harina de Trigo Extra Fina (Insumo)',
    descripcion: 'Insumo de panadería grado pastelero con alta fuerza W.',
    tipoProductoId: 4,
    tipoProductoNombre: 'Materia Prima',
    unidadMedidaId: 2,
    unidadMedidaNombre: 'Kilogramo',
    unidadMedidaAbreviatura: 'kg',
    precioVenta: 22.00,
    costoPromedio: 15.00,
    esVendible: false,
    esInsumo: true,
    stockTotal: 250
  }
]

let mockInventario: InventarioItem[] = [
  { inventarioId: 1, sucursalId: 1, sucursalNombre: 'Matriz Centro', productoId: 1, productoNombre: 'Concha de Vainilla Tradicional', descripcion: 'Pan dulce artesanal', tipoProductoNombre: 'Pan Dulce', unidadMedida: 'pza', cantidadStock: 35, precioVenta: 14.50, esVendible: true, esInsumo: false },
  { inventarioId: 2, sucursalId: 1, sucursalNombre: 'Matriz Centro', productoId: 2, productoNombre: 'Baguette Rústica de Masa Madre', descripcion: 'Corteza dorada', tipoProductoNombre: 'Pan Salado', unidadMedida: 'pza', cantidadStock: 18, precioVenta: 32.00, esVendible: true, esInsumo: false },
  { inventarioId: 3, sucursalId: 1, sucursalNombre: 'Matriz Centro', productoId: 3, productoNombre: 'Croissant Francés de Mantequilla', descripcion: 'Hojaldrado y dorado', tipoProductoNombre: 'Repostería', unidadMedida: 'pza', cantidadStock: 12, precioVenta: 28.00, esVendible: true, esInsumo: false },
  { inventarioId: 4, sucursalId: 1, sucursalNombre: 'Matriz Centro', productoId: 4, productoNombre: 'Bolillo Tradicional de Horno de Piedra', descripcion: 'Horno de piedra', tipoProductoNombre: 'Pan Salado', unidadMedida: 'pza', cantidadStock: 80, precioVenta: 4.50, esVendible: true, esInsumo: false },
  { inventarioId: 5, sucursalId: 1, sucursalNombre: 'Matriz Centro', productoId: 5, productoNombre: 'Dona Glaseada de Chocolate Belga', descripcion: 'Ganache de chocolate', tipoProductoNombre: 'Pan Dulce', unidadMedida: 'pza', cantidadStock: 6, precioVenta: 18.00, esVendible: true, esInsumo: false },
  { inventarioId: 6, sucursalId: 1, sucursalNombre: 'Matriz Centro', productoId: 6, productoNombre: 'Pastel Tres Leches Individual', descripcion: 'Bizcocho bañado', tipoProductoNombre: 'Repostería', unidadMedida: 'pza', cantidadStock: 3, precioVenta: 55.00, esVendible: true, esInsumo: false },
  { inventarioId: 7, sucursalId: 2, sucursalNombre: 'Sucursal Norte', productoId: 1, productoNombre: 'Concha de Vainilla Tradicional', descripcion: 'Pan dulce artesanal', tipoProductoNombre: 'Pan Dulce', unidadMedida: 'pza', cantidadStock: 10, precioVenta: 14.50, esVendible: true, esInsumo: false },
  { inventarioId: 8, sucursalId: 2, sucursalNombre: 'Sucursal Norte', productoId: 2, productoNombre: 'Baguette Rústica de Masa Madre', descripcion: 'Corteza dorada', tipoProductoNombre: 'Pan Salado', unidadMedida: 'pza', cantidadStock: 10, precioVenta: 32.00, esVendible: true, esInsumo: false },
]

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/Producto`, { method: 'HEAD', signal: AbortSignal.timeout(1500) })
      return res.ok || res.status === 200
    } catch {
      return false
    }
  },

  async getProductos(): Promise<Producto[]> {
    try {
      const res = await fetch(`${API_BASE}/Producto`, { signal: AbortSignal.timeout(2000) })
      if (!res.ok) throw new Error('API offline')
      return await res.json()
    } catch {
      return MOCK_PRODUCTOS
    }
  },

  async getInventario(sucursalId?: number): Promise<InventarioItem[]> {
    try {
      const url = sucursalId
        ? `${API_BASE}/Inventario/sucursal/${sucursalId}`
        : `${API_BASE}/Inventario`
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (!res.ok) throw new Error('API offline')
      return await res.json()
    } catch {
      if (sucursalId) {
        return mockInventario.filter(i => i.sucursalId === sucursalId)
      }
      return mockInventario
    }
  },

  async getClientes(): Promise<Cliente[]> {
    try {
      const res = await fetch(`${API_BASE}/Cliente`, { signal: AbortSignal.timeout(2000) })
      if (!res.ok) throw new Error('API offline')
      return await res.json()
    } catch {
      return CLIENTES_DEMO
    }
  },

  async getVentas(): Promise<VentaResponseDto[]> {
    try {
      const res = await fetch(`${API_BASE}/Venta`, { signal: AbortSignal.timeout(2000) })
      if (!res.ok) throw new Error('API offline')
      return await res.json()
    } catch {
      return []
    }
  },

  async procesarVenta(dto: CreateVentaDto): Promise<{ success: boolean; data?: VentaResponseDto; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/Venta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        signal: AbortSignal.timeout(5000),
      })

      const responseBody = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: responseBody.mensaje || responseBody.Mensaje || 'Error al procesar la venta en el servidor.'
        }
      }

      return {
        success: true,
        data: responseBody
      }
    } catch {
      // MOCK FALLBACK SI EL BACKEND NO ESTÁ ESCUCHANDO:
      // Validar stock localmente en mockInventario
      for (const item of dto.detalles) {
        const inv = mockInventario.find(i => i.sucursalId === dto.sucursalId && i.productoId === item.productoId)
        const prod = MOCK_PRODUCTOS.find(p => p.productoId === item.productoId)
        const nombre = prod?.nombre || `Producto #${item.productoId}`

        if (!inv || inv.cantidadStock < item.cantidad) {
          return {
            success: false,
            error: `Stock insuficiente para '${nombre}'. Disponible en sucursal: ${inv?.cantidadStock ?? 0}, Solicitado: ${item.cantidad}.`
          }
        }
      }

      // Descontar del mock
      for (const item of dto.detalles) {
        const inv = mockInventario.find(i => i.sucursalId === dto.sucursalId && i.productoId === item.productoId)
        if (inv) inv.cantidadStock -= item.cantidad
      }

      const subtotal = dto.detalles.reduce((acc, d) => acc + (d.cantidad * d.precioUnitario), 0)
      const impuestos = Math.round(subtotal * 0.16 * 100) / 100
      const total = subtotal + impuestos

      const mockVenta: VentaResponseDto = {
        ventaId: Math.floor(1000 + Math.random() * 9000),
        sucursalId: dto.sucursalId,
        sucursalNombre: SUCURSALES_DEMO.find(s => s.id === dto.sucursalId)?.nombre || 'Matriz',
        empleadoId: dto.empleadoId,
        empleadoNombre: 'Carlos Hernández (Cajero)',
        clienteId: dto.clienteId,
        clienteNombre: CLIENTES_DEMO.find(c => c.clienteId === dto.clienteId)?.nombre || 'Público General',
        tipoImpuestoId: 1,
        tipoImpuestoDescripcion: 'IVA 16%',
        tipoImpuestoPorcentaje: 0.16,
        fechaHora: new Date().toISOString(),
        subtotal,
        totalImpuestos: impuestos,
        total,
        estatus: 'Completada',
        detalles: dto.detalles.map((d, idx) => ({
          ventaDetalleId: idx + 1,
          productoId: d.productoId,
          productoNombre: MOCK_PRODUCTOS.find(p => p.productoId === d.productoId)?.nombre || 'Producto',
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          importe: d.cantidad * d.precioUnitario
        }))
      }

      return { success: true, data: mockVenta }
    }
  },

  async actualizarStock(dto: ActualizarStockDto): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/Inventario/actualizar-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      })
      return res.ok
    } catch {
      const inv = mockInventario.find(i => i.sucursalId === dto.sucursalId && i.productoId === dto.productoId)
      if (inv) {
        if (dto.operacion === 'fijar') {
          inv.cantidadStock = dto.cantidad
        } else {
          inv.cantidadStock += dto.cantidad
        }
      }
      return true
    }
  }
}

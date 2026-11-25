# 🗺️ Atlas de Arquitectura y Mapas de Base de Datos (`PanaderiaDB`)

Este documento concentra los **5 mapas formales de ingeniería de datos** del sistema **TahonaEngine · Panificadora Tanajara**:

1. **Diagrama Entidad-Relación Completo (Crow's Foot · 15 Tablas en 3FN)**
2. **Mapa Topológico de Dependencias e Integridad Referencial**
3. **Mapa de Secuencia Transaccional ACID y Control de Concurrencia**
4. **Mapa Físico de Índices Cubrientes (`INCLUDE`) y SARGability**
5. **Mapa de Linaje Analítico (Proyección Estrella OLTP → OLAP)**

---

## 1. Diagrama Entidad-Relación (15 Tablas en 3FN)

```mermaid
erDiagram
    PUESTOS ||--o{ EMPLEADOS : "asigna_rol"
    SUCURSALES ||--o{ EMPLEADOS : "adscribe"
    SUCURSALES ||--o{ INVENTARIO : "almacena"
    SUCURSALES ||--o{ VENTAS : "despacha"
    SUCURSALES ||--o{ COMPRAS : "recibe"
    TIPOCLIENTE ||--o{ CLIENTES : "clasifica"
    TIPOPRODUCTO ||--o{ PRODUCTOS : "agrupa"
    UNIDADMEDIDA ||--o{ PRODUCTOS : "dimensiona"
    TIPOIMPUESTO ||--o{ VENTAS : "grava"
    EMPLEADOS ||--o{ VENTAS : "opera_caja"
    EMPLEADOS ||--o{ COMPRAS : "recepciona"
    CLIENTES ||--o{ VENTAS : "adquiere"
    PROVEEDORES ||--o{ COMPRAS : "suministra"
    PRODUCTOS ||--o{ INVENTARIO : "controla_existencia"
    PRODUCTOS ||--o{ VENTADETALLE : "vende_partida"
    PRODUCTOS ||--o{ COMPRADETALLE : "abastece_insumo"
    VENTAS ||--|{ VENTADETALLE : "desglosa"
    COMPRAS ||--|{ COMPRADETALLE : "detalla"

    SUCURSALES {
        int SucursalID PK
        varchar Nombre
        varchar Direccion
    }
    PUESTOS {
        int PuestoID PK
        varchar Nombre
    }
    TIPOCLIENTE {
        int TipoClienteID PK
        varchar Nombre
    }
    TIPOPRODUCTO {
        int TipoProductoID PK
        varchar Nombre
    }
    UNIDADMEDIDA {
        int UnidadMedidaID PK
        varchar Nombre
        varchar Abreviatura
    }
    TIPOIMPUESTO {
        int TipoImpuestoID PK
        varchar Descripcion
        decimal Porcentaje
    }
    EMPLEADOS {
        int EmpleadoID PK
        varchar Nombre
        varchar Apellido
        int PuestoID FK
        int SucursalID FK
        date FechaContratacion
    }
    CLIENTES {
        int ClienteID PK
        varchar Nombre
        varchar RFC
        varchar Email UK
        int TipoClienteID FK
    }
    PROVEEDORES {
        int ProveedorID PK
        varchar NombreFiscal
        varchar RFC UK
        varchar NombreContacto
    }
    PRODUCTOS {
        int ProductoID PK
        varchar Nombre
        int TipoProductoID FK
        int UnidadMedidaID FK
        decimal PrecioVenta
        decimal CostoPromedio
        bit EsVendible
        bit EsInsumo
    }
    INVENTARIO {
        int InventarioID PK
        int SucursalID FK,UK
        int ProductoID FK,UK
        decimal CantidadStock
    }
    VENTAS {
        int VentaID PK
        int SucursalID FK
        int EmpleadoID FK
        int ClienteID FK
        int TipoImpuestoID FK
        datetime FechaHora
        decimal Subtotal
        decimal TotalImpuestos
        decimal Total
        varchar Estatus
    }
    VENTADETALLE {
        int VentaDetalleID PK
        int VentaID FK
        int ProductoID FK
        decimal Cantidad
        decimal PrecioUnitario
        decimal Importe "COMPUTED (Cantidad * PrecioUnitario)"
    }
    COMPRAS {
        int CompraID PK
        int ProveedorID FK
        int SucursalID FK
        int EmpleadoID FK
        date FechaRecepcion
        decimal Total
    }
    COMPRADETALLE {
        int CompraDetalleID PK
        int CompraID FK
        int ProductoID FK
        decimal Cantidad
        decimal CostoUnitario
    }
```

---

## 2. Mapa Topológico de Dependencias (Orden DDL y Protección Referencial)

Todas las llaves foráneas operan bajo restricción `NO ACTION` (`DeleteBehavior.ClientSetNull` en EF Core) combinada con **Borrado Lógico (`EsVendible = 0`)** en `Productos` para impedir pérdida accidental de historia contable.

```mermaid
flowchart LR
    subgraph Ring1["Anillo 1: Catálogos Lookup (Sin FKs)"]
        P["Puestos"]
        S["Sucursales"]
        TC["TipoCliente"]
        TP["TipoProducto"]
        UM["UnidadMedida"]
        TI["TipoImpuesto"]
    end

    subgraph Ring2["Anillo 2: Entidades Maestras"]
        E["Empleados"]
        PR["Proveedores (UQ RFC)"]
        CL["Clientes (UQ Email)"]
        PD["Productos (Soft Delete)"]
    end

    subgraph Ring3["Anillo 3: Núcleo Transaccional ACID"]
        INV["Inventario (UQ Sucursal+Producto)"]
        CMP["Compras"]
        CD["CompraDetalle"]
        VNT["Ventas"]
        VD["VentaDetalle (Computed Importe)"]
    end

    P --> E
    S --> E
    TC --> CL
    TP --> PD
    UM --> PD
    S --> INV
    PD --> INV
    PR --> CMP
    S --> CMP
    E --> CMP
    CMP --> CD
    PD --> CD
    S --> VNT
    E --> VNT
    CL --> VNT
    TI --> VNT
    VNT --> VD
    PD --> VD
```

---

## 3. Mapa de Secuencia Transaccional ACID (`POST /api/Venta`)

```mermaid
sequenceDiagram
    autonumber
    participant POS as Cliente React (TahonaPOS)
    participant API as VentaController (.NET 8)
    participant SVC as VentaService
    participant REPO as VentaRepository (EF Core)
    participant SQL as SQL Server (PanaderiaDB)

    POS->>API: POST /api/Venta (CreateVentaDto)
    API->>SVC: ProcesarVentaAsync(dto)
    SVC->>SQL: SELECT Productos AsNoTracking()
    SVC->>SVC: Valida EsVendible y calcula Subtotal + Impuestos
    SVC->>REPO: RegistrarVentaTransaccionalAsync(venta, items)
    REPO->>SQL: BEGIN TRANSACTION
    loop Por cada partida del carrito
        REPO->>SQL: SELECT Inventario WHERE SucursalID=@s AND ProductoID=@p (UQ Index Seek)
        alt StockDisponible < CantidadSolicitada
            REPO->>SQL: ROLLBACK TRANSACTION
            REPO-->>API: throw StockInsuficienteException
            API-->>POS: HTTP 400 Bad Request (STOCK_INSUFICIENTE)
        else Stock suficiente
            REPO->>SQL: UPDATE Inventario SET CantidadStock -= @cant
        end
    end
    REPO->>SQL: INSERT INTO Ventas + INSERT INTO VentaDetalle (OUTPUT Importe)
    REPO->>SQL: COMMIT TRANSACTION
    REPO-->>SVC: Venta confirmada con Folio IDENTITY
    SVC-->>API: VentaResponseDto
    API-->>POS: HTTP 201 Created + Ticket Fiscal
```

---

## 4. Mapa Físico de Indexación B-Tree y SARGability

```mermaid
flowchart TD
    Q1["GET /api/Database/analytics?anio=2026"] --> SARG["Predicado SARGable: FechaHora >= 2026-01-01 AND FechaHora < 2027-01-01"]
    SARG --> IX1["Index Seek: IX_Ventas_FechaHora_Sucursal"]
    IX1 --> INC1["Columnas INCLUDE (Total, Subtotal, Estatus) resueltas en hoja del índice"]
    INC1 --> ZERO["0 Key Lookups a tabla base (15,612 filas)"]

    Q2["Top Productos y Familias"] --> IX2["Index Scan/Seek: IX_VentaDetalle_ProductoID"]
    IX2 --> INC2["Columnas INCLUDE (VentaID, Cantidad, PrecioUnitario)"]
    INC2 --> AGG["Agregación SUM(Cantidad * PrecioUnitario) en motor SQL (42,152 filas)"]
```

---

## 5. Mapa Estrella de Linaje Analítico (OLTP 3FN → Proyección OLAP)

```mermaid
flowchart TB
    DT["Dim_Tiempo (Año, Mes, Estacionalidad Rosca / Pan de Muerto)"] --> FACT
    DS["Dim_Sucursal (5 Hornos Activos)"] --> FACT
    DP["Dim_Producto (SKU, Familia, Unidad, CostoPromedio)"] --> FACT
    DC["Dim_Cliente (Mostrador, Hotel, Restaurante, VIP)"] --> FACT
    DF["Dim_Fiscal (IVA 16%, Tasa 0%, IEPS 8%)"] --> FACT

    FACT["Hechos_Ventas_Partidas (42,152 líneas · Importe, Cantidad, Margen Bruto)"]
```

# Project Structure

## Architecture Overview
El proyecto implementa **Clean Architecture** (Arquitectura Limpia) con separación clara de responsabilidades en 4 capas principales, siguiendo los principios de inversión de dependencias y separación de concerns.

## Directory Structure

```
Proyecto Panaderia/
├── Panaderia/                          # API Layer (Presentation)
│   ├── Controllers/                    # API Controllers
│   │   └── ProductosController.cs      # Endpoints para gestión de productos
│   ├── Properties/                     # Launch settings
│   ├── appsettings.json               # Configuración de aplicación
│   ├── appsettings.Development.json   # Configuración de desarrollo
│   ├── Program.cs                     # Entry point y configuración de servicios
│   └── Panaderia.Api.csproj           # Proyecto Web API
│
├── Panaderia.Application/             # Application Layer (Use Cases)
│   ├── DTO'S/                         # Data Transfer Objects
│   │   └── CreateProductoDto.cs       # DTO para creación de productos
│   ├── Interfaces/                    # Contratos de servicios y repositorios
│   │   ├── IProductoService.cs        # Interfaz de servicio de productos
│   │   └── IProductoRepository.cs     # Interfaz de repositorio de productos
│   ├── Services/                      # Implementación de lógica de negocio
│   │   └── ProductoService.cs         # Servicio de productos
│   └── Panaderia.Application.csproj   # Proyecto de aplicación
│
├── Panaderia.Domain/                  # Domain Layer (Entities & Business Rules)
│   ├── Entities/                      # Entidades del dominio
│   │   ├── Producto.cs                # Entidad Producto
│   │   ├── TipoProducto.cs            # Tipos de producto
│   │   ├── UnidadMedidum.cs           # Unidades de medida
│   │   ├── TipoImpuesto.cs            # Tipos de impuesto
│   │   ├── Inventario.cs              # Control de inventario
│   │   ├── Venta.cs                   # Ventas
│   │   ├── VentaDetalle.cs            # Detalle de ventas
│   │   ├── Compra.cs                  # Compras
│   │   ├── CompraDetalle.cs           # Detalle de compras
│   │   ├── Cliente.cs                 # Clientes
│   │   ├── TipoCliente.cs             # Tipos de cliente
│   │   ├── Proveedore.cs              # Proveedores
│   │   ├── Empleado.cs                # Empleados
│   │   ├── Puesto.cs                  # Puestos de trabajo
│   │   └── Sucursale.cs               # Sucursales
│   ├── Interfaces/                    # Interfaces del dominio
│   ├── Enums/                         # Enumeraciones
│   └── Panaderia.Domain.csproj        # Proyecto de dominio
│
└── Panaderia.Infrastructure/          # Infrastructure Layer (Data Access)
    ├── Persistence/                   # Capa de persistencia
    │   ├── Contexts/                  # DbContext de Entity Framework
    │   │   └── PanaderiaDbContext.cs  # Contexto principal de base de datos
    │   ├── Configurations/            # Configuraciones de entidades EF
    │   └── Repositories/              # Implementación de repositorios
    │       └── ProductoRepository.cs  # Repositorio de productos
    └── Panaderia.Infrastructure.csproj # Proyecto de infraestructura
```

## Core Components and Relationships

### 1. Panaderia (API Layer)
**Responsabilidad**: Capa de presentación que expone endpoints REST API

**Componentes Clave**:
- **Controllers**: Manejan requests HTTP y coordinan con servicios de aplicación
- **Program.cs**: Configura servicios, middleware, inyección de dependencias y pipeline HTTP
- **appsettings.json**: Configuración de conexión a BD, logging, etc.

**Dependencias**: 
- Panaderia.Application (servicios)
- Panaderia.Infrastructure (implementaciones de repositorios)

### 2. Panaderia.Application (Application Layer)
**Responsabilidad**: Orquestación de casos de uso y lógica de aplicación

**Componentes Clave**:
- **DTOs**: Objetos de transferencia de datos para comunicación entre capas
- **Interfaces**: Contratos para servicios (IProductoService) y repositorios (IProductoRepository)
- **Services**: Implementación de lógica de negocio y casos de uso

**Dependencias**: 
- Panaderia.Domain (entidades y reglas de negocio)

**Patrón**: Define interfaces de repositorios pero no las implementa (Dependency Inversion)

### 3. Panaderia.Domain (Domain Layer)
**Responsabilidad**: Núcleo del negocio con entidades y reglas de dominio

**Componentes Clave**:
- **Entities**: Modelos de dominio que representan conceptos del negocio
  - Productos y clasificación (Producto, TipoProducto, UnidadMedidum, TipoImpuesto)
  - Operaciones comerciales (Venta, VentaDetalle, Compra, CompraDetalle)
  - Gestión de recursos (Inventario, Cliente, Proveedore, Empleado)
  - Organización (Sucursale, Puesto, TipoCliente)

**Dependencias**: Ninguna (capa más interna)

**Principio**: No depende de ninguna otra capa, es el corazón del sistema

### 4. Panaderia.Infrastructure (Infrastructure Layer)
**Responsabilidad**: Implementación de acceso a datos y servicios externos

**Componentes Clave**:
- **Contexts**: DbContext de Entity Framework Core para mapeo objeto-relacional
- **Configurations**: Fluent API para configuración de entidades (relaciones, constraints, índices)
- **Repositories**: Implementación concreta de interfaces de repositorio definidas en Application

**Dependencias**: 
- Panaderia.Application (interfaces de repositorio)
- Panaderia.Domain (entidades)

**Tecnologías**: Entity Framework Core 8.0, SQL Server

## Architectural Patterns

### Clean Architecture (Arquitectura Limpia)
- **Separación de Concerns**: Cada capa tiene responsabilidades bien definidas
- **Dependency Rule**: Las dependencias apuntan hacia adentro (hacia el dominio)
- **Testabilidad**: Lógica de negocio independiente de frameworks y BD

### Repository Pattern
- Abstracción del acceso a datos mediante interfaces (IProductoRepository)
- Implementación concreta en Infrastructure (ProductoRepository)
- Facilita testing mediante mocks y cambio de tecnología de persistencia

### Dependency Injection
- Configuración centralizada en Program.cs
- Inversión de control para gestión de dependencias
- Facilita testing y desacoplamiento

### DTO Pattern
- Objetos de transferencia de datos (CreateProductoDto) para comunicación entre capas
- Separación entre modelos de dominio y modelos de API
- Control de qué datos se exponen en cada endpoint

### Service Layer Pattern
- Servicios de aplicación (ProductoService) encapsulan casos de uso
- Coordinan entre repositorios y aplican lógica de negocio
- Interfaz clara para controllers (IProductoService)

## Data Flow

```
HTTP Request
    ↓
Controller (API Layer)
    ↓
Service (Application Layer) ← DTO
    ↓
Repository Interface (Application Layer)
    ↓
Repository Implementation (Infrastructure Layer)
    ↓
DbContext (Infrastructure Layer)
    ↓
Database (SQL Server)
```

## Project Dependencies Graph

```
Panaderia.Api
    ├─→ Panaderia.Application
    │       └─→ Panaderia.Domain
    └─→ Panaderia.Infrastructure
            ├─→ Panaderia.Application
            └─→ Panaderia.Domain
```

## Key Design Decisions

1. **Clean Architecture**: Garantiza mantenibilidad y testabilidad a largo plazo
2. **Entity Framework Core**: ORM robusto para .NET con soporte completo de SQL Server
3. **Async/Await**: Operaciones asíncronas para mejor rendimiento y escalabilidad
4. **DTOs**: Separación clara entre modelos de dominio y contratos de API
5. **Dependency Injection**: Gestión automática de dependencias y ciclo de vida de objetos

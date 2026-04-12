# 🥖 Sistema de Gestión para Panaderías

Sistema integral de gestión para panaderías desarrollado con .NET 8.0 y Clean Architecture. Permite administrar operaciones comerciales, inventario, ventas, compras y recursos humanos de manera eficiente y escalable.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## ✨ Características

### Gestión de Productos
- ✅ Registro y administración de productos de panadería
- ✅ Clasificación por tipos de producto
- ✅ Control de unidades de medida
- ✅ Gestión de impuestos por producto

### Control de Inventario
- ✅ Seguimiento en tiempo real del stock
- ✅ Gestión de inventario por sucursal
- ✅ Alertas de stock mínimo

### Gestión de Ventas
- ✅ Registro de ventas con detalle de productos
- ✅ Gestión de clientes y tipos de cliente
- ✅ Cálculo automático de impuestos
- ✅ Historial de transacciones

### Gestión de Compras
- ✅ Registro de compras a proveedores
- ✅ Control de proveedores
- ✅ Trazabilidad de adquisiciones

### Recursos Humanos
- ✅ Gestión de empleados
- ✅ Administración de puestos de trabajo
- ✅ Asignación de personal por sucursal

### Multi-Sucursal
- ✅ Soporte para múltiples sucursales
- ✅ Gestión independiente de inventario por ubicación

## 🏗️ Arquitectura

El proyecto implementa **Clean Architecture** con separación clara de responsabilidades en 4 capas:

```
┌─────────────────────────────────────────┐
│         API Layer (Panaderia)           │
│    Controllers, Program.cs, Startup    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Application Layer (Application)       │
│   Services, DTOs, Interfaces            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Domain Layer (Domain)              │
│      Entities, Business Rules           │
└─────────────────────────────────────────┘
               ▲
               │
┌──────────────┴──────────────────────────┐
│  Infrastructure Layer (Infrastructure)  │
│  DbContext, Repositories, EF Core       │
└─────────────────────────────────────────┘
```

### Principios Aplicados
- ✅ **Dependency Inversion**: Las dependencias apuntan hacia el dominio
- ✅ **Separation of Concerns**: Cada capa tiene responsabilidades bien definidas
- ✅ **Repository Pattern**: Abstracción del acceso a datos
- ✅ **Dependency Injection**: Gestión automática de dependencias
- ✅ **Async/Await**: Operaciones asíncronas para mejor rendimiento

## 🛠️ Tecnologías

- **Framework**: .NET 8.0 (LTS)
- **Lenguaje**: C# 12
- **ORM**: Entity Framework Core 8.0.11
- **Base de Datos**: SQL Server
- **API**: ASP.NET Core Web API
- **Documentación**: Swagger/OpenAPI
- **IDE**: Visual Studio 2022 / JetBrains Rider

### Paquetes NuGet Principales
```xml
Microsoft.EntityFrameworkCore.SqlServer (8.0.11)
Microsoft.EntityFrameworkCore.Tools (8.0.11)
Microsoft.EntityFrameworkCore.Design (8.0.11)
Swashbuckle.AspNetCore (6.6.2)
```

## 📦 Requisitos Previos

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server 2019+](https://www.microsoft.com/sql-server) o SQL Server Express
- [Visual Studio 2022](https://visualstudio.microsoft.com/) o [JetBrains Rider](https://www.jetbrains.com/rider/) (opcional)
- [Git](https://git-scm.com/)

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/proyecto-panaderia.git
cd proyecto-panaderia
```

### 2. Restaurar dependencias
```bash
dotnet restore
```

### 3. Configurar la base de datos
Edita el archivo `Panaderia/appsettings.json` y agrega tu cadena de conexión:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### 4. Aplicar migraciones
```bash
cd Panaderia
dotnet ef database update --project ../Panaderia.Infrastructure
```

### 5. Ejecutar la aplicación
```bash
dotnet run --project Panaderia/Panaderia.Api.csproj
```

La API estará disponible en:
- **HTTPS**: `https://localhost:7001`
- **HTTP**: `http://localhost:5001`
- **Swagger UI**: `https://localhost:7001/swagger`

## ⚙️ Configuración

### Variables de Entorno (Producción)
```bash
export ConnectionStrings__DefaultConnection="Server=tu-servidor;Database=PanaderiaDB;User Id=usuario;Password=contraseña;"
export ASPNETCORE_ENVIRONMENT=Production
```

### Configuración de Desarrollo
El archivo `appsettings.Development.json` se usa automáticamente en modo desarrollo:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

## 📖 Uso

### Swagger UI
Accede a `https://localhost:7001/swagger` para explorar y probar los endpoints de la API de forma interactiva.

### Ejemplo de Petición: Crear Producto
```bash
curl -X POST "https://localhost:7001/api/Producto" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Pan Francés",
    "descripcion": "Pan tradicional francés recién horneado",
    "precioVenta": 25.50
  }'
```

### Ejemplo de Respuesta
```json
{
  "mensaje": "Producto horneado y guardado con éxito 🥖"
}
```

## 📁 Estructura del Proyecto

```
Proyecto Panaderia/
├── Panaderia/                          # API Layer
│   ├── Controllers/                    # Controladores REST
│   ├── Program.cs                      # Configuración y startup
│   └── appsettings.json               # Configuración
│
├── Panaderia.Application/             # Application Layer
│   ├── DTO'S/                         # Data Transfer Objects
│   ├── Interfaces/                    # Contratos de servicios
│   └── Services/                      # Lógica de negocio
│
├── Panaderia.Domain/                  # Domain Layer
│   └── Entities/                      # Entidades del dominio
│       ├── Producto.cs
│       ├── Cliente.cs
│       ├── Venta.cs
│       ├── Compra.cs
│       ├── Inventario.cs
│       └── ...
│
└── Panaderia.Infrastructure/          # Infrastructure Layer
    └── Persistence/
        ├── Contexts/                  # DbContext
        └── Repositories/              # Implementación de repositorios
```

## 🔌 API Endpoints

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/Producto` | Crear un nuevo producto |
| GET | `/api/Producto` | Obtener todos los productos |

### Próximamente
- Clientes
- Ventas
- Compras
- Inventario
- Empleados
- Sucursales

## 🗃️ Modelo de Base de Datos

### Entidades Principales
- **Producto**: Productos de la panadería
- **TipoProducto**: Clasificación de productos
- **UnidadMedida**: Unidades de medida (kg, piezas, etc.)
- **TipoImpuesto**: Tipos de impuestos aplicables
- **Inventario**: Control de stock por sucursal
- **Venta**: Registro de ventas
- **VentaDetalle**: Detalle de productos vendidos
- **Compra**: Registro de compras
- **CompraDetalle**: Detalle de productos comprados
- **Cliente**: Información de clientes
- **TipoCliente**: Clasificación de clientes
- **Proveedor**: Información de proveedores
- **Empleado**: Información de empleados
- **Puesto**: Puestos de trabajo
- **Sucursal**: Sucursales de la panadería

## 🧪 Comandos Útiles

### Compilar
```bash
dotnet build
```

### Ejecutar con Hot Reload
```bash
dotnet watch --project Panaderia/Panaderia.Api.csproj
```

### Crear Nueva Migración
```bash
dotnet ef migrations add NombreMigracion --project Panaderia.Infrastructure --startup-project Panaderia
```

### Revertir Migración
```bash
dotnet ef migrations remove --project Panaderia.Infrastructure --startup-project Panaderia
```

### Limpiar y Reconstruir
```bash
dotnet clean && dotnet build
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Seguir las convenciones de C# y .NET
- Usar PascalCase para clases y métodos públicos
- Usar camelCase con underscore para campos privados
- Documentar código complejo con comentarios en español
- Mantener la arquitectura limpia y separación de capas

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo Inicial* - [tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Inspirado en los principios de Clean Architecture de Robert C. Martin
- Comunidad de .NET y Entity Framework Core
- Todos los contribuidores del proyecto

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

📧 Para preguntas o sugerencias: tu-email@ejemplo.com

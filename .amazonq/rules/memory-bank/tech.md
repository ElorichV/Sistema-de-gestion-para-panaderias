# Technology Stack

## Programming Languages and Versions

### C# / .NET
- **Version**: .NET 8.0 (LTS)
- **Language Features**: 
  - Nullable reference types enabled (`<Nullable>enable</Nullable>`)
  - Implicit usings enabled (`<ImplicitUsings>enable</ImplicitUsings>`)
  - Modern C# syntax and patterns

## Frameworks and Libraries

### Core Framework
- **ASP.NET Core 8.0**: Framework web para API REST
- **SDK**: Microsoft.NET.Sdk.Web (para API), Microsoft.NET.Sdk (para librerías)

### Data Access
- **Entity Framework Core 8.0.11**: ORM para acceso a datos
  - `Microsoft.EntityFrameworkCore.SqlServer` (8.0.11): Provider para SQL Server
  - `Microsoft.EntityFrameworkCore.Tools` (8.0.11): Herramientas de migración y scaffolding
  - `Microsoft.EntityFrameworkCore.Design` (8.0.11): Soporte de diseño para API layer

### API Documentation
- **Swashbuckle.AspNetCore 6.6.2**: Generación automática de documentación OpenAPI/Swagger

## Database
- **SQL Server**: Base de datos relacional principal
- **Connection Management**: Entity Framework Core DbContext
- **Migrations**: EF Core Migrations para control de versiones de esquema

## Build System

### Project Structure
- **Solution File**: Panaderia.sln (Visual Studio 2022)
- **Project Format**: SDK-style projects (.csproj)
- **Build Configuration**: Debug y Release

### Project References
```
Panaderia.Api
├── Panaderia.Application (ProjectReference)
└── Panaderia.Infrastructure (ProjectReference)

Panaderia.Application
└── Panaderia.Domain (ProjectReference)

Panaderia.Infrastructure
├── Panaderia.Application (ProjectReference)
└── Panaderia.Domain (ProjectReference)

Panaderia.Domain
└── (No dependencies)
```

## Development Tools

### IDE Support
- **Visual Studio 2022** (Version 17.14+)
- **JetBrains Rider** (project files present)
- Compatible con Visual Studio Code con extensiones C#

### Package Management
- **NuGet**: Gestor de paquetes para dependencias .NET
- **Package Restore**: Automático mediante MSBuild

## Development Commands

### Build Commands
```bash
# Restaurar dependencias
dotnet restore

# Compilar solución completa
dotnet build Panaderia/Panaderia.sln

# Compilar en modo Release
dotnet build Panaderia/Panaderia.sln --configuration Release

# Compilar proyecto específico
dotnet build Panaderia/Panaderia.Api.csproj
```

### Run Commands
```bash
# Ejecutar API en modo desarrollo
dotnet run --project Panaderia/Panaderia.Api.csproj

# Ejecutar con watch (hot reload)
dotnet watch --project Panaderia/Panaderia.Api.csproj
```

### Database Commands
```bash
# Crear nueva migración
dotnet ef migrations add <MigrationName> --project Panaderia.Infrastructure --startup-project Panaderia

# Aplicar migraciones a base de datos
dotnet ef database update --project Panaderia.Infrastructure --startup-project Panaderia

# Revertir última migración
dotnet ef migrations remove --project Panaderia.Infrastructure --startup-project Panaderia

# Ver migraciones aplicadas
dotnet ef migrations list --project Panaderia.Infrastructure --startup-project Panaderia

# Generar script SQL de migración
dotnet ef migrations script --project Panaderia.Infrastructure --startup-project Panaderia
```

### Testing Commands
```bash
# Ejecutar tests (cuando se implementen)
dotnet test

# Ejecutar tests con cobertura
dotnet test --collect:"XPlat Code Coverage"
```

### Clean Commands
```bash
# Limpiar artefactos de compilación
dotnet clean

# Limpiar y reconstruir
dotnet clean && dotnet build
```

## Configuration Files

### appsettings.json
- Configuración de aplicación principal
- Connection strings para base de datos
- Configuración de logging
- Configuración de servicios

### appsettings.Development.json
- Overrides para ambiente de desarrollo
- Logging más detallado
- Connection strings de desarrollo

### launchSettings.json
- Perfiles de ejecución (IIS Express, Kestrel)
- Variables de entorno
- URLs de desarrollo
- Configuración de Swagger

## Runtime Environment

### Target Framework
- **TFM**: net8.0
- **Runtime**: .NET 8.0 Runtime
- **Platform**: Any CPU

### Web Server
- **Kestrel**: Servidor web multiplataforma de alto rendimiento
- **IIS Express**: Opción para desarrollo en Windows

## API Features

### Swagger/OpenAPI
- Documentación interactiva de API
- Disponible en desarrollo en `/swagger`
- Generación automática desde controllers

### Dependency Injection
- Built-in DI container de ASP.NET Core
- Configuración en Program.cs
- Soporte para Scoped, Transient y Singleton lifetimes

### Middleware Pipeline
- Routing
- CORS (si configurado)
- Authentication/Authorization (preparado)
- Exception handling
- Swagger UI

## Development Workflow

1. **Modificar Entidades**: Actualizar clases en Panaderia.Domain/Entities
2. **Crear Migración**: `dotnet ef migrations add <Name>`
3. **Aplicar Migración**: `dotnet ef database update`
4. **Implementar Repositorio**: Agregar métodos en Infrastructure/Repositories
5. **Crear Servicio**: Implementar lógica en Application/Services
6. **Exponer Endpoint**: Agregar controller en API/Controllers
7. **Probar**: Usar Swagger UI o herramientas como Postman

## Version Control
- **Git**: Sistema de control de versiones
- **Ignored Files**: bin/, obj/, .vs/, *.user (típicos de .NET)

## Future Considerations
- **Testing Framework**: xUnit, NUnit o MSTest para unit tests
- **Logging**: Serilog o NLog para logging estructurado
- **Authentication**: JWT Bearer tokens o Identity Server
- **Caching**: Redis o Memory Cache
- **API Versioning**: Microsoft.AspNetCore.Mvc.Versioning
- **Health Checks**: ASP.NET Core Health Checks

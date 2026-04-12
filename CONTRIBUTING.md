# Guía de Contribución

## Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/sistema-panaderia.git
cd sistema-panaderia
```

### 2. Instalar Dependencias
```bash
dotnet restore
```

### 3. Configurar Base de Datos

Edita `Panaderia/appsettings.json` y configura tu connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Opciones de Connection String:**

- **SQL Server con Windows Auth:**
  ```
  Server=localhost;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;
  ```

- **SQL Server con Usuario/Contraseña:**
  ```
  Server=localhost;Database=PanaderiaDB;User Id=tu_usuario;Password=tu_contraseña;TrustServerCertificate=True;
  ```

- **SQL Server Express:**
  ```
  Server=localhost\\SQLEXPRESS;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;
  ```

### 4. Aplicar Migraciones
```bash
dotnet ef database update --project Panaderia.Infrastructure --startup-project Panaderia
```

### 5. Ejecutar la Aplicación
```bash
dotnet run --project Panaderia
```

Accede a Swagger: `https://localhost:7001/swagger`

## Flujo de Trabajo

### Crear Nueva Feature

1. **Crear rama desde main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-feature
   ```

2. **Desarrollar y hacer commits:**
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   ```

3. **Subir cambios:**
   ```bash
   git push origin feature/nombre-feature
   ```

4. **Crear Pull Request en GitHub**

### Convención de Commits

Usa prefijos para organizar commits:

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `config:` Cambios de configuración

**Ejemplos:**
```bash
git commit -m "feat: agregar módulo de gestión de clientes"
git commit -m "fix: corregir validación en CreateProductoDto"
git commit -m "docs: actualizar README con nuevos endpoints"
```

## Estándares de Código

### Naming Conventions

- **Clases/Interfaces:** PascalCase (`ProductoService`, `IProductoRepository`)
- **Métodos:** PascalCase con sufijo Async (`CrearAsync`, `ObtenerTodosAsync`)
- **Propiedades:** PascalCase (`ProductoId`, `NombreFiscal`)
- **Campos privados:** camelCase con underscore (`_productoService`, `_context`)
- **Variables/Parámetros:** camelCase (`connectionString`, `dto`)

### Patrones Obligatorios

1. **Dependency Injection:** Siempre inyectar interfaces
2. **Async/Await:** Todas las operaciones I/O deben ser asíncronas
3. **Repository Pattern:** Acceso a datos solo mediante repositorios
4. **DTOs:** Usar DTOs para transferencia de datos entre capas

### Estructura de Archivos

```
Panaderia.Api/Controllers/        # Controllers REST
Panaderia.Application/Services/   # Lógica de negocio
Panaderia.Application/Interfaces/ # Contratos
Panaderia.Application/DTO'S/      # Data Transfer Objects
Panaderia.Domain/Entities/        # Entidades del dominio
Panaderia.Infrastructure/         # Acceso a datos
```

## Crear Nueva Entidad

### 1. Crear Entidad en Domain
```csharp
// Panaderia.Domain/Entities/MiEntidad.cs
public partial class MiEntidad
{
    public int MiEntidadId { get; set; }
    public string Nombre { get; set; } = null!;
}
```

### 2. Agregar DbSet en DbContext
```csharp
// Panaderia.Infrastructure/Persistence/Contexts/PanaderiaDbContext.cs
public virtual DbSet<MiEntidad> MiEntidades { get; set; }
```

### 3. Configurar con Fluent API
```csharp
// En OnModelCreating
modelBuilder.Entity<MiEntidad>(entity =>
{
    entity.HasKey(e => e.MiEntidadId);
    entity.Property(e => e.Nombre).HasMaxLength(150).IsRequired();
});
```

### 4. Crear Migración
```bash
dotnet ef migrations add AgregarMiEntidad --project Panaderia.Infrastructure --startup-project Panaderia
dotnet ef database update --project Panaderia.Infrastructure --startup-project Panaderia
```

### 5. Crear Repository
```csharp
// Interface en Application/Interfaces
public interface IMiEntidadRepository
{
    Task<List<MiEntidad>> ObtenerTodosAsync();
}

// Implementación en Infrastructure/Persistence/Repositories
public class MiEntidadRepository : IMiEntidadRepository
{
    private readonly PanaderiaDbContext _context;
    
    public MiEntidadRepository(PanaderiaDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<MiEntidad>> ObtenerTodosAsync()
    {
        return await _context.MiEntidades.ToListAsync();
    }
}
```

### 6. Crear Service
```csharp
// Interface en Application/Interfaces
public interface IMiEntidadService
{
    Task<bool> CrearAsync(CreateMiEntidadDto dto);
}

// Implementación en Application/Services
public class MiEntidadService : IMiEntidadService
{
    private readonly IMiEntidadRepository _repository;
    
    public MiEntidadService(IMiEntidadRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<bool> CrearAsync(CreateMiEntidadDto dto)
    {
        // Lógica de negocio
        return true;
    }
}
```

### 7. Registrar en Program.cs
```csharp
builder.Services.AddScoped<IMiEntidadRepository, MiEntidadRepository>();
builder.Services.AddScoped<IMiEntidadService, MiEntidadService>();
```

### 8. Crear Controller
```csharp
[ApiController]
[Route("api/[controller]")]
public class MiEntidadController : ControllerBase
{
    private readonly IMiEntidadService _service;
    
    public MiEntidadController(IMiEntidadService service)
    {
        _service = service;
    }
    
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CreateMiEntidadDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
            
        var resultado = await _service.CrearAsync(dto);
        
        if (resultado)
            return Ok(new { Mensaje = "Creado con éxito" });
            
        return StatusCode(500, "Error interno");
    }
}
```

## Comandos Útiles

### Build y Run
```bash
dotnet build
dotnet run --project Panaderia
dotnet watch --project Panaderia  # Hot reload
```

### Entity Framework
```bash
# Crear migración
dotnet ef migrations add NombreMigracion --project Panaderia.Infrastructure --startup-project Panaderia

# Aplicar migraciones
dotnet ef database update --project Panaderia.Infrastructure --startup-project Panaderia

# Revertir migración
dotnet ef migrations remove --project Panaderia.Infrastructure --startup-project Panaderia

# Ver migraciones
dotnet ef migrations list --project Panaderia.Infrastructure --startup-project Panaderia
```

### Git
```bash
git status
git add .
git commit -m "feat: mensaje"
git push
git pull
```

## Troubleshooting

### Error de Connection String
```
SqlException: A network-related or instance-specific error occurred
```
**Solución:** Verificar que SQL Server esté ejecutándose y la connection string sea correcta.

### Error de Migración
```
Unable to create an object of type 'PanaderiaDbContext'
```
**Solución:** Verificar que el proyecto de startup sea correcto (`--startup-project Panaderia`).

### Error de Dependencias
```
The framework 'Microsoft.NETCore.App', version '8.0.0' was not found
```
**Solución:** Instalar .NET 8.0 SDK desde [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/8.0).

## Preguntas

Si tienes dudas, abre un Issue en GitHub o contacta al equipo de desarrollo.

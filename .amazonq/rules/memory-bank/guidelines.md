# Development Guidelines

## Code Quality Standards

### Naming Conventions

#### Classes and Interfaces
- **PascalCase** for all class names: `ProductoService`, `PanaderiaDbContext`, `ProductoRepository`
- **Interface prefix "I"**: `IProductoService`, `IProductoRepository`
- **Descriptive names** that reflect purpose: `CreateProductoDto` (not just `ProductoDto`)
- **Suffix patterns**:
  - Services: `ProductoService`
  - Repositories: `ProductoRepository`
  - Controllers: `ProductoController` (singular, not plural)
  - DTOs: `CreateProductoDto`, `UpdateProductoDto`
  - DbContext: `PanaderiaDbContext`

#### Properties and Fields
- **PascalCase** for public properties: `ClienteId`, `NombreFiscal`, `PrecioVenta`
- **camelCase with underscore prefix** for private fields: `_productoService`, `_repository`, `_context`
- **Suffix "Id"** for foreign keys: `ProductoId`, `SucursalId`, `EmpleadoId` (not `ProductoID` in code)

#### Methods
- **PascalCase** with action verbs: `CrearAsync`, `ObtenerTodosAsync`, `OnModelCreating`
- **Async suffix** for asynchronous methods: `CrearAsync`, `ObtenerTodosAsync`
- **Descriptive action names**: `CrearProducto` (not just `Create`)

#### Variables and Parameters
- **camelCase**: `connectionString`, `modelBuilder`, `dto`, `resultado`
- **Descriptive names**: `productoService` (not `ps` or `service`)

### File Organization

#### Namespace Structure
- Follow folder structure exactly: `Panaderia.Infrastructure.Persistence.Contexts`
- One namespace per file matching physical location
- No nested namespaces within a single file

#### Using Statements
- Place all using statements at the top of file
- Group by: System namespaces first, then third-party, then project namespaces
- Include explanatory comments when adding critical dependencies:
```csharp
using Microsoft.EntityFrameworkCore; // <--- Faltaba para SQL Server
using Panaderia.Application.Interfaces;
using Panaderia.Infrastructure.Persistence.Contexts; // <--- Faltaba para el DbContext
```

#### Class Structure Order
1. Private fields (with underscore prefix)
2. Constructors
3. Public properties (DbSet properties in DbContext)
4. Public methods
5. Protected/override methods (like `OnModelCreating`)
6. Partial method declarations (like `OnModelCreatingPartial`)

### Code Formatting

#### Bracing Style
- **Opening brace on same line** for short constructors and simple methods:
```csharp
public PanaderiaDbContext(){
}
```
- **Opening brace on new line** for complex methods and class declarations:
```csharp
public partial class PanaderiaDbContext : DbContext
{
    // content
}
```

#### Indentation
- 4 spaces per indentation level (no tabs)
- Consistent indentation in fluent API chains:
```csharp
entity.HasOne(d => d.TipoCliente).WithMany(p => p.Clientes)
    .HasForeignKey(d => d.TipoClienteId)
    .OnDelete(DeleteBehavior.ClientSetNull)
    .HasConstraintName("FK_Cliente_Tipo");
```

#### Line Length
- Keep lines readable, break long fluent API chains across multiple lines
- Each fluent method call on its own line when chaining 3+ methods

### Documentation Standards

#### Inline Comments
- Use Spanish for comments (matching team language)
- Explain **why**, not **what**: 
```csharp
// Inyección de dependencias en acción: el contenedor te pasa el servicio
```
- Add comments for non-obvious business logic
- Use section headers for logical groupings:
```csharp
// ---------------------------------------------------------
// 1. CONFIGURACIÓN DE BASE DE DATOS
// ---------------------------------------------------------
```

#### XML Documentation
- Not currently used in codebase, but recommended for public APIs
- Consider adding for interfaces and DTOs

## Semantic Patterns

### Dependency Injection Pattern (100% of services)

#### Constructor Injection
Always use constructor injection for dependencies:
```csharp
private readonly IProductoService _productoService;

public ProductoController(IProductoService productoService)
{
    _productoService = productoService;
}
```

#### Service Registration
Register services in Program.cs with appropriate lifetime:
```csharp
// Repositories: Scoped (per request)
builder.Services.AddScoped<IProductoRepository, ProductoRepository>();

// Services: Scoped (per request)
builder.Services.AddScoped<IProductoService, ProductoService>();

// DbContext: Scoped (per request)
builder.Services.AddDbContext<PanaderiaDbContext>(options =>
    options.UseSqlServer(connectionString));
```

**Order matters**: Register repositories before services that depend on them.

### Async/Await Pattern (100% of I/O operations)

#### Method Signatures
- Always return `Task` or `Task<T>` for async methods
- Always suffix with `Async`: `CrearAsync`, `ObtenerTodosAsync`
- Use `async` keyword in implementation

#### Usage
```csharp
// Interface
Task<bool> CrearAsync(CreateProductoDto dto);

// Implementation
public async Task<bool> CrearAsync(CreateProductoDto dto)
{
    return await _repository.ObtenerTodosAsync();
}

// Controller
var resultado = await _productoService.CrearAsync(dto);
```

**Never block on async**: Don't use `.Result` or `.Wait()`

### Repository Pattern (100% of data access)

#### Interface Definition (Application Layer)
```csharp
public interface IProductoRepository
{
    Task<List<Producto>> ObtenerTodosAsync();
}
```

#### Implementation (Infrastructure Layer)
```csharp
public class ProductoRepository : IProductoRepository
{
    private readonly PanaderiaDbContext _context;

    public ProductoRepository(PanaderiaDbContext context)
    {
        _context = context;
    }

    public async Task<List<Producto>> ObtenerTodosAsync()
    {
        return await _context.Productos.ToListAsync();
    }
}
```

**Key principle**: Application layer defines interface, Infrastructure implements it.

### Service Layer Pattern (100% of business logic)

#### Service Structure
```csharp
public class ProductoService : IProductoService
{
    private readonly IProductoRepository _repository;

    public ProductoService(IProductoRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> CrearAsync(CreateProductoDto dto)
    {
        // Business logic here
        return await _repository.ObtenerTodosAsync();
    }
}
```

**Responsibility**: Orchestrate business logic, coordinate repositories, never access DbContext directly.

### Controller Pattern (100% of API endpoints)

#### Controller Structure
```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductoController : ControllerBase
{
    private readonly IProductoService _productoService;

    public ProductoController(IProductoService productoService)
    {
        _productoService = productoService;
    }

    [HttpPost]
    public async Task<IActionResult> CrearProducto([FromBody] CreateProductoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var resultado = await _productoService.CrearAsync(dto);

        if (resultado)
        {
            return Ok(new { Mensaje = "Producto horneado y guardado con éxito 🥖" });
        }

        return StatusCode(500, "Hubo un problema en el horno (error interno).");
    }
}
```

#### Controller Responsibilities
- Validate ModelState
- Call service layer
- Return appropriate HTTP status codes
- Transform results to HTTP responses
- **Never** contain business logic
- **Never** access repositories directly

#### HTTP Status Codes
- `200 OK`: Successful operation
- `400 BadRequest`: Invalid input (ModelState)
- `500 StatusCode(500)`: Internal server error

### Entity Framework Core Patterns

#### DbContext Configuration
```csharp
public partial class PanaderiaDbContext : DbContext
{
    public PanaderiaDbContext(){}
    
    public PanaderiaDbContext(DbContextOptions<PanaderiaDbContext> options)
        : base(options){}

    public virtual DbSet<Producto> Productos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Fluent API configuration
        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
```

**Pattern**: Partial class with partial method for extensibility.

#### Fluent API Configuration
Always configure entities in `OnModelCreating`:

```csharp
modelBuilder.Entity<Producto>(entity =>
{
    // Primary Key
    entity.HasKey(e => e.ProductoId).HasName("PK__Producto__A430AE83898982AF");

    // Properties
    entity.Property(e => e.ProductoId).HasColumnName("ProductoID");
    entity.Property(e => e.Nombre)
        .HasMaxLength(150)
        .IsUnicode(false);
    entity.Property(e => e.PrecioVenta).HasColumnType("decimal(10, 2)");
    entity.Property(e => e.EsVendible).HasDefaultValue(true);

    // Relationships
    entity.HasOne(d => d.TipoProducto).WithMany(p => p.Productos)
        .HasForeignKey(d => d.TipoProductoId)
        .OnDelete(DeleteBehavior.ClientSetNull)
        .HasConstraintName("FK_Producto_Tipo");
});
```

#### Configuration Order
1. Primary key with constraint name
2. Indexes (unique, composite)
3. Column mappings (HasColumnName)
4. Property configurations (MaxLength, IsUnicode, HasColumnType)
5. Default values
6. Computed columns
7. Relationships (HasOne/WithMany)

#### Relationship Patterns
```csharp
// One-to-Many with required foreign key
entity.HasOne(d => d.Sucursal).WithMany(p => p.Inventarios)
    .HasForeignKey(d => d.SucursalId)
    .OnDelete(DeleteBehavior.ClientSetNull)
    .HasConstraintName("FK_Inventario_Sucursal");

// One-to-Many with optional foreign key
entity.HasOne(d => d.Cliente).WithMany(p => p.Venta)
    .HasForeignKey(d => d.ClienteId)
    .HasConstraintName("FK_Venta_Cliente");
```

**Delete Behavior**: Use `ClientSetNull` for required relationships, omit for optional.

#### Unique Constraints
```csharp
// Single column unique
entity.HasIndex(e => e.Email, "UQ_Cliente_Email").IsUnique();

// Composite unique
entity.HasIndex(e => new { e.SucursalId, e.ProductoId }, "UQ_Inventario_Producto_Sucursal").IsUnique();
```

#### Computed Columns
```csharp
entity.Property(e => e.Importe)
    .HasComputedColumnSql("([Cantidad]*[PrecioUnitario])", false)
    .HasColumnType("decimal(21, 5)");
```

#### Default Values
```csharp
// Static default
entity.Property(e => e.EsVendible).HasDefaultValue(true);
entity.Property(e => e.Estatus).HasDefaultValue("Completada");

// SQL function default
entity.Property(e => e.FechaHora)
    .HasDefaultValueSql("(getdate())")
    .HasColumnType("datetime");
```

### DTO Pattern

#### DTO Naming
- Prefix with action: `CreateProductoDto`, `UpdateProductoDto`
- Suffix with `Dto`
- Place in `DTO'S` folder (note apostrophe)

#### DTO Structure
```csharp
public class CreateProductoDto
{
    // Only properties needed for creation
    // No navigation properties
    // Validation attributes if needed
}
```

**Purpose**: Transfer data between layers, not domain entities.

## Architectural Patterns

### Clean Architecture Layers

#### Dependency Flow
```
API → Application → Domain
  ↓
Infrastructure → Application
              → Domain
```

**Rule**: Dependencies always point inward toward Domain.

#### Layer Responsibilities

**Domain Layer** (Panaderia.Domain):
- Pure entities with no dependencies
- Business rules and domain logic
- No framework dependencies
- No infrastructure concerns

**Application Layer** (Panaderia.Application):
- Use case orchestration
- Service interfaces and implementations
- Repository interfaces (not implementations)
- DTOs for data transfer
- Depends only on Domain

**Infrastructure Layer** (Panaderia.Infrastructure):
- Repository implementations
- DbContext and EF Core configurations
- External service integrations
- Depends on Application and Domain

**API Layer** (Panaderia):
- Controllers and HTTP concerns
- Dependency injection configuration
- Middleware pipeline
- Depends on Application and Infrastructure

### Separation of Concerns

#### Controllers
- HTTP request/response handling
- Model validation
- Status code selection
- **No business logic**

#### Services
- Business logic orchestration
- DTO to entity mapping
- Transaction coordination
- **No HTTP concerns**

#### Repositories
- Data access only
- CRUD operations
- Query composition
- **No business logic**

#### Entities
- Domain models
- Navigation properties
- **No persistence logic**

## Common Code Idioms

### Readonly Fields
Always use `readonly` for injected dependencies:
```csharp
private readonly IProductoService _productoService;
```

### Virtual DbSet Properties
DbSet properties should be `virtual` for mocking:
```csharp
public virtual DbSet<Producto> Productos { get; set; }
```

### ModelState Validation
Always validate before processing:
```csharp
if (!ModelState.IsValid)
{
    return BadRequest(ModelState);
}
```

### Configuration from appsettings
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
```

### Lambda Expressions in Fluent API
Use consistent parameter naming:
- `entity` or `e` for entity being configured
- `d` for dependent entity (foreign key side)
- `p` for principal entity (primary key side)

```csharp
modelBuilder.Entity<Cliente>(entity =>
{
    entity.HasOne(d => d.TipoCliente).WithMany(p => p.Clientes)
        .HasForeignKey(d => d.TipoClienteId);
});
```

## Frequently Used Annotations

### Controller Annotations
```csharp
[ApiController]              // Enables API-specific behaviors
[Route("api/[controller]")]  // Route template
[HttpPost]                   // HTTP method
[FromBody]                   // Parameter binding
```

### Entity Framework Annotations
Not used in this codebase - Fluent API is preferred for all configurations.

## Best Practices

### Dependency Injection
1. Always inject interfaces, never concrete types
2. Use constructor injection exclusively
3. Register services with appropriate lifetime (Scoped for per-request)
4. Register dependencies in correct order in Program.cs

### Async Programming
1. Use async/await for all I/O operations
2. Suffix async methods with `Async`
3. Return `Task` or `Task<T>`
4. Never block on async code

### Entity Framework
1. Use Fluent API over data annotations
2. Always specify constraint names for foreign keys
3. Configure all properties explicitly (don't rely on conventions)
4. Use `ClientSetNull` for required relationships
5. Use `virtual` for navigation properties and DbSet properties

### Clean Architecture
1. Never reference Infrastructure from Application
2. Define interfaces in Application, implement in Infrastructure
3. Keep Domain free of all dependencies
4. Controllers should only call services, never repositories

### Error Handling
1. Validate ModelState in controllers
2. Return appropriate HTTP status codes
3. Provide meaningful error messages
4. Consider using structured error responses

### Code Comments
1. Write comments in Spanish (team language)
2. Explain why, not what
3. Use section headers for logical groupings
4. Add comments for non-obvious business decisions

### Naming
1. Use descriptive names over short abbreviations
2. Follow established suffix patterns (Service, Repository, Controller, Dto)
3. Use PascalCase for public members, camelCase with underscore for private fields
4. Suffix async methods with `Async`ipo");
});
```

#### Configuration Order
1. Primary key with constraint name
2. Indexes (unique, composite)
3. Column mappings (HasColumnName)
4. Property configurations (MaxLength, IsUnicode, HasColumnType)
5. Default values
6. Computed columns
7. Relationships (HasOne/WithMany)

#### Relationship Patterns
```csharp
// One-to-Many with required foreign key
entity.HasOne(d => d.Sucursal).WithMany(p => p.Inventarios)
    .HasForeignKey(d => d.SucursalId)
    .OnDelete(DeleteBehavior.ClientSetNull)
    .HasConstraintName("FK_Inventario_Sucursal");

// One-to-Many with optional foreign key
entity.HasOne(d => d.Cliente).WithMany(p => p.Venta)
    .HasForeignKey(d => d.ClienteId)
    .HasConstraintName("FK_Venta_Cliente");
```

**Delete Behavior**: Use `ClientSetNull` for required relationships, omit for optional.

#### Unique Constraints
```csharp
// Single column unique
entity.HasIndex(e => e.Email, "UQ_Cliente_Email").IsUnique();

// Composite unique
entity.HasIndex(e => new { e.SucursalId, e.ProductoId }, "UQ_Inventario_Producto_Sucursal").IsUnique();
```

#### Computed Columns
```csharp
entity.Property(e => e.Importe)
    .HasComputedColumnSql("([Cantidad]*[PrecioUnitario])", false)
    .HasColumnType("decimal(21, 5)");
```

#### Default Values
```csharp
// Static default
entity.Property(e => e.EsVendible).HasDefaultValue(true);
entity.Property(e => e.Estatus).HasDefaultValue("Completada");

// SQL function default
entity.Property(e => e.FechaHora)
    .HasDefaultValueSql("(getdate())")
    .HasColumnType("datetime");
```

### DTO Pattern

#### DTO Naming
- Prefix with action: `CreateProductoDto`, `UpdateProductoDto`
- Suffix with `Dto`
- Place in `DTO'S` folder (note apostrophe)

#### DTO Structure
```csharp
public class CreateProductoDto
{
    // Only properties needed for creation
    // No navigation properties
    // Validation attributes if needed
}
```

**Purpose**: Transfer data between layers, not domain entities.

## Architectural Patterns

### Clean Architecture Layers

#### Dependency Flow
```
API → Application → Domain
  ↓
Infrastructure → Application
              → Domain
```

**Rule**: Dependencies always point inward toward Domain.

#### Layer Responsibilities

**Domain Layer** (Panaderia.Domain):
- Pure entities with no dependencies
- Business rules and domain logic
- No framework dependencies
- No infrastructure concerns

**Application Layer** (Panaderia.Application):
- Use case orchestration
- Service interfaces and implementations
- Repository interfaces (not implementations)
- DTOs for data transfer
- Depends only on Domain

**Infrastructure Layer** (Panaderia.Infrastructure):
- Repository implementations
- DbContext and EF Core configurations
- External service integrations
- Depends on Application and Domain

**API Layer** (Panaderia):
- Controllers and HTTP concerns
- Dependency injection configuration
- Middleware pipeline
- Depends on Application and Infrastructure

### Separation of Concerns

#### Controllers
- HTTP request/response handling
- Model validation
- Status code selection
- **No business logic**

#### Services
- Business logic orchestration
- DTO to entity mapping
- Transaction coordination
- **No HTTP concerns**

#### Repositories
- Data access only
- CRUD operations
- Query composition
- **No business logic**

#### Entities
- Domain models
- Navigation properties
- **No persistence logic**

## Common Code Idioms

### Readonly Fields
Always use `readonly` for injected dependencies:
```csharp
private readonly IProductoService _productoService;
```

### Virtual DbSet Properties
DbSet properties should be `virtual` for mocking:
```csharp
public virtual DbSet<Producto> Productos { get; set; }
```

### ModelState Validation
Always validate before processing:
```csharp
if (!ModelState.IsValid)
{
    return BadRequest(ModelState);
}
```

### Configuration from appsettings
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
```

### Lambda Expressions in Fluent API
Use consistent parameter naming:
- `entity` or `e` for entity being configured
- `d` for dependent entity (foreign key side)
- `p` for principal entity (primary key side)

```csharp
modelBuilder.Entity<Cliente>(entity =>
{
    entity.HasOne(d => d.TipoCliente).WithMany(p => p.Clientes)
        .HasForeignKey(d => d.TipoClienteId);
});
```

## Frequently Used Annotations

### Controller Annotations
```csharp
[ApiController]              // Enables API-specific behaviors
[Route("api/[controller]")]  // Route template
[HttpPost]                   // HTTP method
[FromBody]                   // Parameter binding
```

### Entity Framework Annotations
Not used in this codebase - Fluent API is preferred for all configurations.

## Best Practices

### Dependency Injection
1. Always inject interfaces, never concrete types
2. Use constructor injection exclusively
3. Register services with appropriate lifetime (Scoped for per-request)
4. Register dependencies in correct order in Program.cs

### Async Programming
1. Use async/await for all I/O operations
2. Suffix async methods with `Async`
3. Return `Task` or `Task<T>`
4. Never block on async code

### Entity Framework
1. Use Fluent API over data annotations
2. Always specify constraint names for foreign keys
3. Configure all properties explicitly (don't rely on conventions)
4. Use `ClientSetNull` for required relationships
5. Use `virtual` for navigation properties and DbSet properties

### Clean Architecture
1. Never reference Infrastructure from Application
2. Define interfaces in Application, implement in Infrastructure
3. Keep Domain free of all dependencies
4. Controllers should only call services, never repositories

### Error Handling
1. Validate ModelState in controllers
2. Return appropriate HTTP status codes
3. Provide meaningful error messages
4. Consider using structured error responses

### Code Comments
1. Write comments in Spanish (team language)
2. Explain why, not what
3. Use section headers for logical groupings
4. Add comments for non-obvious business decisions

### Naming
1. Use descriptive names over short abbreviations
2. Follow established suffix patterns (Service, Repository, Controller, Dto)
3. Use PascalCase for public members, camelCase with underscore for private fields
4. Suffix async methods with `Async`

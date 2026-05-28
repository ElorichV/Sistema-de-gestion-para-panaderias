using Microsoft.EntityFrameworkCore; // <--- Faltaba para SQL Server
using Panaderia.Application.Interfaces;
using Panaderia.Application.Services;
using Panaderia.Infrastructure.Persistence.Contexts; // <--- Faltaba para el DbContext
using Panaderia.Infrastructure.Persistence.Repositories; // <--- Faltaba para el Repositorio

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// ---------------------------------------------------------
// 1. CONFIGURACI�N DE BASE DE DATOS
// ---------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<PanaderiaDbContext>(options =>
    options.UseSqlServer(connectionString));

// ---------------------------------------------------------
// 2. INYECCI�N DE DEPENDENCIAS (EL ORDEN IMPORTA)
// ---------------------------------------------------------

// A. Primero el Repositorio (Capa Infraestructura) <--- FALTABA ESTO
builder.Services.AddScoped<IProductoRepository, ProductoRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IVentaRepository, VentaRepository>();

// B. Luego el Servicio (Capa Aplicaci�n)
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IVentaService, VentaService>();

// ---------------------------------------------------------

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
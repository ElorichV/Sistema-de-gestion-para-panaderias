using Microsoft.EntityFrameworkCore;
using Panaderia.Application.Interfaces;
using Panaderia.Application.Services;
using Panaderia.Infrastructure.Persistence.Contexts;
using Panaderia.Infrastructure.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// ---------------------------------------------------------
// 1. CONFIGURACIÓN DE CORS (Habilitación para cliente web React)
// ---------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ---------------------------------------------------------
// 2. CONFIGURACIÓN DE BASE DE DATOS
// ---------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<PanaderiaDbContext>(options =>
    options.UseSqlServer(connectionString));

// ---------------------------------------------------------
// 3. INYECCIÓN DE DEPENDENCIAS (Clean Architecture)
// ---------------------------------------------------------

// A. Repositorios (Capa Infraestructura)
builder.Services.AddScoped<IProductoRepository, ProductoRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IVentaRepository, VentaRepository>();
builder.Services.AddScoped<IInventarioRepository, InventarioRepository>();

// B. Servicios de Aplicación (Capa Aplicación)
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IVentaService, VentaService>();
builder.Services.AddScoped<IInventarioService, InventarioService>();

// ---------------------------------------------------------
// 4. DOCUMENTACIÓN SWAGGER / OPENAPI
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

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

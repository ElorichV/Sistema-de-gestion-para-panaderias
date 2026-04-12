# Setup y Configuración del Proyecto

## Configuración de Base de Datos

### 1. Requisitos Previos
- SQL Server 2019+ o SQL Server Express
- .NET 8.0 SDK instalado
- Visual Studio 2022 o JetBrains Rider

### 2. Configurar Connection String
Edita `Panaderia/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Variaciones de Connection String:**

```json
// Para SQL Server con autenticación Windows
"DefaultConnection": "Server=localhost;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;"

// Para SQL Server con usuario y contraseña
"DefaultConnection": "Server=localhost;Database=PanaderiaDB;User Id=tu_usuario;Password=tu_contraseña;TrustServerCertificate=True;"

// Para SQL Server Express
"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=PanaderiaDB;Trusted_Connection=True;TrustServerCertificate=True;"

// Para Azure SQL Database
"DefaultConnection": "Server=tcp:tu-servidor.database.windows.net,1433;Database=PanaderiaDB;User ID=tu_usuario;Password=tu_contraseña;Encrypt=True;TrustServerCertificate=False;"
```

### 3. Crear y Aplicar Migraciones

```bash
# Navegar al directorio del proyecto
cd "c:\Proyectos\Proyecto Panaderia"

# Crear la migración inicial
dotnet ef migrations add InitialCreate --project Panaderia.Infrastructure --startup-project Panaderia

# Aplicar la migración (crear la base de datos)
dotnet ef database update --project Panaderia.Infrastructure --startup-project Panaderia

# Verificar que la base de datos se creó correctamente
dotnet ef migrations list --project Panaderia.Infrastructure --startup-project Panaderia
```

### 4. Comandos Útiles de Base de Datos

```bash
# Ver el estado de las migraciones
dotnet ef migrations list --project Panaderia.Infrastructure --startup-project Panaderia

# Generar script SQL de la migración
dotnet ef migrations script --project Panaderia.Infrastructure --startup-project Panaderia

# Revertir la última migración
dotnet ef migrations remove --project Panaderia.Infrastructure --startup-project Panaderia

# Actualizar a una migración específica
dotnet ef database update NombreMigracion --project Panaderia.Infrastructure --startup-project Panaderia

# Eliminar la base de datos (¡CUIDADO!)
dotnet ef database drop --project Panaderia.Infrastructure --startup-project Panaderia
```

### 5. Verificar la Instalación
Ejecuta la aplicación y verifica que Swagger funcione:

```bash
dotnet run --project Panaderia
```

Accede a: `https://localhost:7001/swagger`

## Configuración de GitHub

### 1. Inicializar Repositorio Local

```bash
# Navegar al directorio del proyecto
cd "c:\Proyectos\Proyecto Panaderia"

# Inicializar Git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: Sistema de gestión para panaderías con Clean Architecture"
```

### 2. Crear .gitignore
Crear archivo `.gitignore` en la raíz del proyecto:

```gitignore
# Build results
[Dd]ebug/
[Dd]ebugPublic/
[Rr]elease/
[Rr]eleases/
x64/
x86/
[Ww][Ii][Nn]32/
[Aa][Rr][Mm]/
[Aa][Rr][Mm]64/
bld/
[Bb]in/
[Oo]bj/
[Ll]og/
[Ll]ogs/

# Visual Studio 2015/2017 cache/options directory
.vs/

# Visual Studio Code
.vscode/

# JetBrains Rider
.idea/
*.sln.iml

# User-specific files
*.rsuser
*.suo
*.user
*.userosscache
*.sln.docstates

# Windows image file caches
Thumbs.db
ehthumbs.db

# Folder config file
Desktop.ini

# Recycle Bin used on file shares
$RECYCLE.BIN/

# VS Code directories
.vscode/

# Mac
.DS_Store

# Entity Framework
*.edmx.diagram
*.edmx.sql

# NuGet Packages
*.nupkg
**/packages/*
!**/packages/build/

# SQL Server files
*.mdf
*.ldf
*.ndf

# Connection strings (security)
appsettings.Production.json
appsettings.Staging.json

# Logs
logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.production
.env.local
.env.development.local
.env.test.local
.env.production.local

# Temporary folders
tmp/
temp/
```

### 3. Crear Repositorio en GitHub

**Opción A: Desde GitHub Web**
1. Ve a [github.com](https://github.com)
2. Click en "New repository"
3. Nombre: `sistema-panaderia` o `panaderia-management-system`
4. Descripción: "Sistema de gestión integral para panaderías con Clean Architecture (.NET 8)"
5. Selecciona "Public" o "Private"
6. **NO** marques "Initialize with README" (ya tienes archivos)
7. Click "Create repository"

**Opción B: Desde GitHub CLI**
```bash
# Instalar GitHub CLI si no lo tienes
# https://cli.github.com/

# Crear repositorio
gh repo create sistema-panaderia --public --description "Sistema de gestión integral para panaderías con Clean Architecture (.NET 8)"
```

### 4. Conectar Repositorio Local con GitHub

```bash
# Agregar el remote origin (reemplaza TU_USUARIO con tu username)
git remote add origin https://github.com/TU_USUARIO/sistema-panaderia.git

# Verificar el remote
git remote -v

# Subir el código por primera vez
git branch -M main
git push -u origin main
```

### 5. Comandos Git Básicos para el Proyecto

```bash
# Ver estado de archivos
git status

# Agregar archivos modificados
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat: implementar módulo de productos con CRUD completo"

# Subir cambios
git push

# Ver historial de commits
git log --oneline

# Crear nueva rama para feature
git checkout -b feature/modulo-clientes

# Cambiar entre ramas
git checkout main
git checkout feature/modulo-clientes

# Mergear rama a main
git checkout main
git merge feature/modulo-clientes

# Eliminar rama después del merge
git branch -d feature/modulo-clientes
```

### 6. Estructura de Commits Recomendada

Usa prefijos para organizar los commits:

```bash
# Nuevas características
git commit -m "feat: agregar módulo de gestión de clientes"

# Corrección de bugs
git commit -m "fix: corregir validación en CreateProductoDto"

# Documentación
git commit -m "docs: actualizar README con instrucciones de instalación"

# Refactoring
git commit -m "refactor: mejorar estructura de servicios"

# Configuración
git commit -m "config: agregar configuración de Entity Framework"

# Tests
git commit -m "test: agregar tests unitarios para ProductoService"
```

### 7. Configurar README.md para GitHub

El archivo `README.md` ya está completo y optimizado para GitHub. Incluye:
- Badges de tecnologías
- Instrucciones de instalación
- Documentación de API
- Estructura del proyecto
- Comandos útiles

### 8. Configurar GitHub Actions (Opcional)

Crear `.github/workflows/dotnet.yml` para CI/CD:

```yaml
name: .NET Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 8.0.x
        
    - name: Restore dependencies
      run: dotnet restore
      
    - name: Build
      run: dotnet build --no-restore
      
    - name: Test
      run: dotnet test --no-build --verbosity normal
```

## Comandos de Verificación Final

```bash
# Verificar que todo funciona
dotnet build
dotnet run --project Panaderia

# Verificar Git
git status
git log --oneline -5

# Verificar base de datos
dotnet ef migrations list --project Panaderia.Infrastructure --startup-project Panaderia
```

## Troubleshooting Común

### Error de Connection String
```
SqlException: A network-related or instance-specific error occurred
```
**Solución**: Verificar que SQL Server esté ejecutándose y la connection string sea correcta.

### Error de Migración
```
Unable to create an object of type 'PanaderiaDbContext'
```
**Solución**: Verificar que el proyecto de startup sea correcto (`--startup-project Panaderia`).

### Error de Git Push
```
remote: Repository not found
```
**Solución**: Verificar que el remote origin esté configurado correctamente y tengas permisos.

### Error de Dependencias
```
The framework 'Microsoft.NETCore.App', version '8.0.0' was not found
```
**Solución**: Instalar .NET 8.0 SDK desde [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/8.0).